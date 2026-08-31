import { Prisma, PrismaClient } from '@prisma-generated/client';
import { softDeleteCascadeExtension } from './soft-delete-cascade.extension';

const SOFT_DELETE_MODELS = [
    'User',
    'Address',
    'Restaurant',
    'MenuCategory',
    'MenuItem',
    'Coupon',
] as const;
type SoftDeleteModel = (typeof SOFT_DELETE_MODELS)[number];

function isSoftDeleteModel(model?: string): model is SoftDeleteModel {
    return !!model && (SOFT_DELETE_MODELS as readonly string[]).includes(model);
}

/**
 * Auto-filter reads.
 * Merges `deletedAt: null` into standard read operations.
 */
export const softDeleteReadFilter = Prisma.defineExtension({
    name: 'soft-delete-read-filter',
    query: {
        $allModels: {
            async findMany({ model, args, query }) {
                if (isSoftDeleteModel(model))
                    args.where = { deletedAt: null, ...args.where };
                return query(args);
            },
            async findFirst({ model, args, query }) {
                if (isSoftDeleteModel(model))
                    args.where = { deletedAt: null, ...args.where };
                return query(args);
            },
            async count({ model, args, query }) {
                if (isSoftDeleteModel(model))
                    args.where = { deletedAt: null, ...args.where };
                return query(args);
            },
            async findUnique({ model, args, query }) {
                if (isSoftDeleteModel(model)) {
                    args.where = { deletedAt: null, ...args.where };
                }
                return query(args);
            },
        },
    },
});

/**
 * High-level orchestration function.
 */
export function applySoftDeleteExtensions<C extends PrismaClient>(client: C) {
    return client
        .$extends(softDeleteReadFilter)
        .$extends(softDeleteCascadeExtension);
}

export type ExtendedPrismaClient = ReturnType<typeof applySoftDeleteExtensions>;
