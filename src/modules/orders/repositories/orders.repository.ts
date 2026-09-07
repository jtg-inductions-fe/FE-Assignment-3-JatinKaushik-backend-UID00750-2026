import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository } from '@common/repositories/base.repository';
import { Order, OrderStatus, Prisma } from '@prisma-generated/client';
import type { ExtendedPrismaClient } from '../../../prisma/extensions/soft-delete.extension';
import { EXTENDED_PRISMA_CLIENT } from '../../../prisma/prisma.module';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { paginate } from '@utils/pagination.utils';
import { PaginatedResult } from '@common/interfaces/paginated-result.interface';
import { OrderWithDetails } from '../types/order.types';
import { ORDER_DETAIL_INCLUDE } from '@common/constants/order.constants';

@Injectable()
export class OrderRepository extends BaseRepository<
    Order,
    Prisma.OrderWhereUniqueInput,
    Prisma.OrderUncheckedCreateInput,
    Prisma.OrderUncheckedUpdateInput
> {
    constructor(
        @Inject(EXTENDED_PRISMA_CLIENT)
        prisma: ExtendedPrismaClient,
    ) {
        super(prisma, 'order');
    }

    /**
     * Atomically decrements stock quantity for a menu item if sufficient stock is available.
     *
     * @param tx - Active Prisma transaction client.
     * @param menuItemId - Unique menu item identifier.
     * @param quantity - Quantity requested to decrement.
     * @returns Number of affected rows (1 if successful, 0 if insufficient stock).
     */
    async decrementStockQty(
        tx: ExtendedPrismaClient,
        menuItemId: string,
        quantity: number,
    ): Promise<number> {
        const result = await tx.menuItem.updateMany({
            where: {
                id: menuItemId,
                stockQty: { gte: quantity },
            },
            data: {
                stockQty: { decrement: quantity },
            },
        });
        return result.count;
    }

    /**
     * Creates an order with snapshot line items and initial status history within a transaction.
     *
     * @param tx - Active Prisma transaction client.
     * @param data - Order create input object.
     * @returns Created order entity populated with detailed relations.
     */
    async createOrderWithDetails(
        tx: ExtendedPrismaClient,
        data: Prisma.OrderCreateInput,
    ): Promise<OrderWithDetails> {
        return tx.order.create({
            data,
            include: ORDER_DETAIL_INCLUDE,
        });
    }

    /**
     * Retrieves a paginated list of orders matching query conditions.
     *
     * @param where - Filter conditions for order retrieval.
     * @param query - Pagination query parameters.
     * @returns Paginated result envelope containing order records.
     */
    async findPaginatedOrders(
        where: Prisma.OrderWhereInput,
        query: PaginationQueryDto,
    ): Promise<PaginatedResult<Order>> {
        return paginate(this.prisma.order, query, {
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Retrieves an order by ID and filter condition with full details included.
     *
     * @param where - Unique or conditional filter parameters.
     * @returns Matching order entity or null.
     */
    async findOrderWithDetails(
        where: Prisma.OrderWhereInput,
    ): Promise<OrderWithDetails | null> {
        return this.prisma.order.findFirst({
            where,
            include: ORDER_DETAIL_INCLUDE,
        });
    }

    /**
     * Updates order status and appends a record to the order status history atomically.
     *
     * @param tx - Active Prisma transaction client.
     * @param orderId - Unique order identifier.
     * @param nextStatus - Target order status.
     * @param changedBy - User identifier initiating the status transition.
     * @returns Updated order entity with full relation details.
     */
    async updateOrderStatusWithHistory(
        tx: ExtendedPrismaClient,
        orderId: string,
        nextStatus: OrderStatus,
        changedBy: string,
    ): Promise<OrderWithDetails> {
        await tx.order.update({
            where: { id: orderId },
            data: { status: nextStatus },
        });

        await tx.orderStatusHistory.create({
            data: {
                orderId,
                status: nextStatus,
                changedBy,
            },
        });

        return tx.order.findFirst({
            where: { id: orderId },
            include: ORDER_DETAIL_INCLUDE,
        }) as Promise<OrderWithDetails>;
    }
}
