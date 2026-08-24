import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwt-payload.interface';
import { CurrentUserPayload } from '@interfaces/current-user.interface';
import { Role } from '@enums/role.enum';

/**
 * JWT Security Strategy
 * Runs only after token verification; returns data to populate 'req.user'.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
        });
    }

    validate(payload: JwtPayload): CurrentUserPayload {
        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role as Role,
        };
    }
}
