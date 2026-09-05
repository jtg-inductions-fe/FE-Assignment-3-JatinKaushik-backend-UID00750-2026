import { Expose, Type } from 'class-transformer';
import { OrderSummaryResponseDto } from './order-summary-response.dto';
import { OrderItemResponseDto } from './order-item-response.dto';
import { OrderStatusHistoryResponseDto } from './order-status-history-response.dto';

export class OrderDetailResponseDto extends OrderSummaryResponseDto {
    @Expose() couponId?: string;
    @Expose() deliveryStreet!: string;
    @Expose() deliveryCity!: string;
    @Expose() deliveryState!: string;
    @Expose() deliveryPincode!: string;

    @Expose()
    @Type(() => OrderItemResponseDto)
    items!: OrderItemResponseDto[];

    @Expose()
    @Type(() => OrderStatusHistoryResponseDto)
    statusHistory!: OrderStatusHistoryResponseDto[];
}
