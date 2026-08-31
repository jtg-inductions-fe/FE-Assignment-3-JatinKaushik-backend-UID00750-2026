import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { AllExceptionsFilter } from '@filters/all-exceptions.filter';
import { TransformInterceptor } from '@interceptors/transform.interceptor';
import { envValidationSchema } from '@config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { PrismaExceptionFilter } from '@filters/prisma-exception.filter';
import { HttpExceptionFilter } from '@filters/http-exception.filter';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: envValidationSchema,
            validationOptions: {
                allowUnknown: true,
                abortEarly: false,
            },
        }),
        PrismaModule,
        HealthModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        // Filter and format outgoing data (Response DTOs)
        {
            provide: APP_INTERCEPTOR,
            inject: [Reflector],
            useFactory: (reflector: Reflector) =>
                new ClassSerializerInterceptor(reflector),
        },
        // Wrap successful responses in a standard { success: true, data } JSON envelope
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor,
        },
        // Fallback for unhandled errors
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
        // Catches Prisma exceptions
        {
            provide: APP_FILTER,
            useClass: PrismaExceptionFilter,
        },
        // Catches standard NestJS HTTP exceptions
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
    ],
})
export class AppModule {}
