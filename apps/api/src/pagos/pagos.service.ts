import { BadRequestException, Injectable, Logger, OnModuleInit, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { Payment, PaymentRefund, Preference } from 'mercadopago';
import { PreferenceResponse } from "mercadopago/dist/clients/preference/commonTypes";
import { getFrontendUrl } from "../config/frontend-url";
import { MpAccountService } from "../integrations/mercado-pago/mp-account.service";
import {
    createRefundIdempotencyKey,
    throwMercadoPagoHttpException,
} from "../integrations/mercado-pago/mp-errors.util";
import { MpCheckoutProService } from "../integrations/mercado-pago/mp-checkoutPro.service";
import { SupabaseService } from "../integrations/supabase/supabase.service";
import { ClasePayload, CreateMensualidadPreferenceBody, CreatePreferenceBody } from "./pagos.controller";
import { CLASS_UNIT_PRICE, SUBSCRIPTION_PRICE } from "./class-price.constant";
import { inscripcionPorClaseEnCarrito } from "./inscripcion-desglose.util";
import { AuthService } from "src/auth/auth.service";


type PagoInsert = {
    id_cliente: number;
    fecha: string;
    hora: string;
    id_pago: number;
};

type SeInscribeInsert = {
    id_clase: number;
    id_cliente: number;
    estado: string;
    id_pago_mp: string | null;
    monto_a_favor: boolean;
};

function leerMetadataPago(metadata: Record<string, unknown> | undefined) {
    const clases = (metadata?.clases ?? []) as ClasePayload[];
    const idCliente = Number(
        metadata?.clienteId ?? metadata?.cliente_id,
    );
    const montoAFavorAplicado = Number(
        metadata?.montoAFavorAplicado ?? metadata?.monto_a_favor_aplicado,
    ) || 0;
    const clasesFavorAplicadas = Number(
        metadata?.clasesFavorAplicadas ?? metadata?.clases_favor_aplicadas,
    ) || 0;

    return { clases, idCliente, montoAFavorAplicado, clasesFavorAplicadas };
}

@Injectable()
export class PagosService implements OnModuleInit {
    private readonly logger = new Logger(PagosService.name);

    constructor(
        private readonly mpCheckoutProService: MpCheckoutProService,
        private readonly mpAccountService: MpAccountService,
        private readonly supabaseService: SupabaseService,
        private readonly authService: AuthService
    ) { }

    async onModuleInit(): Promise<void> {
        await this.mpAccountService.resolveAccountContext();
    }

    private async runMercadoPagoCall<T>(operation: () => Promise<T>): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            throwMercadoPagoHttpException(error);
        }
    }

    async createPreference(body: CreatePreferenceBody): Promise<{ initPoint: string }> {
        const { clases, clienteId, montoAFavorAplicado = 0, clasesFavorAplicadas } = body;
        if (!clases?.length) {
            throw new BadRequestException("Debe incluir al menos una clase.");
        }
        if (!clienteId || clienteId < 1) {
            throw new BadRequestException("clienteId inválido.");
        }

        const subtotal = (clases.length - clasesFavorAplicadas) * CLASS_UNIT_PRICE;
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
                    tipo: "inscripcion",
                    clases,
                    clienteId,
                    montoAFavorAplicado,
                    clasesFavorAplicadas,
                },
                back_urls: {
                    success: `${frontendUrl}/success`, // Forwarding de ngrok
                    failure: `${frontendUrl}/failure`,
                    pending: `${frontendUrl}/pending`,
                },
                auto_return: "approved",
            },
        }).then((res: PreferenceResponse) => ({ initPoint: res.init_point! }))
            .catch((error: Error) => { throw new Error(error.message); });
    }

    async acreditarMontoAFavor(clienteId: number, amount: number) {
        if (amount <= 0) return;

        const { data: cliente, error: fetchError } = await this.supabaseService.client
            .from('Estado_Cliente')
            .select('monto_favor')
            .eq('id', clienteId)
            .single();

        if (fetchError || !cliente) {
            throw new Error(`Error al obtener saldo del cliente: ${fetchError?.message}`);
        }

        const saldoActual = Number(cliente.monto_favor) || 0;
        const nuevoSaldo = saldoActual + amount;

        const { error: updateError } = await this.supabaseService.client
            .from('Estado_Cliente')
            .update({ monto_favor: nuevoSaldo })
            .eq('id', clienteId);

        if (updateError) {
            throw new Error(`Error al acreditar monto a favor: ${updateError.message}`);
        }
    }

    private async deductMontoAFavor(clienteId: number, amount: number) {
        const { data: cliente, error: fetchError } = await this.supabaseService.client
            .from('Estado_Cliente')
            .select('monto_favor')
            .eq('id', clienteId)
            .single();

        if (fetchError || !cliente) {
            throw new Error(`Error al obtener saldo del cliente: ${fetchError?.message}`);
        }

        const saldoActual = Number(cliente.monto_favor) || 0;
        const nuevoSaldo = Math.max(0, saldoActual - amount);

        const { error: updateError } = await this.supabaseService.client
            .from('Estado_Cliente')
            .update({ monto_favor: nuevoSaldo })
            .eq('id', clienteId);

        if (updateError) {
            throw new Error(`Error al descontar monto a favor: ${updateError.message}`);
        }
    }

    async getPago(id: string) {
        return this.runMercadoPagoCall(async () => {
            const pagoClient = new Payment(this.mpCheckoutProService.client);
            return pagoClient.get({ id });
        });
    }

    async createRefund(idPago: string) {

        if (this.mpAccountService.shouldSimulateRefunds()) {
            this.logger.warn(
                `Reembolso MP simulado (dev/test_user): pago=${idPago}`,
            );
            return {
                id: `simulated-refund-${idPago}`,
                payment_id: Number(idPago),
                status: 'approved',
                simulated: true,
            };
        }

        const payment = await this.getPago(idPago);
        if (payment.status !== 'approved') {
            throw new BadRequestException('El pago no está aprobado para reembolso.');
        }

        return this.runMercadoPagoCall(async () => {
            const refundClient = new PaymentRefund(this.mpCheckoutProService.client);
            return refundClient.total({
                payment_id: idPago,
                requestOptions: {
                    idempotencyKey: createRefundIdempotencyKey('total-refund', idPago),
                },
            });
        });
    }

    async getAllRefunds(idPago: string) {
        return this.runMercadoPagoCall(async () => {
            const refundClient = new PaymentRefund(this.mpCheckoutProService.client);
            return refundClient.list({ payment_id: idPago });
        });
    }

    async createMensualidadPreference(body: CreateMensualidadPreferenceBody) {
        //Reviso si alguno de los campos está vacío o con un espacio
        if (!body.nombre?.trim() || !body.apellido?.trim() || !body.dni?.trim() || !body.email?.trim()) {
            throw new BadRequestException("No se pudieron registrar los datos porque hay campos obligatorios vacíos.");
        }

        //Busco si el DNI o el Mail ya están en la base de datos
        const { data: usuariosExistentes, error: errorBusqueda } = await this.supabaseService.client
            .from('Persona_')
            .select('dni, mail')
            .or(`dni.eq.${body.dni},mail.eq.${body.email}`);
        if (errorBusqueda) {
            throw new InternalServerErrorException("Error al verificar la disponibilidad de los datos en el sistema.");
        }
        // Si el array trajo algún resultado, significa que al menos uno de los dos datos ya existe
        if (usuariosExistentes && usuariosExistentes.length > 0) {
            const dniOcupado = usuariosExistentes.some(usuario => usuario.dni === body.dni);
            const mailOcupado = usuariosExistentes.some(usuario => usuario.mail === body.email);
            if (dniOcupado && mailOcupado) {
                throw new BadRequestException("El DNI y el Email ingresados ya se encuentran registrados en otra cuenta.");
            } else if (dniOcupado) {
                throw new BadRequestException("El DNI ingresado ya se encuentra registrado. Por favor, verificá tus datos.");
            } else if (mailOcupado) {
                throw new BadRequestException("El Email ingresado ya pertenece a una cuenta existente.");
            }
        }

        const datosRegistro = body;
        const MENSUALIDAD_PRICE = 24
        const frontendUrl = getFrontendUrl();
        const preference = new Preference(this.mpCheckoutProService.client);
        return preference.create({
            body: {
                items: [{
                    id: "inscripcion-kinescius",
                    title: `Mensualidad Abonado - Kinescius`,
                    quantity: 1,
                    unit_price: MENSUALIDAD_PRICE,
                }],
                metadata: {
                    tipo: "mensualidad",
                    nombre: datosRegistro.nombre,
                    apellido: datosRegistro.apellido,
                    email: datosRegistro.email,
                    dni: datosRegistro.dni,
                    telefono: datosRegistro.telefono || null,
                    rol: datosRegistro.rol
                },
                back_urls: {
                    success: `${frontendUrl}/success-abonado`, // Forwarding de ngrok
                    failure: `${frontendUrl}/failure`,
                    pending: `${frontendUrl}/pending`,
                },
                auto_return: "approved",
            },
        }).then((res: PreferenceResponse) => ({ initPoint: res.init_point! }))
            .catch((error: Error) => { throw new Error(error.message); });
    }

    async createSuscripcionPreference(clienteId: number) {

        if (!clienteId) {
            throw new BadRequestException("Datos de suscripción o cliente inválidos.");
        }

        const frontendUrl = getFrontendUrl();
        const preference = new Preference(this.mpCheckoutProService.client);
        return preference.create({
            body: {
                items: [{
                    id: "suscripcion-kinescius",
                    title: `Suscripción Abonado - Kinescius`,
                    quantity: 1,
                    unit_price: SUBSCRIPTION_PRICE,
                }],
                metadata: {
                    tipo: "suscripcion",
                    id_cliente: clienteId,
                },
                back_urls: {
                    success: `${frontendUrl}/success-abonado`, // Forwarding de ngrok
                    failure: `${frontendUrl}/failure`,
                    pending: `${frontendUrl}/pending`,
                },
                auto_return: "approved",
            },
        }).then((res: PreferenceResponse) => ({ initPoint: res.init_point! }))
            .catch((error: Error) => { throw new Error(error.message); });
    }

    async handlePreferenceNotification(paymentId: string) {
        const paymentClient = new Payment(this.mpCheckoutProService.client);
        const payment = await paymentClient.get({ id: paymentId });

        if (payment.status !== "approved") {
            return { received: true, status: payment.status };
        }

        const tipo = (payment.metadata as Record<string, unknown>)?.tipo;

        switch (tipo) {
            case "inscripcion":
                return this.procesarInscripcion(payment.metadata, paymentId);
            case "mensualidad":
                return this.procesarMensualidad(payment.metadata, paymentId);
            case "suscripcion":
                return this.procesarSuscripcion(payment.metadata, paymentId);
            default:
                throw new BadRequestException(`Tipo de pago desconocido: ${tipo}`);
        }
    }

    async procesarInscripcion(paymentData: Record<string, unknown>, paymentId: string) {

        const { clases, idCliente, montoAFavorAplicado } = leerMetadataPago(paymentData);

        if (!idCliente || !clases.length) {
            throw new BadRequestException('Metadata de pago incompleta.');
        }

        const datosPorClase = inscripcionPorClaseEnCarrito(
            clases,
            montoAFavorAplicado,
            paymentId,
        );
        const now = new Date();

        const pago: PagoInsert = {
            id_cliente: idCliente,
            fecha: now.toISOString().split('T')[0],
            hora: now.toTimeString().split(' ')[0],
            id_pago: Number(paymentId),
        };

        const { error: pagoError } = await this.supabaseService.client
            .from('Pago')
            .insert(pago);

        if (pagoError) throw new Error(pagoError.message);

        const inscripciones: SeInscribeInsert[] = clases.map((clase, index) => ({
            id_clase: clase.id,
            id_cliente: idCliente,
            estado: "pagado",
            id_pago_mp: datosPorClase[index].id_pago_mp,
            monto_a_favor: datosPorClase[index].monto_a_favor,
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

    async procesarMensualidad(paymentData: Record<string, unknown>, paymentId: string) {
        const datosRegistro = {
            nombre: String(paymentData.nombre),
            apellido: String(paymentData.apellido),
            email: String(paymentData.email),
            dni: String(paymentData.dni),
            telefono: paymentData.telefono ? String(paymentData.telefono) : undefined, //puede no ingresarsee
            rol: Number(paymentData.rol),
        };

        await this.authService.registrarUsuario(datosRegistro);
        console.log("Se registró al cliente abonado exitosamente, ahora se registrara el pago");
        const { data: persona, error: errorPersona } = await this.supabaseService.client
            .from('Persona_')
            .select('id')
            .eq('mail', paymentData.email)
            .single();
        if (errorPersona || !persona) {
            throw new UnauthorizedException('No se encontró el ID del cliente.');
        }

        const now = new Date();
        const pago: PagoInsert = {
            id_cliente: persona.id,
            fecha: now.toISOString().split('T')[0],
            hora: now.toTimeString().split(' ')[0],
            id_pago: Number(paymentId),
        };
        const { error: pagoError } = await this.supabaseService.client
            .from('Pago')
            .insert(pago);
        if (pagoError) throw new Error(pagoError.message);

        return { received: true };
    }

    async procesarSuscripcion(paymentData: Record<string, unknown>, paymentId: string) {
        const { data: estadoCliente, error: errorEstadoCliente } = await this.supabaseService.client
            .from('Estado_Cliente')
            .select('id_pago_abonado')
            .eq('id', Number(paymentData.id_cliente))
            .single();
        if (!estadoCliente || errorEstadoCliente) {
            throw new UnauthorizedException('No se encontró el ID del cliente.');
        } else {
            if (estadoCliente.id_pago_abonado === null) {
                const now = new Date();
                const pago: PagoInsert = {
                    id_cliente: Number(paymentData.id_cliente),
                    fecha: now.toISOString().split('T')[0],
                    hora: now.toTimeString().split(' ')[0],
                    id_pago: Number(paymentId),
                };
                const { error: errorPago } = await this.supabaseService.client
                    .from('Pago')
                    .insert(pago)
                if (errorPago) throw new Error(errorPago.message);
            } else {
                const { error: errorPago } = await this.supabaseService.client
                    .from('Pago')
                    .update({
                        fecha: new Date().toISOString().split('T')[0],
                        hora: new Date().toTimeString().split(' ')[0],
                    })
                    .eq('id', estadoCliente.id_pago_abonado)
                    .single();
                if (errorPago) throw new Error(errorPago.message);
            }
        }

        const { data: persona, error: errorPersona } = await this.supabaseService.client
            .from('Persona_')
            .select('rol')
            .eq('id', Number(paymentData.id_cliente))
            .single();
        if (errorPersona || !persona) {
            throw new UnauthorizedException('No se encontró el ID del cliente.');
        } else if (persona.rol === 2) {
            const { data: cliente, error: errorCliente } = await this.supabaseService.client
                .from('Persona_')
                .update({ rol: 3 }) // 3 es el rol de cliente abonado
                .eq('id', Number(paymentData.id_cliente))
                .single();
            if (errorCliente || !cliente) {
                throw new UnauthorizedException('Error al actualizar el rol del cliente.');
            }
        }
        return { received: true };
    }
}