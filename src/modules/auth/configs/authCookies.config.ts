import { ConfigService } from '@nestjs/config';
import { CookieOptions } from 'express';
import ms, { StringValue } from 'ms';

export function getRefreshCookieOptions(
    configService: ConfigService,
): CookieOptions {
    const expiresInStr = configService.getOrThrow<StringValue>(
        'JWT_REFRESH_EXPIRES_IN',
    );
    const maxAgeMs = ms(expiresInStr);

    return {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge:
            typeof maxAgeMs === 'number' ? maxAgeMs : 7 * 24 * 60 * 60 * 1000,
    };
}
