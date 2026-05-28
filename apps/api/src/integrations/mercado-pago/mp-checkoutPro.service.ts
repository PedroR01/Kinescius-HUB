import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MercadoPagoConfig } from 'mercadopago';

@Injectable()
export class MpCheckoutProService {
    public readonly client: MercadoPagoConfig;

    constructor(private readonly configService: ConfigService) {
        // const mercadoPagoClientId = this.configService.getOrThrow<string>("MP_CLIENT_ID");
        // const mercadoPagoClientSecret = this.configService.getOrThrow<string>("MP_CLIENT_SECRET");
        const mercadoPagoAccessToken = this.configService.getOrThrow<string>("MP_ACCESS_TOKEN");

        this.client = new MercadoPagoConfig({ accessToken: mercadoPagoAccessToken });
    }
}