import { Prisma, PrismaClient } from '@prisma-generated/client';

const SOFT_DELETE_MODELS = [
    'User',
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
 * Accesses model operations from the extension context.
 */
function getClientModelContext(ctx: unknown, model: SoftDeleteModel) {
    const extCtx = Prisma.getExtensionContext(ctx) as unknown as Record<
        string,
        Record<string, (args: Record<string, unknown>) => Promise<unknown>>
    >;

    return extCtx[model];
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
                    const modelContext = getClientModelContext(this, model);

                    const result = await modelContext.findFirst({
                        ...args,
                        where: { deletedAt: null, ...args.where },
                    });
                    return result;
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
    return client.$extends(softDeleteReadFilter);
}

export type ExtendedPrismaClient = ReturnType<typeof applySoftDeleteExtensions>;
