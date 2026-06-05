import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
type MercadoPagoUserProfile = {
  id?: number;
  tags?: string[];
};

@Injectable()
export class MpAccountService {
  private readonly logger = new Logger(MpAccountService.name);
  private cachedIsTestSeller: boolean | null = null;

  constructor(private readonly configService: ConfigService) {}

  shouldSimulateRefunds(): boolean {
    const explicit = this.configService.get<string>('MP_SIMULATE_REFUNDS');
    if (explicit === 'true') return true;
    if (explicit === 'false') return false;

    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv === 'production') return false;

    return this.cachedIsTestSeller === true;
  }

  async resolveAccountContext(): Promise<void> {
    if (this.cachedIsTestSeller !== null) return;

    const token = this.configService.get<string>('MP_ACCESS_TOKEN');
    if (!token) {
      this.cachedIsTestSeller = false;
      return;
    }

    try {
      const response = await fetch('https://api.mercadopago.com/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = (await response.json()) as MercadoPagoUserProfile;

      if (!response.ok) {
        this.logger.warn('No se pudo consultar /users/me de Mercado Pago.');
        this.cachedIsTestSeller = false;
        return;
      }

      this.cachedIsTestSeller = profile.tags?.includes('test_user') ?? false;

      if (this.cachedIsTestSeller) {
        this.logger.log(
          'Cuenta MP de prueba (test_user) detectada. Los reembolsos reales están bloqueados por MP; ' +
            'en desarrollo se simularán salvo MP_SIMULATE_REFUNDS=false.',
        );
      }
    } catch (error) {
      this.logger.warn(
        `Error al resolver contexto de cuenta MP: ${error instanceof Error ? error.message : error}`,
      );
      this.cachedIsTestSeller = false;
    }
  }

  isTestSellerAccount(): boolean {
    return this.cachedIsTestSeller === true;
  }
}
