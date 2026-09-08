import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository } from '@common/repositories/base.repository';
import { Prisma, User } from '@prisma-generated/client';
import type { ExtendedPrismaClient } from '../../../prisma/extensions/soft-delete.extension';
import { EXTENDED_PRISMA_CLIENT } from '../../../prisma/prisma.module';

@Injectable()
export class UserRepository extends BaseRepository<
    User,
    Prisma.UserWhereUniqueInput,
    Prisma.UserCreateInput,
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
}
