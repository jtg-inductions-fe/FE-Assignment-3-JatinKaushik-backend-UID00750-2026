import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { MenuItemResponseDto } from './dto/menu-item-response.dto';
import { CategorizedMenuResponseDto } from './dto/categorized-menu-response.dto';
import { Roles } from '@decorators/roles.decorator';
import { Role } from '@enums/role.enum';
import { CurrentUser } from '@decorators/current-user.decorator';
import type { CurrentUserPayload } from '@interfaces/current-user.interface';
import { Serialize } from '@interceptors/serialize.interceptor';
import { MenuCategory, MenuItem } from '@prisma-generated/client';

@Controller('restaurants/:restaurantId')
export class RestaurantMenuController {
    constructor(private readonly menuService: MenuService) {}

    /**
     * Adds a new menu item to a restaurant. Restricted to RESTAURANT_OWNER.
     *
     * @param user - Authenticated user payload.
     * @param restaurantId - Target restaurant identifier.
     * @param dto - Menu item details.
     * @returns Newly created menu item.
     */
    @Roles(Role.RESTAURANT_OWNER)
    @Serialize(MenuItemResponseDto)
    @Post('menu-items')
    async addMenuItem(
        @CurrentUser() user: CurrentUserPayload,
        @Param('restaurantId') restaurantId: string,
        @Body() dto: CreateMenuItemDto,
    ): Promise<MenuItem> {
        return this.menuService.addMenuItem(user.id, restaurantId, dto);
    }

    /**
     * Retrieves the categorized menu for a restaurant (including seeded categories).
     * Accessible by both RESTAURANT_OWNER and CUSTOMER roles.
     *
     * @param restaurantId - Target restaurant identifier.
     * @returns Categorized list of categories and active menu items.
     */
    @Serialize(CategorizedMenuResponseDto)
    @Get('menu')
    async getCategorizedMenu(
        @Param('restaurantId') restaurantId: string,
    ): Promise<MenuCategory[]> {
        return this.menuService.getCategorizedMenu(restaurantId);
    }
}
