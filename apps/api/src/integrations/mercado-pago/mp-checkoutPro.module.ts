import { Global, Module } from "@nestjs/common";
import { MpAccountService } from "./mp-account.service";
import { MpCheckoutProService } from "./mp-checkoutPro.service";

@Global()
@Module({
    providers: [MpCheckoutProService, MpAccountService],
    exports: [MpCheckoutProService, MpAccountService],
})
export class MpCheckoutProModule { }
