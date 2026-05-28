import { Global, Module } from "@nestjs/common";
import { MpCheckoutProService } from "./mp-checkoutPro.service";

@Global()
@Module({
    providers: [MpCheckoutProService],
    exports: [MpCheckoutProService]
})
export class MpCheckoutProModule { }
