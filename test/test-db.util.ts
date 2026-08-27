import { PrismaClient } from '@prisma-generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

export async function clearDatabase(): Promise<void> {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
}

export async function closeDatabase(): Promise<void> {
    await prisma.$disconnect();
}
