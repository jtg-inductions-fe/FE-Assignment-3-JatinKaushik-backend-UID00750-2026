import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Validate and transform incoming payloads (Request DTOs)
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Filter and format outgoing data (Response DTOs)
    app.useGlobalInterceptors(
        new ClassSerializerInterceptor(app.get(Reflector)),
    );

    // Wrap successful responses in a standard { success: true, data } JSON envelope
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
    console.error('Application failed to start: ', err);
    process.exitCode = 1;
});
