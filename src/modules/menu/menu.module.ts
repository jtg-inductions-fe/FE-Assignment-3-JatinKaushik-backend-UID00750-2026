import { Module } from '@nestjs/common';
import { RestaurantMenuController } from './restaurant-menu.controller';
import { MenuService } from './menu.service';
import { MenuItemsController } from './menu-items.controller';
import { MenuItemRepository } from './repositories/menu-item.repository';
import { MenuCategoryRepository } from './repositories/menu-category.repository';
import { RestaurantRepository } from '@modules/restaurants/repositories/restaurants.repository';

@Module({
    controllers: [RestaurantMenuController, MenuItemsController],
    providers: [
        MenuService,
        MenuItemRepository,
        MenuCategoryRepository,
        RestaurantRepository,
    ],
    exports: [MenuService, MenuCategoryRepository],
})
export class MenuModule {}
