import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { Address, Prisma } from '@prisma-generated/client';
import type { ExtendedPrismaClient } from '../../prisma/extensions/soft-delete.extension';
import { EXTENDED_PRISMA_CLIENT } from '../../prisma/prisma.module';

@Injectable()
export class AddressRepository extends BaseRepository<
    Address,
    Prisma.AddressWhereUniqueInput,
    Prisma.AddressUncheckedCreateInput,
    Prisma.AddressUncheckedUpdateInput
> {
    constructor(
        @Inject(EXTENDED_PRISMA_CLIENT)
        prisma: ExtendedPrismaClient,
    ) {
        super(prisma, 'address');
    }

    /**
     * Retrieves all active addresses belonging to a specific user.
     *
     * @param userId - Target user unique identifier.
     * @returns List of active user addresses ordered by creation date descending.
     */
    async findByUserId(userId: string): Promise<Address[]> {
        return this.findMany({
            where: { userId },
            orderBy: [{ createdAt: 'desc' }],
        });
    }

    /**
     * Retrieves all active addresses belonging to a specific restaurant.
     *
     * @param restaurantId - Target restaurant unique identifier.
     * @returns List of active restaurant addresses ordered by creation date descending.
     */
    async findByRestaurantId(restaurantId: string): Promise<Address[]> {
        return this.findMany({
            where: { restaurantId },
            orderBy: [{ createdAt: 'desc' }],
        });
    }

    /**
     * Finds an address by ID ensuring it belongs to the target user.
     *
     * @param id - Target address unique identifier.
     * @param userId - Target user unique identifier.
     * @returns Matching address or null.
     */
    async findByIdAndUserId(
        id: string,
        userId: string,
    ): Promise<Address | null> {
        return this.findFirst({ id, userId });
    }

    /**
     * Soft-deletes an address by unique ID.
     *
     * @param id - Target address unique identifier.
     * @returns Deleted address entity.
     */
    async removeById(id: string): Promise<Address> {
        return this.update(
            { id },
            {
                deletedAt: new Date(),
            },
        );
    }
}
