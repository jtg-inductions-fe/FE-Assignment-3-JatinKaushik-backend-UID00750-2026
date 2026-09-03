import { Expose, Type } from 'class-transformer';
import { CategoryResponseDto } from './category-response.dto';
import { MenuItemResponseDto } from './menu-item-response.dto';

export class CategorizedMenuResponseDto extends CategoryResponseDto {
    @Expose()
    @Type(() => MenuItemResponseDto)
    menuItems!: MenuItemResponseDto[];
}
