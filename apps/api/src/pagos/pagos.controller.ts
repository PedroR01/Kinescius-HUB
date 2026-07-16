import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import { PagosService } from "./pagos.service";

export type ClasePayload = {
    id: number;
    fecha: string;
    hora: string;
};

export type CreatePreferenceBody = {
    clases: ClasePayload[];
    clienteId: number;
    montoAFavorAplicado?: number;
    clasesFavorAplicadas: number;
};

// Tipo de dato de notificaciones concreto manejado por el webhook de mercadopago.
export type WebhookNotification = {
    id: number;
    live_mode: boolean;
    type: string;
    date_created: string;
    user_id: number;
    api_version: string;
    action: string;
    data: {
        id: string;
    };
};

export type CreateMensualidadPreferenceBody = {
    nombre: string;
    apellido: string;
    email: string;
    dni: string;
    telefono?: string;
    rol: number;
}

@Controller("api/mercadopago")
export class PagosController {
    constructor(private readonly pagosService: PagosService) { }

    @Post()
    async createPreference(@Body() body: CreatePreferenceBody) {
        return this.pagosService.createPreference(body);
    }

    @Post("notificacion")
    async preferenceNotification(@Body() body: WebhookNotification) {
        return this.pagosService.preferenceNotification(body.data.id);
    }

    @Post("reembolsos")
    async createRefund(@Body() body: { idPago: string }) {
        return this.pagosService.createRefund(body.idPago);
    }

    @Get("reembolsos")
    async getAllRefunds(@Query("idPago") idPago: string) {
        return this.pagosService.getAllRefunds(idPago);
    }

    @Post("mensualidad")
    async CreateMensualidadPreference(@Body() body: CreateMensualidadPreferenceBody) {
        return this.pagosService.createMensualidadPreference(body);
    }

    @Post("notificacion_abonado")
    async mensualidadNotification(@Body() body: WebhookNotification) {
        return this.pagosService.mensualidadNotification(body.data.id);
    }

}
