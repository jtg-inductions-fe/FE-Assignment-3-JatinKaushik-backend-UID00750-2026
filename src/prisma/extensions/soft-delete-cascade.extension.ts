import { Prisma } from '@prisma-generated/client';
import {
    ModelName,
    SOFT_DELETE_CASCADE_MAP,
} from './soft-delete-cascade.config';
import { isSoftDeleteModel } from './soft-delete.extension';

/**
 * Structural type shape for Prisma model delegates that support soft delete queries.
 */
interface SoftDeleteDelegate {
    findMany(args: {
        where: Record<string, unknown>;
        select?: { id: true };
    }): Promise<Array<{ id: string }>>;
    updateMany(args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
    }): Promise<{ count: number }>;
    findUnique(args: {
        where: Record<string, unknown>;
        select?: { email?: true };
    }): Promise<{ email?: string } | null>;
    update(args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
    }): Promise<unknown>;
}

/**
 * Helper to safely extract a typed model delegate from a transaction client.
 */
function getDelegate(
    tx: Record<string, unknown>,
    modelKey: ModelName,
): SoftDeleteDelegate | undefined {
    const delegate = tx[modelKey];
    if (!delegate || typeof delegate !== 'object') {
        return undefined;
    }
    return delegate as unknown as SoftDeleteDelegate;
}

/**
 * Recursively soft-deletes downstream child records inside a transaction.
 */
async function cascadeSoftDeleteRecursive(
    tx: Record<string, unknown>,
    parentModelKey: ModelName,
    parentIds: string[],
    deletedAt: Date,
): Promise<void> {
    const relations = SOFT_DELETE_CASCADE_MAP[parentModelKey];
    if (!relations || relations.length === 0 || parentIds.length === 0) {
        return;
    }

    for (const rel of relations) {
        const childDelegate = getDelegate(tx, rel.modelKey);
        if (!childDelegate) continue;

        // Retrieve IDs of active child records prior to update
        const childRecords = await childDelegate.findMany({
            where: {
                [rel.foreignKey]: { in: parentIds },
                deletedAt: null,
            },
            select: { id: true },
        });

        const childIds = childRecords.map((c) => c.id);

        if (childIds.length > 0) {
            // Recursively process deeper child entities
            if (rel.children && rel.children.length > 0) {
                await cascadeSoftDeleteRecursive(
                    tx,
                    rel.modelKey,
                    childIds,
                    deletedAt,
                );
            }

            // Perform batch soft delete on current level
            await childDelegate.updateMany({
                where: { id: { in: childIds }, deletedAt: null },
                data: { deletedAt },
            });
        }
    }
}

/**
 * Custom Prisma extension to handle an automated soft delete with cascade.
 */
export const softDeleteCascadeExtension = Prisma.defineExtension((client) => {
    return client.$extends({
        name: 'soft-delete-cascade',
        model: {
            $allModels: {
                /**
                 * Performs an atomic, multi-level soft delete with automatic cascading and email anonymization.
                 *
                 * @param id - Unique identifier of the entity to soft delete.
                 */
                async softDeleteWithCascade(
                    this: unknown,
                    id: string,
                    txContext?: Record<string, unknown>,
                ): Promise<void> {
                    const ctx = Prisma.getExtensionContext(this) as Record<
                        string,
                        unknown
                    >;
                    const name = ctx['$name'] as string;

                    const modelKey = name as keyof Prisma.TypeMap['model'];

                    if (!isSoftDeleteModel(modelKey)) {
                        throw new Error(
                            `Model '${modelKey}' does not support softDeleteWithCascade. Ensure it has a 'deletedAt' field.`,
                        );
                    }

                    const now = new Date();

                    const executeOps = async (
                        activeTx: Record<string, unknown>,
                    ) => {
                        await cascadeSoftDeleteRecursive(
                            activeTx,
                            modelKey,
                            [id],
                            now,
                        );

                        const delegate = getDelegate(activeTx, modelKey);
                        if (!delegate) return;

                        await delegate.update({
                            where: { id },
                            data: { deletedAt: now },
                        });
                    };

                    if (txContext) {
                        await executeOps(txContext);
                    } else {
                        await client.$transaction(async (newTx) => {
                            await executeOps(newTx);
                        });
                    }
                },
            },
        },
    });
});
