import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PlaceOrderDto } from './dto/place-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderSummaryResponseDto } from './dto/order-summary-response.dto';
import { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import { Roles } from '@decorators/roles.decorator';
import { Role } from '@enums/role.enum';
import { CurrentUser } from '@decorators/current-user.decorator';
import type { CurrentUserPayload } from '@interfaces/current-user.interface';
import { Serialize } from '@interceptors/serialize.interceptor';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { OrderWithDetails } from './repositories/orders.repository';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    /**
     * Places a new order. Restricted to CUSTOMER role.
     *
     * @param user - Authenticated customer context.
     * @param dto - Order parameters.
     * @returns Created order with details.
     */
    @Roles(Role.CUSTOMER)
    @Serialize(OrderDetailResponseDto)
    @HttpCode(HttpStatus.CREATED)
    @Post()
    async placeOrder(
        @CurrentUser() user: CurrentUserPayload,
        @Body() dto: PlaceOrderDto,
    ): Promise<OrderWithDetails> {
        return this.ordersService.placeOrder(user.id, dto);
    }

    /**
     * Lists paginated orders for the authenticated user.
     *
     * @param user - Authenticated user context.
     * @param query - Pagination parameters (?page=1&limit=10).
     * @returns Paginated list of user or restaurant orders.
     */
    @Serialize(OrderSummaryResponseDto)
    @HttpCode(HttpStatus.OK)
    @Get()
    async listOrders(
        @CurrentUser() user: CurrentUserPayload,
        @Query() query: PaginationQueryDto,
    ) {
        return this.ordersService.listOrders(user, query);
    }

    /**
     * Retrieves detailed information for a specific order.
     *
     * @param user - Authenticated user context.
     * @param id - Target order identifier.
     * @returns Complete order details.
     */
    @Serialize(OrderDetailResponseDto)
    @HttpCode(HttpStatus.OK)
    @Get(':id')
    async getOrderDetail(
        @CurrentUser() user: CurrentUserPayload,
        @Param('id') id: string,
    ): Promise<OrderWithDetails> {
        return this.ordersService.getOrderDetail(user, id);
    }

    /**
     * Updates order status. Restricted to RESTAURANT_OWNER role.
     *
     * @param user - Authenticated restaurant owner context.
     * @param id - Target order identifier.
     * @param dto - Target status payload.
     * @returns Updated order details.
     */
    @Roles(Role.RESTAURANT_OWNER)
    @Serialize(OrderDetailResponseDto)
    @HttpCode(HttpStatus.OK)
    @Patch(':id/status')
    async updateStatus(
        @CurrentUser() user: CurrentUserPayload,
        @Param('id') id: string,
        @Body() dto: UpdateOrderStatusDto,
    ): Promise<OrderWithDetails> {
        return this.ordersService.updateStatus(user.id, id, dto.status);
    }
}
