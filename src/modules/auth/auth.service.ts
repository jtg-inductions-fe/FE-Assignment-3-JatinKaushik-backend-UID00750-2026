import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { hashPassword } from '@utils/hash.util';
import type { ExtendedPrismaClient } from '../../prisma/extensions/soft-delete.extension';
import { EXTENDED_PRISMA_CLIENT } from '../../prisma/prisma.module';
import {
    RegisterResponse,
    UserResponse,
} from './types/auth-response.interface';

@Injectable()
export class AuthService {
    constructor(
        @Inject(EXTENDED_PRISMA_CLIENT)
        private readonly prisma: ExtendedPrismaClient,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) {}

    /**
     * Registers a new user account.
     *
     * @param {RegisterDto} dto - The registration data.
     * @returns {Promise<RegisterResponse>} The sanitized user object.
     */
    async register(dto: RegisterDto): Promise<RegisterResponse> {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException(
                'An account with this email address already exists.',
            );
        }

        const saltRounds = Number(
            this.config.getOrThrow<number>('SALT_ROUNDS'),
        );
        const hashedPassword = await hashPassword(dto.password, saltRounds);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash: hashedPassword,
                name: dto.name,
                role: dto.role,
                phone: dto.phone,
            },
        });

        return { user: this.toSafeUser(user) };
    }

    /** Removes passwordHash (and the internal deletedAt flag) before a user object ever reaches a response. */
    private toSafeUser<
        T extends UserResponse & {
            passwordHash: string;
            deletedAt: Date | null;
        },
    >(user: T): UserResponse {
        const {
            passwordHash: _passwordHash,
            deletedAt: _deletedAt,
            ...safe
        } = user;
        return safe;
    }
}
