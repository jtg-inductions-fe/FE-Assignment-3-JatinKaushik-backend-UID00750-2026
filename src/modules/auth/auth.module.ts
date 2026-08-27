import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserRepository } from '@modules/users/repositories/user.repository';
import { RefreshTokenRepository } from './respositories/refresh-token.repository';

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService): JwtModuleOptions => ({
                secret: config.getOrThrow('JWT_ACCESS_SECRET'),
                signOptions: {
                    expiresIn: config.getOrThrow('JWT_ACCESS_EXPIRES_IN'),
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy,
        UserRepository,
        RefreshTokenRepository,
    ],
    exports: [AuthService],
})
export class AuthModule {}
