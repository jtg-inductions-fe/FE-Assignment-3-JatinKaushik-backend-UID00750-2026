import {
    Body,
    Controller,
    Delete,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItemResponseDto } from './dto/menu-item-response.dto';
import { Roles } from '@decorators/roles.decorator';
import { Role } from '@enums/role.enum';
import { CurrentUser } from '@decorators/current-user.decorator';
import type { CurrentUserPayload } from '@interfaces/current-user.interface';
import { Serialize } from '@interceptors/serialize.interceptor';
import { MenuItem } from '@prisma-generated/client';

@Roles(Role.RESTAURANT_OWNER)
@Controller('menu-items')
export class MenuItemsController {
    constructor(private readonly menuService: MenuService) {}

    /**
     * Updates an existing menu item owned by the requesting user.
     *
     * @param user - Authenticated user payload.
     * @param id - Menu item identifier.
     * @param dto - Update fields.
     * @returns Updated menu item.
     */
    @Serialize(MenuItemResponseDto)
    @Patch(':id')
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
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    async remove(
        @CurrentUser() user: CurrentUserPayload,
        @Param('id') id: string,
    ): Promise<void> {
        return this.menuService.removeMenuItem(user.id, id);
    }
}
