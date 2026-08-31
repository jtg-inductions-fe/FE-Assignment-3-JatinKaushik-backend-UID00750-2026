import { Prisma } from '@prisma-generated/client';

export interface SoftDeleteRelation {
    modelKey: keyof Prisma.TypeMap['model'];
    foreignKey: string;
    children?: SoftDeleteRelation[];
}

/**
 * Map for soft-delete cascade rules across the application.
 */
export const SOFT_DELETE_CASCADE_MAP: Partial<
    Record<keyof Prisma.TypeMap['model'], SoftDeleteRelation[]>
> = {
    User: [
        { modelKey: 'Address', foreignKey: 'userId' },
        {
            modelKey: 'Restaurant',
            foreignKey: 'ownerId',
            children: [
                { modelKey: 'Address', foreignKey: 'restaurantId' },
                { modelKey: 'MenuCategory', foreignKey: 'restaurantId' },
                { modelKey: 'MenuItem', foreignKey: 'restaurantId' },
                { modelKey: 'Coupon', foreignKey: 'restaurantId' },
            ],
        },
    ],
    Restaurant: [
        { modelKey: 'Address', foreignKey: 'restaurantId' },
        { modelKey: 'MenuCategory', foreignKey: 'restaurantId' },
        { modelKey: 'MenuItem', foreignKey: 'restaurantId' },
        { modelKey: 'Coupon', foreignKey: 'restaurantId' },
    ],
    MenuCategory: [{ modelKey: 'MenuItem', foreignKey: 'categoryId' }],
};
