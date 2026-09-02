import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository } from '@common/repositories/base.repository';
import { Prisma, RefreshToken } from '@prisma-generated/client';
import type { ExtendedPrismaClient } from '../../../prisma/extensions/soft-delete.extension';
import { EXTENDED_PRISMA_CLIENT } from '../../../prisma/prisma.module';

@Injectable()
export class RefreshTokenRepository extends BaseRepository<
    RefreshToken,
    Prisma.RefreshTokenWhereUniqueInput,
    Prisma.RefreshTokenUncheckedCreateInput,
    Prisma.RefreshTokenUpdateInput
> {
    constructor(
        @Inject(EXTENDED_PRISMA_CLIENT)
        prisma: ExtendedPrismaClient,
    ) {
        super(prisma, 'refreshToken');
    }

    /**
     * Finds a refresh token record by its hashed value.
     *
     * @param tokenHash - Hash of the raw refresh token.
     * @returns Matching token record or null.
     */
    async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
        return this.findFirst({ tokenHash });
    }

    /**
     * Revokes an active refresh token by hash.
     *
     * @param tokenHash - Target token hash value.
     * @returns Number of affected records.
     */
    async revokeByTokenHash(tokenHash: string): Promise<{ count: number }> {
        return this.updateMany(
            { tokenHash, revokedAt: null },
            { revokedAt: new Date() },
        );
    }

    /**
     * Revokes all active refresh tokens for a specified user.
     *
     * @param userId - Target user ID.
     * @returns Number of affected records.
     */
    async revokeAllByUserId(userId: string): Promise<{ count: number }> {
        return this.updateMany(
            { userId, revokedAt: null },
            { revokedAt: new Date() },
        );
    }

    /**
     * Invalidates a single token record by unique ID.
     *
     * @param id - Target refresh token record ID.
     * @returns Updated refresh token record.
     */
    async revokeById(id: string): Promise<RefreshToken> {
        return this.update({ id }, { revokedAt: new Date() });
    }
}
