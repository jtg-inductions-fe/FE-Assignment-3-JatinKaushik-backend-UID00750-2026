import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { MenuItemRepository } from './repositories/menu-item.repository';
import { MenuCategoryRepository } from './repositories/menu-category.repository';
import { RestaurantRepository } from '@modules/restaurants/repositories/restaurants.repository';

@Module({
    imports: [RestaurantRepository],
    controllers: [MenuController],
    providers: [MenuService, MenuItemRepository, MenuCategoryRepository],
    exports: [MenuService, MenuCategoryRepository],
})
export class MenuModule {}
