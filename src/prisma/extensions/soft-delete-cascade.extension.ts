import { Prisma } from '@prisma-generated/client';
import { SOFT_DELETE_CASCADE_MAP } from './soft-delete-cascade.config';

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
    modelKey: keyof Prisma.TypeMap['model'],
): SoftDeleteDelegate | undefined {
    const delegate = tx[modelKey as string];
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
    parentModelKey: keyof Prisma.TypeMap['model'],
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
                ): Promise<void> {
                    const ctx = Prisma.getExtensionContext(this) as Record<
                        string,
                        unknown
                    >;
                    const name = ctx['$name'] as string;

                    const modelKey = name as keyof Prisma.TypeMap['model'];

                    const now = new Date();

                    await client.$transaction(async (tx) => {
                        const txRecord = tx as unknown as Record<
                            string,
                            unknown
                        >;

                        // Run recursive cascading soft delete
                        await cascadeSoftDeleteRecursive(
                            txRecord,
                            modelKey,
                            [id],
                            now,
                        );

                        // Soft-delete target entity
                        const delegate = getDelegate(txRecord, modelKey);
                        if (!delegate) return;

                        if (modelKey === 'User') {
                            const user = await delegate.findUnique({
                                where: { id },
                                select: { email: true },
                            });

                            const anonymizedEmail = user?.email
                                ? `${user.email}_deleted_${now.getTime()}`
                                : undefined;

                            await delegate.update({
                                where: { id },
                                data: {
                                    deletedAt: now,
                                    ...(anonymizedEmail && {
                                        email: anonymizedEmail,
                                    }),
                                },
                            });
                        } else {
                            await delegate.update({
                                where: { id },
                                data: { deletedAt: now },
                            });
                        }
                    });
                },
            },
        },
    });
});
