import { PrismaClient } from '@prisma-generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { applySoftDeleteExtensions } from '../src/prisma/extensions/soft-delete.extension';

const basePrisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

export const testPrisma = applySoftDeleteExtensions(basePrisma);

export async function clearDatabase(): Promise<void> {
    const tablenames = await basePrisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname='public' AND tablename != '_prisma_migrations';
    `;

    if (tablenames.length === 0) return;

    const tables = tablenames
        .map(({ tablename }) => `"${tablename}"`)
        .join(', ');

    await basePrisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
}

export async function closeDatabase(): Promise<void> {
    await basePrisma.$disconnect();
}
