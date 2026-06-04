import { BadRequestException, Injectable } from "@nestjs/common";
import { Payment, PaymentRefund, Preference } from 'mercadopago';
import { PreferenceResponse } from "mercadopago/dist/clients/preference/commonTypes";
import { getFrontendUrl } from "../config/frontend-url";
import { MpCheckoutProService } from "../integrations/mercado-pago/mp-checkoutPro.service";
import { SupabaseService } from "../integrations/supabase/supabase.service";
import { ClasePayload, CreatePreferenceBody } from "./pagos.controller";
import { CLASS_UNIT_PRICE } from "./class-price.constant";
import { repartirMontoAFavorEntreClases } from "./inscripcion-desglose.util";

export { CLASS_UNIT_PRICE } from "./class-price.constant";

type PagoInsert = {
    id_cliente: number;
    fecha: string;
    hora: string;
    id_pago: string;
};

type SeInscribeInsert = {
    id_clase: number;
    id_cliente: number;
    estado: string;
    id_pago_mp: string | null;
    monto_mp: number;
    monto_saldo: number;
};

function leerMetadataPago(metadata: Record<string, unknown> | undefined) {
    const clases = (metadata?.clases ?? []) as ClasePayload[];
    const idCliente = Number(
        metadata?.clienteId ?? metadata?.cliente_id,
    );
    const montoAFavorAplicado = Number(
        metadata?.montoAFavorAplicado ?? metadata?.monto_a_favor_aplicado,
    ) || 0;

    return { clases, idCliente, montoAFavorAplicado };
}

@Injectable()
export class PagosService {

    constructor(
        private readonly mpCheckoutProService: MpCheckoutProService,
        private readonly supabaseService: SupabaseService,
    ) { }

    async createPreference(body: CreatePreferenceBody): Promise<{ initPoint: string }> {
        const { clases, clienteId, montoAFavorAplicado = 0 } = body;
        if (!clases?.length) {
            throw new BadRequestException("Debe incluir al menos una clase.");
        }
        if (!clienteId || clienteId < 1) {
            throw new BadRequestException("clienteId inválido.");
        }

        const subtotal = clases.length * CLASS_UNIT_PRICE;
        if (montoAFavorAplicado < 0 || montoAFavorAplicado > subtotal) {
            throw new BadRequestException("Monto a favor aplicado inválido.");
        }

        const totalFinal = subtotal - montoAFavorAplicado;
        if (totalFinal <= 0) {
            throw new BadRequestException(
                "El total final debe ser mayor a 0 para usar Mercado Pago. Usá inscribir-con-saldo."
            );
        }
        const frontendUrl = getFrontendUrl();
        const preference = new Preference(this.mpCheckoutProService.client);
        return preference.create({
            body: {
                items: [{
                    id: "inscripcion-kinescius",
                    title: `Inscripción a ${clases.length} clase(s) - Kinescius`,
                    quantity: 1,
                    unit_price: totalFinal,
                }],
                metadata: {
                    clases,
                    clienteId,
                    montoAFavorAplicado,
                },
                back_urls: {
                    success: `https://f3ab-2800-810-5c2-569-3461-666-84ef-4044.ngrok-free.app/success`, // Forwarding de ngrok
                    failure: `${frontendUrl}/failure`,
                    pending: `${frontendUrl}/pending`,
                },
                auto_return: "approved",
            },
        }).then((res: PreferenceResponse) => ({ initPoint: res.init_point! }))
            .catch((error: Error) => { throw new Error(error.message); });
    }

