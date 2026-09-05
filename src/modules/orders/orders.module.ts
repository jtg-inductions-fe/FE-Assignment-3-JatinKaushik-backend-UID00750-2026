import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { RestaurantsModule } from '@modules/restaurants/restaurants.module';
import { MenuModule } from '@modules/menu/menu.module';
import { OrderRepository } from './repositories/orders.repository';
import { AddressRepository } from '@common/repositories/address.repository';

@Module({
    imports: [RestaurantsModule, MenuModule],
    controllers: [OrdersController],
    providers: [OrdersService, OrderRepository, AddressRepository],
    exports: [OrdersService, OrderRepository],
})
export class OrdersModule {}
