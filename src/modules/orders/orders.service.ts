import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Role } from '@enums/role.enum';
import type { CurrentUserPayload } from '@interfaces/current-user.interface';
import { PlaceOrderDto } from './dto/place-order.dto';
import { calculatePricing } from './utils/pricing.util';
import { assertValidOwnerTransition } from './utils/order-status.util';
import { OrderStatus, Prisma } from '@prisma-generated/client';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { OrderRepository } from './repositories/orders.repository';
import { RestaurantRepository } from '../restaurants/repositories/restaurants.repository';
import { AddressRepository } from '@common/repositories/address.repository';
import { MenuItemRepository } from '../menu/repositories/menu-item.repository';
import { PaginatedResult } from '@common/interfaces/paginated-result.interface';
import { OrderWithDetails } from './types/order.types';

@Injectable()
export class OrdersService {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly restaurantRepository: RestaurantRepository,
        private readonly addressRepository: AddressRepository,
        private readonly menuItemRepository: MenuItemRepository,
    ) {}

    /**
     * Places a new order for a customer. Validates restaurant, delivery address, menu items,
     * calculates pricing, and atomically decrements inventory stock.
     *
     * @param customerId - Requesting customer identifier.
     * @param dto - Order payload details.
     * @returns Newly created order with complete line item details.
     */
    async placeOrder(
        customerId: string,
        dto: PlaceOrderDto,
    ): Promise<OrderWithDetails> {
        // Validate restaurant existence
        const restaurant = await this.restaurantRepository.findFirst({
            id: dto.restaurantId,
        });
        if (!restaurant) {
            throw new NotFoundException('Restaurant not found');
        }

        // Validate customer delivery address
        const address = await this.addressRepository.findFirst({
            id: dto.deliveryAddressId,
            userId: customerId,
        });
        if (!address) {
            throw new NotFoundException('Delivery address not found');
        }

        // Ensure no duplicate menu items exist in requested payload
        const menuItemIds = dto.items.map((item) => item.menuItemId);
        if (new Set(menuItemIds).size !== menuItemIds.length) {
            throw new BadRequestException(
                'Each menu item can only appear once in an order — combine quantities instead.',
            );
        }

        // Validate menu items belong to the target restaurant
        const menuItems = await this.menuItemRepository.findMany({
            where: {
                id: { in: menuItemIds },
                restaurantId: dto.restaurantId,
            },
        });
        if (menuItems.length !== menuItemIds.length) {
            throw new BadRequestException(
                'One or more menu items do not belong to this restaurant, or no longer exist.',
            );
        }

        const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));

        // Build price and name snapshot line items
        const lineItems = dto.items.map((requested) => {
            const menuItem = menuItemsById.get(requested.menuItemId)!;
            return {
                menuItemId: menuItem.id,
                nameSnapshot: menuItem.name,
                priceSnapshot: Number(menuItem.price),
                quantity: requested.quantity,
            };
        });

        const pricing = calculatePricing(lineItems);

        // Execute atomic stock decrement and order creation transaction
        return this.orderRepository.executeTransaction(async (tx) => {
            for (const line of lineItems) {
                const affectedCount =
                    await this.orderRepository.decrementStockQty(
                        tx,
                        line.menuItemId,
                        line.quantity,
                    );

                if (affectedCount === 0) {
                    throw new ConflictException(
                        `"${line.nameSnapshot}" no longer has enough stock for the requested quantity.`,
                    );
                }
            }

            return this.orderRepository.createOrderWithDetails(tx, {
                customer: { connect: { id: customerId } },
                restaurant: { connect: { id: dto.restaurantId } },
                status: OrderStatus.PENDING,
                deliveryStreet: address.street,
                deliveryCity: address.city,
                deliveryState: address.state,
                deliveryPincode: address.pincode,
                subtotal: pricing.subtotal,
                platformFee: pricing.platformFee,
                discount: pricing.discount,
                items: {
                    create: lineItems.map((line) => ({
                        menuItemId: line.menuItemId,
                        nameSnapshot: line.nameSnapshot,
                        priceSnapshot: line.priceSnapshot,
                        quantity: line.quantity,
                    })),
                },
                statusHistory: {
                    create: {
                        status: OrderStatus.PENDING,
                        changedBy: customerId,
                    },
                },
            });
        });
    }

    /**
     * Lists paginated orders scoped by user role (Customer sees their orders, Owner sees their restaurant's orders).
     *
     * @param user - Current authenticated user context.
     * @param query - Pagination query parameters.
     * @returns Paginated order records.
     */
    async listOrders(
        user: CurrentUserPayload,
        query: PaginationQueryDto,
    ): Promise<PaginatedResult<OrderWithDetails>> {
        const where: Prisma.OrderWhereInput =
            user.role === Role.CUSTOMER
                ? { customerId: user.id }
                : { restaurant: { ownerId: user.id } };

        return this.orderRepository.findPaginatedOrders(
            where,
            query,
        ) as unknown as Promise<PaginatedResult<OrderWithDetails>>;
    }

    /**
     * Fetches detailed order information verifying role-based access permissions.
     *
     * @param user - Current authenticated user context.
     * @param orderId - Target order identifier.
     * @returns Order entity with nested details.
     */
    async getOrderDetail(
        user: CurrentUserPayload,
        orderId: string,
    ): Promise<OrderWithDetails> {
        const where: Prisma.OrderWhereInput =
            user.role === Role.CUSTOMER
                ? { id: orderId, customerId: user.id }
                : { id: orderId, restaurant: { ownerId: user.id } };

        const order = await this.orderRepository.findOrderWithDetails(where);
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        return order;
    }

    /**
     * Updates status of an order after verifying owner authorization and valid state transitions.
     *
     * @param ownerId - Restaurant owner user identifier.
     * @param orderId - Target order identifier.
     * @param nextStatus - Requested new status.
     * @returns Updated order details.
     */
    async updateStatus(
        ownerId: string,
        orderId: string,
        nextStatus: OrderStatus,
    ): Promise<OrderWithDetails> {
        return await this.orderRepository.executeTransaction(async (tx) => {
            const order = await this.assertOrderOwnedByRestaurantOwner(
                tx,
                orderId,
                ownerId,
            );

            assertValidOwnerTransition(order.status, nextStatus);

            return this.orderRepository.updateOrderStatusWithHistory(
                tx,
                orderId,
                nextStatus,
                ownerId,
            );
        });
    }

    /**
     * Asserts that an order belongs to a restaurant owned by the requesting user within a transaction.
     */
    private async assertOrderOwnedByRestaurantOwner(
        tx: Parameters<
            Parameters<typeof this.orderRepository.executeTransaction>[0]
        >[0],
        orderId: string,
        ownerId: string,
    ) {
        const order = await tx.order.findFirst({
            where: { id: orderId, restaurant: { ownerId } },
        });
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        return order;
    }
}
