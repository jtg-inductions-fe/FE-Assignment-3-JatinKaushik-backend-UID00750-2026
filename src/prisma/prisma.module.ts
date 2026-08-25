import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { applySoftDeleteExtensions } from './extensions/soft-delete.extension';

export const EXTENDED_PRISMA_CLIENT = 'EXTENDED_PRISMA_CLIENT';

@Global()
@Module({
    providers: [
        PrismaService,
        {
            provide: EXTENDED_PRISMA_CLIENT,
            useFactory: async (prisma: PrismaService) => {
                await prisma.$connect();
                return applySoftDeleteExtensions(prisma);
            },
            inject: [PrismaService],
        },
    ],
    exports: [PrismaService, EXTENDED_PRISMA_CLIENT],
})
export class PrismaModule {}
