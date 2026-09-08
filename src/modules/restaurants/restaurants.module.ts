import { Module } from '@nestjs/common';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { RestaurantRepository } from './repositories/restaurants.repository';

@Module({
    controllers: [RestaurantsController],
    providers: [RestaurantsService, RestaurantRepository],
})
export class RestaurantsModule {}
