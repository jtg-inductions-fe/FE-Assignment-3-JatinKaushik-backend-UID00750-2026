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

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ) {
        const { user, accessToken, refreshToken } =
            await this.authService.login(dto);

        response.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return { user, accessToken };
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    async refresh(
        @Cookies() dto: RefreshTokenDto,
        @Res({ passthrough: true }) response: Response,
    ) {
        if (!dto.refreshToken) {
            throw new UnauthorizedException(
                'Session expired. Please log in again.',
            );
        }

        const tokens = await this.authService.refresh(dto.refreshToken);

        response.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return { accessToken: tokens.accessToken };
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('logout')
    async logout(
        @Cookies() dto: RefreshTokenDto,
        @Res({ passthrough: true }) response: Response,
    ) {
        if (!dto.refreshToken) {
            throw new UnauthorizedException(
                'Session expired. Please log in again.',
            );
        }

        await this.authService.logout(dto.refreshToken);

        response.clearCookie('refreshToken');
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('logout-all')
    async logoutAll(
        @CurrentUser() user: CurrentUserPayload,
        @Res({ passthrough: true }) response: Response,
    ) {
        await this.authService.logoutAll(user.id);
        response.clearCookie('refreshToken');
    }

    @Get('me')
    me(@CurrentUser() user: CurrentUserPayload) {
        return this.authService.getProfile(user.id);
    }
}