    async preferenceNotification(paymentId: string) {

        const paymentClient = new Payment(this.mpCheckoutProService.client);
        const payment = await paymentClient.get({ id: paymentId });
        if (payment.status !== 'approved') {
            return { received: true, status: payment.status };
        }

        const { clases, idCliente, montoAFavorAplicado } = leerMetadataPago(
            payment.metadata as Record<string, unknown> | undefined,
        );

        if (!idCliente || !clases.length) {
            throw new BadRequestException('Metadata de pago incompleta.');
        }

        const desgloses = repartirMontoAFavorEntreClases(
            clases,
            montoAFavorAplicado,
            paymentId,
        );
        const now = new Date();

        const pago: PagoInsert = {
            id_cliente: idCliente,
            fecha: now.toISOString().split('T')[0],
            hora: now.toTimeString().split(' ')[0],
            id_pago: paymentId,
        };

        const { error: pagoError } = await this.supabaseService.client
            .from('Pago')
            .insert(pago);

        if (pagoError) throw new Error(pagoError.message);

        const inscripciones: SeInscribeInsert[] = clases.map((clase, index) => ({
            id_clase: clase.id,
            id_cliente: idCliente,
            estado: "pagado",
            id_pago_mp: desgloses[index].id_pago_mp,
            monto_mp: desgloses[index].monto_mp,
            monto_saldo: desgloses[index].monto_saldo,
        }));

        const { error: inscripcionError } = await this.supabaseService.client
            .from('Se_inscribe')
            .insert(inscripciones);

        if (inscripcionError) throw new Error(inscripcionError.message);

        if (montoAFavorAplicado > 0) {
            await this.deductMontoAFavor(idCliente, montoAFavorAplicado);
        }

        return { received: true };
    }

    async acreditarMontoAFavor(clienteId: number, amount: number) {
        if (amount <= 0) return;

        const { data: cliente, error: fetchError } = await this.supabaseService.client
            .from('Cliente')
            .select('monto_a_favor')
            .eq('id', clienteId)
            .single();

        if (fetchError || !cliente) {
            throw new Error(`Error al obtener saldo del cliente: ${fetchError?.message}`);
        }

        const saldoActual = Number(cliente.monto_a_favor) || 0;
        const nuevoSaldo = saldoActual + amount;

        const { error: updateError } = await this.supabaseService.client
            .from('Cliente')
            .update({ monto_a_favor: nuevoSaldo })
            .eq('id', clienteId);

        if (updateError) {
            throw new Error(`Error al acreditar monto a favor: ${updateError.message}`);
        }
    }

    private async deductMontoAFavor(clienteId: number, amount: number) {
        const { data: cliente, error: fetchError } = await this.supabaseService.client
            .from('Cliente')
            .select('monto_a_favor')
            .eq('id', clienteId)
            .single();

        if (fetchError || !cliente) {
            throw new Error(`Error al obtener saldo del cliente: ${fetchError?.message}`);
        }

        const saldoActual = Number(cliente.monto_a_favor) || 0;
        const nuevoSaldo = Math.max(0, saldoActual - amount);

        const { error: updateError } = await this.supabaseService.client
            .from('Cliente')
            .update({ monto_a_favor: nuevoSaldo })
            .eq('id', clienteId);

        if (updateError) {
            throw new Error(`Error al descontar monto a favor: ${updateError.message}`);
        }
    }

    async getPago(id: string) {
        const pagoClient = new Payment(this.mpCheckoutProService.client);
        const pago = await pagoClient.get({ id });
        return pago;
    }

    async createPartialRefund(idPago: string, amount: number) {
        if (amount <= 0) {
            throw new BadRequestException('El monto de reembolso debe ser mayor a 0.');
        }

        const payment = await this.getPago(idPago);
        if (payment.status !== 'approved') {
            throw new BadRequestException('El pago no está aprobado para reembolso.');
        }

        const refunds = await this.getAllRefunds(idPago);
        const totalRefunded = (refunds ?? []).reduce(
            (sum, refund) => sum + (Number(refund.amount) || 0),
            0,
        );
        const paidAmount = Number(payment.transaction_amount) || 0;

        if (totalRefunded + amount > paidAmount) {
            throw new BadRequestException(
                'El monto de reembolso excede el saldo disponible del pago.',
            );
        }

        const refundClient = new PaymentRefund(this.mpCheckoutProService.client);
        return refundClient.create({
            payment_id: idPago,
            body: { amount },
        });
    }

    async createRefund(idPago: string) {
        const refundClient = new PaymentRefund(this.mpCheckoutProService.client);
        const refund = await refundClient.total({ payment_id: idPago });
        return refund;
    }

    async getAllRefunds(idPago: string) {
        const refundClient = new PaymentRefund(this.mpCheckoutProService.client);
        const refunds = await refundClient.list({ payment_id: idPago });
        return refunds;
    }
}
