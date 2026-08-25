import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { comparePassword, hashPassword } from '@utils/hash.util';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload.interface';
import { generateOpaqueToken, hashToken } from '@utils/token-hash.util';
import { addDuration } from '@utils/duration.util';

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) {}

    /** Creates a new active user profile with a securely hashed password. */
    async register(dto: RegisterDto) {
        const hashedPassword = await hashPassword(dto.password);
        await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash: hashedPassword,
                name: dto.name,
                role: dto.role,
                phone: dto.phone,
            },
        });
    }

    /** Verifies user credentials and generates a fresh pair of access and refresh tokens. */
    async login(dto: LoginDto) {
        const user = await this.prisma.user.findFirst({
            where: { email: dto.email, deletedAt: null },
        });

        if (
            !user ||
            !(await comparePassword(dto.password, user.passwordHash))
        ) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const tokens = await this.issueTokenPair(
            user.id,
            user.email,
            user.role,
        );
        return { user: this.toSafeUser(user), ...tokens };
    }

    /** Validates an existing refresh token to extend a user's session with new keys. */
    async refresh(rawRefreshToken: string) {
        const tokenHash = this.hashRefreshToken(rawRefreshToken);
        const existing = await this.prisma.refreshToken.findFirst({
            where: { tokenHash },
        });

        if (!existing) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (existing.revokedAt) {
            await this.logoutAll(existing.userId);
            throw new UnauthorizedException(
                'Refresh token already used — all sessions have been revoked',
            );
        }

        if (existing.expiresAt < new Date()) {
            throw new UnauthorizedException('Refresh token has expired');
        }

        const user = await this.prisma.user.findFirst({
            where: { id: existing.userId, deletedAt: null },
        });
        if (!user) {
            throw new UnauthorizedException('User no longer exists');
        }

        await this.prisma.refreshToken.update({
            where: { id: existing.id },
            data: { revokedAt: new Date() },
        });

        return this.issueTokenPair(user.id, user.email, user.role);
    }

    /** Ends a specific session by invalidating the provided refresh token. */
    async logout(rawRefreshToken: string): Promise<void> {
        const tokenHash = this.hashRefreshToken(rawRefreshToken);
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }

    /** Forces a logout across all devices by invalidating every active session for a user. */
    async logoutAll(userId: string): Promise<void> {
        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }

    /** Fetches the requesting user's profile details safely without password data. */
    async getProfile(userId: string) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
        });

        if (!user) {
            throw new UnauthorizedException('User no longer exists');
        }
        return this.toSafeUser(user);
    }

    /** Signs an access JWT and records a newly created refresh token in the database. */
    private async issueTokenPair(
        userId: string,
        email: string,
        role: string,
    ): Promise<TokenPair> {
        const payload: JwtPayload = { sub: userId, email, role };
        const accessToken = await this.jwtService.signAsync(payload);

        const rawRefreshToken = generateOpaqueToken();
        const tokenHash = this.hashRefreshToken(rawRefreshToken);
        const expiresAt = addDuration(
            this.config.get<string>('JWT_REFRESH_EXPIRES_IN')!,
        );

        await this.prisma.refreshToken.create({
            data: { userId, tokenHash, expiresAt },
        });

        return { accessToken, refreshToken: rawRefreshToken };
    }

    /** Hashes a raw refresh token using a secure server secret for database lookups. */
    private hashRefreshToken(rawToken: string): string {
        return hashToken(
            rawToken,
            this.config.get<string>('JWT_REFRESH_SECRET')!,
        );
    }

    /** Remove passwordHash (and the internal deletedAt flag) before a user object ever reaches a response. */
    private toSafeUser<
        T extends { passwordHash: string; deletedAt: Date | null },
    >(user: T) {
        const {
            passwordHash: _passwordHash,
            deletedAt: _deletedAt,
            ...safe
        } = user;
        return safe;
    }
}
