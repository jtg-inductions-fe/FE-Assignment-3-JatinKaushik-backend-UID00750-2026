import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItemRepository } from './repositories/menu-item.repository';
import { MenuCategoryRepository } from './repositories/menu-category.repository';
import { RestaurantRepository } from '../restaurants/repositories/restaurants.repository';
import { MenuCategory, MenuItem } from '@prisma-generated/client';
import { CurrentUserPayload } from '@common/interfaces/current-user.interface';

@Injectable()
export class MenuService {
    constructor(
        private readonly menuItemRepository: MenuItemRepository,
        private readonly menuCategoryRepository: MenuCategoryRepository,
        private readonly restaurantRepository: RestaurantRepository,
    ) {}

    /**
     * Adds a new menu item to a restaurant after verifying ownership and category validity.
     *
     * @param ownerId - Requesting user identifier.
     * @param restaurantId - Target restaurant identifier.
     * @param dto - Menu item creation payload.
     * @returns Created menu item entity.
     */
    async addMenuItem(
        ownerId: string,
        restaurantId: string,
        dto: CreateMenuItemDto,
    ): Promise<MenuItem> {
        await this.assertRestaurantOwnedBy(restaurantId, ownerId);
        await this.assertCategoryBelongsToRestaurant(
            dto.categoryId,
            restaurantId,
        );

        // Prevent duplicate item names inside the same restaurant
        const existingItem = await this.menuItemRepository.findFirst({
            restaurantId,
            name: dto.name,
        });
        if (existingItem) {
            throw new ConflictException(
                `A menu item with name "${dto.name}" already exists in this restaurant`,
            );
        }

        return this.menuItemRepository.create({
            restaurantId,
            categoryId: dto.categoryId,
            name: dto.name,
            description: dto.description,
            price: dto.price,
            stockQty: dto.stockQty,
            vegType: dto.vegType,
        });
    }

    /**
     * Updates an existing menu item owned by the requesting user.
     *
     * @param ownerId - Requesting user identifier.
     * @param menuItemId - Menu item identifier.
     * @param dto - Menu item update fields.
     * @returns Updated menu item entity.
     */
    async updateMenuItem(
        ownerId: string,
        menuItemId: string,
        dto: UpdateMenuItemDto,
    ): Promise<MenuItem> {
        const item = await this.assertMenuItemOwnedBy(menuItemId, ownerId);

        if (dto.categoryId !== undefined) {
            await this.assertCategoryBelongsToRestaurant(
                dto.categoryId,
                item.restaurantId,
            );
        }

        const { ...updateFields } = dto;

        return this.menuItemRepository.update(
            { id: menuItemId },
            {
                ...updateFields,
            },
        );
    }

    /**
     * Soft-deletes a menu item owned by the requesting user.
     *
     * @param ownerId - Requesting user identifier.
     * @param menuItemId - Menu item identifier.
     */
    async removeMenuItem(ownerId: string, menuItemId: string): Promise<void> {
        await this.assertMenuItemOwnedBy(menuItemId, ownerId);
        await this.menuItemRepository.softDelete(menuItemId);
    }

    /**
     * Retrieves the categorized menu for a restaurant.
     * Seeds default categories on-demand if none currently exist.
     *
     * @param restaurantId - Target restaurant identifier.
     * @returns Categorized menu categories with items attached.
     */
    async getCategorizedMenu(
        restaurantId: string,
        user: CurrentUserPayload,
    ): Promise<MenuCategory[]> {
        if (user.role === 'RESTAURANT_OWNER') {
            await this.assertRestaurantOwnedBy(restaurantId, user.id);
        }

        const restaurant = await this.restaurantRepository.findUnique({
            id: restaurantId,
        });

        if (!restaurant) {
            throw new NotFoundException('Restaurant not found');
        }

        let categories =
            await this.menuCategoryRepository.findCategorizedMenu(restaurantId);

        // Seed default categories automatically if no categories exist yet
        if (categories.length === 0) {
            await this.menuCategoryRepository.seedDefaultCategories(
                restaurantId,
            );
            categories =
                await this.menuCategoryRepository.findCategorizedMenu(
                    restaurantId,
                );
        }

        return categories;
    }

    /**
     * Asserts that a category exists and belongs to a specific restaurant.
     */
    private async assertCategoryBelongsToRestaurant(
        categoryId: string,
        restaurantId: string,
    ): Promise<MenuCategory> {
        const category =
            await this.menuCategoryRepository.findByIdAndRestaurant(
                categoryId,
                restaurantId,
            );
        if (!category) {
            throw new NotFoundException(
                'categoryId does not refer to a category in this restaurant',
            );
        }
        return category;
    }

    /**
     * Asserts that a restaurant exists and belongs to the requesting owner.
     */
    private async assertRestaurantOwnedBy(
        restaurantId: string,
        ownerId: string,
    ) {
        const restaurant = await this.restaurantRepository.findByIdAndOwner(
            restaurantId,
            ownerId,
        );
        if (!restaurant) {
            throw new NotFoundException('Restaurant not found');
        }
        return restaurant;
    }

    /**
     * Asserts that a menu item exists and belongs to a restaurant owned by the user.
     */
    private async assertMenuItemOwnedBy(
        menuItemId: string,
        ownerId: string,
    ): Promise<MenuItem> {
        const item = await this.menuItemRepository.findByIdAndOwner(
            menuItemId,
            ownerId,
        );
        if (!item) {
            throw new NotFoundException('Menu item not found');
        }
        return item;
    }
}
