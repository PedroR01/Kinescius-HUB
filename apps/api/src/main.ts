import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module";
import {
  createCorsOriginValidator,
  parseCorsOrigins,
} from "./config/cors-origin";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  const allowedOriginPatterns = parseCorsOrigins(process.env.CORS_ORIGIN);
  app.enableCors({
    origin: createCorsOriginValidator(allowedOriginPatterns),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
