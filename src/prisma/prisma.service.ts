import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma-generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor(configService: ConfigService) {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        const adapter = new PrismaPg({ connectionString: databaseUrl });

        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
    }
}
