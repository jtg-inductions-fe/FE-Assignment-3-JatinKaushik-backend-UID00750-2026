import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository } from '@common/repositories/base.repository';
import { MenuCategory, Prisma } from '@prisma-generated/client';
import type { ExtendedPrismaClient } from '../../../prisma/extensions/soft-delete.extension';
import { EXTENDED_PRISMA_CLIENT } from '../../../prisma/prisma.module';
import { DEFAULT_MENU_CATEGORIES } from '@common/constants/menu.constants';

@Injectable()
export class MenuCategoryRepository extends BaseRepository<
    MenuCategory,
    Prisma.MenuCategoryWhereUniqueInput,
    Prisma.MenuCategoryUncheckedCreateInput,
    Prisma.MenuCategoryUncheckedUpdateInput
> {
    constructor(
        @Inject(EXTENDED_PRISMA_CLIENT)
        prisma: ExtendedPrismaClient,
    ) {
        super(prisma, 'menuCategory');
    }

    /**
     * Finds an active category in a specific restaurant by ID.
     *
     * @param id - Category identifier.
     * @param restaurantId - Target restaurant identifier.
     * @returns Matching category record or null.
     */
    async findByIdAndRestaurant(
        id: string,
        restaurantId: string,
    ): Promise<MenuCategory | null> {
        return this.findFirst({ id, restaurantId });
    }

    /**
     * Seeds initial default categories for a newly created or unseeded restaurant.
     *
     * @param restaurantId - Target restaurant identifier.
     */
    async seedDefaultCategories(restaurantId: string): Promise<void> {
        const categories = DEFAULT_MENU_CATEGORIES.map((cat) => ({
            restaurantId,
            name: cat.name,
            sortOrder: cat.sortOrder,
        }));

        await this.prisma.menuCategory.createMany({
            data: categories,
            skipDuplicates: true,
        });
    }

    /**
     * Retrieves all categories for a restaurant along with active menu items grouped by category.
     *
     * @param restaurantId - Target restaurant identifier.
     * @returns List of categories with nested menu items.
     */
    async findCategorizedMenu(restaurantId: string): Promise<MenuCategory[]> {
        return this.prisma.menuCategory.findMany({
            where: { restaurantId },
            orderBy: { sortOrder: 'asc' },
            include: {
                menuItems: {
                    orderBy: { name: 'asc' },
                },
            },
        });
    }
}
