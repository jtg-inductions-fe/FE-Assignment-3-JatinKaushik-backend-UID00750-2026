import { Prisma } from '@prisma-generated/client';

export type ModelName = keyof Prisma.TypeMap['model'];

export type ModelFields<M extends ModelName> =
    keyof Prisma.TypeMap['model'][M]['payload']['scalars'];

export type SoftDeleteNode = {
    [M in ModelName]: {
        modelKey: M;
        foreignKey: ModelFields<M>;
        children?: SoftDeleteNode[];
    };
}[ModelName];

/**
 * Map for soft-delete cascade rules across the application.
 */
export const SOFT_DELETE_CASCADE_MAP: Partial<
    Record<ModelName, SoftDeleteNode[]>
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
