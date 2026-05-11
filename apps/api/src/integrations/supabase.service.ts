import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SupabaseClient, createClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
  public readonly client: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.getOrThrow<string>("SUPABASE_URL");
    const supabaseServiceRoleKey = this.configService.getOrThrow<string>(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    this.client = createClient(supabaseUrl, supabaseServiceRoleKey);
  }
}
