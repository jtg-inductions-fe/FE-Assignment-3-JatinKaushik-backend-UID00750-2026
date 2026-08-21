import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { RestaurantsModule } from '@modules/restaurants/restaurants.module';
import { MenuModule } from '@modules/menu/menu.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        PrismaService,
        AuthModule,
        UsersModule,
        RestaurantsModule,
        MenuModule,
        OrdersModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
