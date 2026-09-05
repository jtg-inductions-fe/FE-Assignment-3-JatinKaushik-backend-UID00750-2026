import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { MenuItemRepository } from './repositories/menu-item.repository';
import { MenuCategoryRepository } from './repositories/menu-category.repository';
import { RestaurantsModule } from '@modules/restaurants/restaurants.module';

@Module({
    imports: [RestaurantsModule],
    controllers: [MenuController],
    providers: [MenuService, MenuItemRepository, MenuCategoryRepository],
    exports: [MenuService, MenuCategoryRepository, MenuItemRepository],
})
export class MenuModule {}
