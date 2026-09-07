import { Prisma } from '@prisma-generated/client';

export const ORDER_DETAIL_INCLUDE = {
    items: true,
    statusHistory: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.OrderInclude;
