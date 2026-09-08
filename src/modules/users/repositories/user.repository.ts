import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BaseRepository } from '@common/repositories/base.repository';
import { Prisma, User } from '@prisma-generated/client';
import type { ExtendedPrismaClient } from '../../../prisma/extensions/soft-delete.extension';
import { EXTENDED_PRISMA_CLIENT } from '../../../prisma/prisma.module';

@Injectable()
export class UserRepository extends BaseRepository<
    User,
    Prisma.UserWhereUniqueInput,
    Prisma.UserUncheckedCreateInput,
    Prisma.UserUpdateInput
> {
    constructor(
        @Inject(EXTENDED_PRISMA_CLIENT)
        prisma: ExtendedPrismaClient,
    ) {
        super(prisma, 'user');
    }

    /**
     * Finds a user by email address.
     *
     * @param email - Target user email.
     * @returns Matching user entity or null.
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.findUnique({ email });
    }

    /**
     * Finds an active user by unique user ID.
     *
     * @param id - Unique user identifier.
     * @returns Matching user entity or null.
     */
    async findById(id: string): Promise<User | null> {
        return this.findFirst({ id });
    }

    /**
     * Updates user profile fields by user ID.
     *
     * @param id - Unique user identifier.
     * @param data - Profile update payload.
     * @returns Updated user profile entity.
     */
    async updateProfile(
        id: string,
        data: Prisma.UserUncheckedUpdateInput,
    ): Promise<User> {
        return this.update({ id }, data);
    }

    /**
     * Soft-deletes a user account and anonymizes email.
     *
     * @param id - Unique user identifier.
     */
    async softDelete(id: string): Promise<void> {
        const user = await this.findUnique({ id });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const now = new Date();
        const anonymizedEmail = `${user.email}_deleted_${now.getTime()}`;

        await this.executeTransaction(async (tx) => {
            // Anonymize email to free unique index
            await tx.user.update({
                where: { id },
                data: { deletedAt: now, email: anonymizedEmail },
            });

            // Revoke active sessions immediately
            await tx.refreshToken.updateMany({
                where: { userId: id, revokedAt: null },
                data: { revokedAt: now },
            });

            await tx.user.softDeleteWithCascade(id, tx);
        });
    }
}
