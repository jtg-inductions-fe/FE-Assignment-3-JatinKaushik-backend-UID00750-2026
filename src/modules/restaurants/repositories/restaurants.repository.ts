import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository } from '@common/repositories/base.repository';
import { Prisma, Restaurant } from '@prisma-generated/client';
import type { ExtendedPrismaClient } from '../../../prisma/extensions/soft-delete.extension';
import { EXTENDED_PRISMA_CLIENT } from '../../../prisma/prisma.module';
import { SearchRestaurantsQueryDto } from '../dto/search-restaurants-query.dto';
import { paginate } from '@utils/pagination.utils';
import { PaginatedResult } from '@common/interfaces/paginated-result.interface';

@Injectable()
export class RestaurantRepository extends BaseRepository<
    Restaurant,
    Prisma.RestaurantWhereUniqueInput,
    Prisma.RestaurantUncheckedCreateInput,
    Prisma.RestaurantUncheckedUpdateInput
> {
    constructor(
        @Inject(EXTENDED_PRISMA_CLIENT)
        prisma: ExtendedPrismaClient,
    ) {
        super(prisma, 'restaurant');
    }

    /**
     * Finds an active restaurant owned by a specific owner ID.
     *
     * @param id - Restaurant unique identifier.
     * @param ownerId - Owner user unique identifier.
     * @returns Matching restaurant entity or null.
     */
    async findByIdAndOwner(
        id: string,
        ownerId: string,
    ): Promise<Restaurant | null> {
        return this.findFirst({ id, ownerId });
    }

    /**
     * Creates a new restaurant record alongside an optional initial address.
     *
     * @param data - Nested creation payload.
     * @returns Newly created restaurant with address included.
     */
    async createWithAddress(
        data: Prisma.RestaurantUncheckedCreateInput,
    ): Promise<Restaurant> {
        return this.prisma.restaurant.create({
            data,
            include: { address: true },
        });
    }

    /**
     * Updates restaurant details and upserts the address record if provided.
     *
     * @param id - Restaurant unique identifier.
     * @param data - Nested update payload.
     * @returns Updated restaurant record with address included.
     */
    async updateWithAddress(
        id: string,
        data: Prisma.RestaurantUncheckedUpdateInput,
    ): Promise<Restaurant> {
        return this.prisma.restaurant.update({
            where: { id },
            data,
            include: { address: true },
        });
    }

    /**
     * Performs role-based scoped searches with pagination support.
     * - Restaurant Owners only see their own restaurants.
     * - Customers can search across all active restaurants.
     *
     * @param user - Authenticated user payload.
     * @param query - Filter and pagination criteria.
     * @returns Paginated list of restaurant records.
     */
    async findAllPaginated(
        query: SearchRestaurantsQueryDto,
        ownerId?: string,
    ): Promise<PaginatedResult<Restaurant>> {
        const where: Record<string, unknown> = {};

        // Scope query based on user role
        if (ownerId) {
            where.ownerId = ownerId;
        }

        // Apply name filter (case-insensitive)
        if (query.name) {
            where.name = { contains: query.name, mode: 'insensitive' };
        }

        // Apply dietary filter (VEG, NON_VEG, BOTH)
        if (query.dietaryType) {
            where.dietaryType = query.dietaryType;
        }

        return paginate(this.prisma.restaurant, query, {
            where,
            orderBy: { createdAt: 'desc' },
            include: { address: true },
        });
    }

    /**
     * Soft deletes a Restaurant
     *
     * @param id - Restaurant unique identifier.
     */
    async softDelete(id: string): Promise<void> {
        await this.prisma.restaurant.softDeleteWithCascade(id);
    }
}
