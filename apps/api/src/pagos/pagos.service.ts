import { Injectable } from "@nestjs/common";
import { Payment, PaymentRefund, Preference } from 'mercadopago';
import { PreferenceResponse } from "mercadopago/dist/clients/preference/commonTypes";
import { MpCheckoutProService } from "../integrations/mercado-pago/mp-checkoutPro.service";
import { SupabaseService } from "../integrations/supabase/supabase.service";
import { ClasePayload } from "./pagos.controller";

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
};

@Injectable()
export class PagosService {

    constructor(
        private readonly mpCheckoutProService: MpCheckoutProService,
        private readonly supabaseService: SupabaseService,
    ) { }

    // Crea el pago (con los datos de la clase) y devuelve la redirección a la página de pago.
    async createPreference(clases: ClasePayload[]): Promise<{ initPoint: string }> {
        const preference = new Preference(this.mpCheckoutProService.client);
        return preference.create({
            body: {
                items: clases.map((clase) => ({
                    id: clase.id.toString(),
                    unit_price: 100, // TODO: reemplazar con el precio de la clase
                    quantity: 1,
                    title: "Clase de kinesiología, Kinesicus",
                })),
                // Estos datos son accesibles cuando la API confirma el pago. Acá iria toda la info necesaria para un uso después del pago.
                metadata: {
                    clases,
                },
                // Usar solamente para producción, si no, se usa el auto_return
                back_urls: {
                    success: `${process.env.CORS_ORIGIN}/success`,
                    failure: `${process.env.CORS_ORIGIN}/failure`,
                    pending: `${process.env.CORS_ORIGIN}/pending`,
                },
            },
        }).then((res: PreferenceResponse) => ({ initPoint: res.init_point! }))
            .catch((error: Error) => { throw new Error(error.message); });
    }

    async preferenceNotification(paymentId: string) {

        const paymentClient = new Payment(this.mpCheckoutProService.client);
        const payment = await paymentClient.get({ id: paymentId });

        // Si el pago se encuentra en otro estado que no sea aprobado, se ignora y se envía el estado actual del pago.
        if (payment.status !== 'approved') {
            return { received: true, status: payment.status };
        }

        // En la metadata se guarda toda la info necesaria para un uso después del pago. En este caso, la clase a la que se hizo el pago.
        const clases: ClasePayload[] = payment.metadata?.clases ?? [];
        const now = new Date();
        // TODO: reemplazar con id del usuario autenticado
        const idCliente = 1;

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

        const inscripciones: SeInscribeInsert[] = clases.map((clase) => ({
            id_clase: clase.id,
            id_cliente: idCliente,
            estado: "pagado",
        }));

        const { error: inscripcionError } = await this.supabaseService.client
            .from('Se_inscribe')
            .insert(inscripciones);

        if (inscripcionError) throw new Error(inscripcionError.message);

        return { received: true };
    }

    async getPago(id: string) {
        const pagoClient = new Payment(this.mpCheckoutProService.client);
        const pago = await pagoClient.get({ id });
        return pago;
    }

    async createRefund(idPago: string) {
        // Generar reembolso total del pago por mercadopago.
        const refundClient = new PaymentRefund(this.mpCheckoutProService.client);
        const refund = await refundClient.total({ payment_id: idPago });

        // Una vez que se confirma el reembolso, hay que guardarlo en una tabla de reembolsos. Para mayor validez no se elimina el pago de la tabla de pagos.
        return refund;
    }

    // Esto es necesario o con la tabla de reembolsos ya se pueden obtener todos los reembolsos de un pago?
    async getAllRefunds(idPago: string) {
        const refundClient = new PaymentRefund(this.mpCheckoutProService.client);
        const refunds = await refundClient.list({ payment_id: idPago });
        return refunds;
    }
}