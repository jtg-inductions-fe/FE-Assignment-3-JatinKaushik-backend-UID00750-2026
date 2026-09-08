import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItemResponseDto } from './dto/menu-item-response.dto';
import { Roles } from '@decorators/roles.decorator';
import { Role } from '@enums/role.enum';
import { CurrentUser } from '@decorators/current-user.decorator';
import type { CurrentUserPayload } from '@interfaces/current-user.interface';
import { Serialize } from '@interceptors/serialize.interceptor';
import { MenuCategory, MenuItem } from '@prisma-generated/client';
import { CategorizedMenuResponseDto } from './dto/categorized-menu-response.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';

@Controller()
export class MenuController {
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
    @HttpCode(HttpStatus.CREATED)
    @Post('restaurants/:restaurantId/menu-items')
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
    @Get('restaurants/:restaurantId/menu')
    async getCategorizedMenu(
        @CurrentUser() user: CurrentUserPayload,
        @Param('restaurantId') restaurantId: string,
    ): Promise<MenuCategory[]> {
        return this.menuService.getCategorizedMenu(restaurantId, user);
    }

    /**
     * Updates an existing menu item owned by the requesting user.
     *
     * @param user - Authenticated user payload.
     * @param id - Menu item identifier.
     * @param dto - Update fields.
     * @returns Updated menu item.
     */
    @Roles(Role.RESTAURANT_OWNER)
    @Serialize(MenuItemResponseDto)
    @HttpCode(HttpStatus.OK)
    @Patch('menu-items/:id')
    async update(
        @CurrentUser() user: CurrentUserPayload,
        @Param('id') id: string,
        @Body() dto: UpdateMenuItemDto,
    ): Promise<MenuItem> {
        return this.menuService.updateMenuItem(user.id, id, dto);
    }

    /**
     * Soft-deletes a menu item owned by the requesting user.
     *
     * @param user - Authenticated user payload.
     * @param id - Menu item identifier.
     */
    @Roles(Role.RESTAURANT_OWNER)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete('menu-items/:id')
    async remove(
        @CurrentUser() user: CurrentUserPayload,
        @Param('id') id: string,
    ): Promise<void> {
        return this.menuService.removeMenuItem(user.id, id);
    }
}
