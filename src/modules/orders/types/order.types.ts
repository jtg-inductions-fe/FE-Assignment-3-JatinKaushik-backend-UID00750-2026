import { ORDER_DETAIL_INCLUDE } from '@common/constants/order.constants';
import { Prisma } from '@prisma-generated/client';

export type OrderWithDetails = Prisma.OrderGetPayload<{
    include: typeof ORDER_DETAIL_INCLUDE;
}>;
