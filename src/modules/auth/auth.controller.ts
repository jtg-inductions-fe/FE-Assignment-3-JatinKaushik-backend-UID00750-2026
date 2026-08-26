import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Res,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '@decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CurrentUser } from '@decorators/current-user.decorator';
import type { CurrentUserPayload } from '@interfaces/current-user.interface';
import { Cookies } from '@decorators/cookies.decorator';
import type { Response } from 'express';
import {
    LoginResponse,
    RegisterResponse,
    UserResponse,
} from './types/auth-response.interface';
import { REFRESH_COOKIE_OPTIONS } from './configs/authCookies.config';

/**
 * Controller handling public authentication operations.
 */
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * Registers a new customer or restaurant owner account.
     *
     * @param dto User registration parameters
     * @returns Newly created user profile
     */
    @Public()
    @HttpCode(HttpStatus.CREATED)
    @Post('register')
    async register(@Body() dto: RegisterDto): Promise<RegisterResponse> {
        return this.authService.register(dto);
    }

    /**
     * Authenticates a user with credentials, sets an HTTP-Only refresh token cookie,
     * and returns the user profile along with an access JWT.
     *
     * @param dto - User login credentials containing email and password.
     * @param response - Express response object used to append the secure cookie.
     * @returns Authenticated user profile and access token.
     */
    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ): Promise<Omit<LoginResponse, 'refreshToken'>> {
        const { user, accessToken, refreshToken } =
            await this.authService.login(dto);

        response.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

        return { user, accessToken };
    }

    /**
     * Exchanges a valid HTTP-Only refresh token cookie for a new access token and rotated refresh cookie.
     *
     * @param dto - Extracted cookies containing the raw refresh token.
     * @param response - Express response object to set the newly rotated refresh cookie.
     * @returns Fresh access token.
     */
    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    async refresh(
        @Cookies() dto: RefreshTokenDto,
        @Res({ passthrough: true }) response: Response,
    ): Promise<{ accessToken: string }> {
        if (!dto.refreshToken) {
            throw new UnauthorizedException(
                'Session expired. Please log in again.',
            );
        }

        const tokens = await this.authService.refresh(dto.refreshToken);

        response.cookie(
            'refreshToken',
            tokens.refreshToken,
            REFRESH_COOKIE_OPTIONS,
        );

        return { accessToken: tokens.accessToken };
    }

    /**
     * Revokes the active refresh token and clears the client's refresh token cookie.
     *
     * @param dto - Extracted cookies containing the active refresh token.
     * @param response - Express response object to clear the cookie.
     * @returns Resolves when logout process completes.
     */
    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('logout')
    async logout(
        @Cookies() dto: RefreshTokenDto,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        if (!dto.refreshToken) {
            throw new UnauthorizedException(
                'Session expired. Please log in again.',
            );
        }

        await this.authService.logout(dto.refreshToken);

        response.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    }

    /**
     * Invalidates all active refresh tokens across all devices for the authenticated user and clears the cookie.
     *
     * @param user - Authenticated user payload extracted from JWT context.
     * @param response - Express response object to clear the active device cookie.
     * @returns Resolves when all sessions are marked revoked.
     */
    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('logout-all')
    async logoutAll(
        @CurrentUser() user: CurrentUserPayload,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        await this.authService.logoutAll(user.id);
        response.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    }

    /**
     * Retrieves the profile details of the currently authenticated user.
     *
     * @param user - Authenticated user payload extracted from JWT context.
     * @returns Sanitized profile of the requesting user.
     */
    @Get('me')
    me(@CurrentUser() user: CurrentUserPayload): Promise<UserResponse> {
        return this.authService.getProfile(user.id);
    }
}
