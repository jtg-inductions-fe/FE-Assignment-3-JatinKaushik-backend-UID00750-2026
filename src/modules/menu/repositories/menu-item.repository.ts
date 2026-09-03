import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository } from '@common/repositories/base.repository';
import { MenuItem, Prisma } from '@prisma-generated/client';
import type { ExtendedPrismaClient } from '../../../prisma/extensions/soft-delete.extension';
import { EXTENDED_PRISMA_CLIENT } from '../../../prisma/prisma.module';

@Injectable()
export class MenuItemRepository extends BaseRepository<
    MenuItem,
    Prisma.MenuItemWhereUniqueInput,
    Prisma.MenuItemUncheckedCreateInput,
    Prisma.MenuItemUncheckedUpdateInput
> {
    constructor(
        @Inject(EXTENDED_PRISMA_CLIENT)
        prisma: ExtendedPrismaClient,
    ) {
        super(prisma, 'menuItem');
    }

    /**
     * Finds a active menu item belonging to a restaurant owned by a specific user.
     *
     * @param id - Menu item identifier.
     * @param ownerId - Unique identifier of the restaurant owner.
     * @returns Matching menu item entity or null.
     */
    async findByIdAndOwner(
        id: string,
        ownerId: string,
    ): Promise<MenuItem | null> {
        return this.findFirst({
            id,
            restaurant: { ownerId },
        });
    }

    /**
     * Performs a soft delete on a specific menu item.
     *
     * @param id - Menu item identifier.
     */
    async softDelete(id: string): Promise<void> {
        await this.prisma.menuItem.softDeleteWithCascade(id);
    }
}
