import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { comparePassword, hashPassword } from '@utils/hash.util';
import { LoginDto } from './dto/login.dto';
import { JwtPayload, TokenPair } from './types/jwt-payload.interface';
import { generateOpaqueToken, hashToken } from '@utils/token-hash.util';
import { addDuration } from '@utils/duration.util';
import {
    LoginResponse,
    RegisterResponse,
    UserResponse,
} from './types/auth-response.interface';
import { Role } from '@enums/role.enum';
import { UserRepository } from '@modules/users/repositories/user.repository';
import { RefreshTokenRepository } from './respositories/refresh-token.repository';

@Injectable()
export class AuthService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly refreshTokenRepository: RefreshTokenRepository,
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
        const existingUser = await this.userRepository.findByEmail(dto.email);

        if (existingUser) {
            throw new ConflictException(
                'An account with this email address already exists.',
            );
        }

        const saltRounds = Number(
            this.config.getOrThrow<number>('SALT_ROUNDS'),
        );
        const hashedPassword = await hashPassword(dto.password, saltRounds);
        const user = await this.userRepository.create({
            email: dto.email,
            passwordHash: hashedPassword,
            name: dto.name,
            role: dto.role,
            phone: dto.phone,
        });

        return { user: this.toSafeUser(user) };
    }

    /**
     * Verifies user credentials and generates a fresh pair of access and refresh tokens.
     *
     * @param {LoginDto} dto - The login credentials containing email and password.
     * @returns {Promise<LoginResponse>} The sanitized user profile and token pair.
     */
    async login(dto: LoginDto): Promise<LoginResponse> {
        const user = await this.userRepository.findByEmail(dto.email);

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

    /**
     * Validates an existing refresh token to extend a user's session with new token keys.
     * Implements reuse detection to revoke all active sessions if a token is reused.
     *
     * @param {string} rawRefreshToken - The plain-text refresh token from client storage/cookies.
     * @returns {Promise<TokenPair>} A newly issued access token and refresh token pair.
     */
    async refresh(rawRefreshToken: string): Promise<TokenPair> {
        const tokenHash = this.hashRefreshToken(rawRefreshToken);
        const existing =
            await this.refreshTokenRepository.findByTokenHash(tokenHash);

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

        const user = await this.userRepository.findById(existing.userId);
        if (!user) {
            throw new UnauthorizedException('User no longer exists');
        }

        await this.refreshTokenRepository.revokeById(existing.id);

        return this.issueTokenPair(user.id, user.email, user.role);
    }

    /**
     * Ends a specific user session by invalidating the provided refresh token.
     *
     * @param {string} rawRefreshToken - The plain-text refresh token to invalidate.
     * @returns {Promise<void>} Resolves when the token revocation update completes.
     */
    async logout(rawRefreshToken: string): Promise<void> {
        const tokenHash = this.hashRefreshToken(rawRefreshToken);
        await this.refreshTokenRepository.revokeByTokenHash(tokenHash);
    }

    /**
     * Forces a global logout across all devices by invalidating every active session for a user.
     *
     * @param {string} userId - The unique identifier of the target user.
     * @returns {Promise<void>} Resolves when all session tokens are marked revoked.
     */
    async logoutAll(userId: string): Promise<void> {
        await this.refreshTokenRepository.revokeAllByUserId(userId);
    }

    /**
     * Fetches the requesting user's profile details safely without sensitive password data.
     *
     * @param {string} userId - The ID of the authenticated user.
     * @returns {Promise<UserResponse>} The sanitized user profile response.
     */
    async getProfile(userId: string): Promise<UserResponse> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new UnauthorizedException('User no longer exists');
        }
        return this.toSafeUser(user);
    }

    /**
     * Signs an access JWT and records a newly created refresh token in the database.
     *
     * @private
     * @param {string} userId - The subject user's ID.
     * @param {string} email - The user's registered email address.
     * @param {Role} role - The assigned user authorization role.
     * @returns {Promise<TokenPair>} Signed access token and newly generated refresh token.
     */
    private async issueTokenPair(
        userId: string,
        email: string,
        role: Role,
    ): Promise<TokenPair> {
        const payload: JwtPayload = { sub: userId, email, role };
        const accessToken = await this.jwtService.signAsync(payload);

        const rawRefreshToken = generateOpaqueToken();
        const tokenHash = this.hashRefreshToken(rawRefreshToken);
        const expiresAt = addDuration(
            this.config.get<string>('JWT_REFRESH_EXPIRES_IN')!,
        );

        await this.refreshTokenRepository.create({
            user: { connect: { id: userId } },
            tokenHash,
            expiresAt,
        });

        return { accessToken, refreshToken: rawRefreshToken };
    }

    /**
     * Hashes a raw refresh token using a secure server secret for database lookups.
     *
     * @private
     * @param {string} rawToken - The plain opaque refresh token.
     * @returns {string} HMAC SHA-256 string representation of the token.
     */
    private hashRefreshToken(rawToken: string): string {
        return hashToken(
            rawToken,
            this.config.get<string>('JWT_REFRESH_SECRET')!,
        );
    }

    /**
     * Removes passwordHash and internal soft-delete flags before a user object reaches the response.
     *
     * @private
     * @template T - User entity shape extending password and soft-delete properties.
     * @param  user - Raw database user object.
     * @returns Sanitized user profile object.
     */
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
