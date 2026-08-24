import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { hashPassword } from '@utils/hash.util';
import { PrismaClient } from '@prisma-generated/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        @Inject(PrismaService) private readonly prisma: PrismaClient,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) {}

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
}
