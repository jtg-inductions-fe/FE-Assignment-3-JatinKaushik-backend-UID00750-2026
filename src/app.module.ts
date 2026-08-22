import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { RestaurantsModule } from '@modules/restaurants/restaurants.module';
import { MenuModule } from '@modules/menu/menu.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { APP_FILTER, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { envValidationSchema } from '@common/config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

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
        AuthModule,
        UsersModule,
        RestaurantsModule,
        MenuModule,
        OrdersModule,
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
        // Catches all exceptions across the app
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
    ],
})
export class AppModule {}
