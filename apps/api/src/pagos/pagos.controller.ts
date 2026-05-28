import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import { PagosService } from "./pagos.service";

export type ClasePayload = {
    id: number;
    fecha: string;
    hora: string;
};

export type CreatePreferenceBody = {
    clases: ClasePayload[];
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

@Controller("api/mercadopago")
export class PagosController {
    constructor(private readonly pagosService: PagosService) { }

    @Post()
    async createPreference(@Body() body: CreatePreferenceBody) {
        return this.pagosService.createPreference(body.clases);
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


}
