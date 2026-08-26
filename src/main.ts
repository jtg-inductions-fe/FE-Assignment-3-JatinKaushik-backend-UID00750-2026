import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    const port = configService.getOrThrow<number>('PORT');

    app.use(cookieParser());

    // Validate and transform incoming payloads (Request DTOs)
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    await app.listen(port);
}
bootstrap().catch((err) => {
    console.error('Application failed to start: ', err);
    process.exitCode = 1;
});
