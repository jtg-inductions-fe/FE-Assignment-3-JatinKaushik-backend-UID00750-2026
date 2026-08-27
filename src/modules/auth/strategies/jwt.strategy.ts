import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwt-payload.interface';
import { CurrentUserPayload } from '@interfaces/current-user.interface';
import { EXTENDED_PRISMA_CLIENT } from '../../../prisma/prisma.module';
import type { ExtendedPrismaClient } from '../../../prisma/extensions/soft-delete.extension';

/**
 * JWT Security Strategy
 * Runs only after token verification; returns data to populate 'req.user'.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
        @Inject(EXTENDED_PRISMA_CLIENT)
        private readonly prisma: ExtendedPrismaClient,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        });
    }

    /**
     * Validates JWT payload and verifies user presence in PostgreSQL database.
     */
    async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
        const user = await this.prisma.user.findFirst({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true },
        });

        if (!user) {
            throw new UnauthorizedException(
                'User account no longer exists or is deactivated.',
            );
        }
        const currentUser: CurrentUserPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
        };
        return currentUser;
    }
}
