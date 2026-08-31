import { ExtendedPrismaClient } from '../../prisma/extensions/soft-delete.extension';

/**
 * Interface representing standard Prisma model delegate operations.
 *
 * @template T - Target Model shape.
 * @template K - Where unique filter shape.
 * @template C - Create payload shape.
 * @template U - Update payload shape.
 */
export interface PrismaModelDelegate<T, K, C, U> {
    findUnique(args: { where: K }): Promise<T | null>;
    findFirst(args: { where: Record<string, unknown> }): Promise<T | null>;
    findMany(args?: {
        where?: Record<string, unknown>;
        orderBy?: Record<string, unknown> | Array<Record<string, unknown>>;
        take?: number;
        skip?: number;
    }): Promise<T[]>;
    create(args: { data: C }): Promise<T>;
    update(args: { where: K; data: U }): Promise<T>;
    updateMany(args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
    }): Promise<{ count: number }>;
    delete(args: { where: K }): Promise<T>;
    deleteMany(args?: {
        where?: Record<string, unknown>;
    }): Promise<{ count: number }>;
}

/**
 * Abstract Base Repository for standard CRUD persistence operations.
 */
export abstract class BaseRepository<T, K, C, U> {
    constructor(
        protected readonly prisma: ExtendedPrismaClient,
        protected readonly modelKey: keyof ExtendedPrismaClient,
    ) {}

    /**
     * Retrieves the delegate dynamically from the parent client to maintain extension context.
     */
    protected get model(): PrismaModelDelegate<T, K, C, U> {
        return this.prisma[this.modelKey] as unknown as PrismaModelDelegate<
            T,
            K,
            C,
            U
        >;
    }

    /**
     * Finds a single entity by unique criteria.
     *
     * @param where - Unique filter condition.
     * @returns Target entity or null.
     */
    async findUnique(where: K): Promise<T | null> {
        return this.model.findUnique({ where });
    }

    /**
     * Finds the first entity matching specified criteria.
     *
     * @param where - Filter condition.
     * @returns Target entity or null.
     */
    async findFirst(where: Record<string, unknown>): Promise<T | null> {
        return this.model.findFirst({ where });
    }

    /**
     * Finds multiple entities matching specified criteria and options.
     *
     * @param params - Optional query filters, ordering, and pagination parameters.
     * @returns Array of matching entities.
     */
    async findMany(params?: {
        where?: Record<string, unknown>;
        orderBy?: Record<string, unknown> | Array<Record<string, unknown>>;
        take?: number;
        skip?: number;
    }): Promise<T[]> {
        return this.model.findMany(params);
    }

    /**
     * Creates a new database record.
     *
     * @param data - Entity creation payload.
     * @returns Newly created entity.
     */
    async create(data: C): Promise<T> {
        return this.model.create({ data });
    }

    /**
     * Updates an existing database record matching unique criteria.
     *
     * @param where - Unique filter condition.
     * @param data - Update payload.
     * @returns Updated entity.
     */
    async update(where: K, data: U): Promise<T> {
        return this.model.update({ where, data });
    }

    /**
     * Updates multiple records matching specified criteria.
     *
     * @param where - Filter condition criteria.
     * @param data - Update payload.
     * @returns Count of updated records.
     */
    async updateMany(
        where: Record<string, unknown>,
        data: Record<string, unknown>,
    ): Promise<{ count: number }> {
        return this.model.updateMany({ where, data });
    }

    /**
     * Deletes a record matching unique criteria.
     * Note: If the model has soft-delete enabled in Prisma extensions,
     * this will be intercepted by soft-delete middleware if configured.
     *
     * @param where - Unique filter condition.
     * @returns Deleted entity.
     */
    async delete(where: K): Promise<T> {
        return this.model.delete({ where });
    }

    /**
     * Deletes multiple records matching specified criteria.
     *
     * @param where - Optional filter condition criteria.
     * @returns Count of deleted records.
     */
    async deleteMany(
        where?: Record<string, unknown>,
    ): Promise<{ count: number }> {
        return this.model.deleteMany({ where });
    }
}
