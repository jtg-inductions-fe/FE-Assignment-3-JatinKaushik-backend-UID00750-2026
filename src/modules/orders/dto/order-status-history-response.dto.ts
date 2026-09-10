import { OrderStatus } from '@prisma-generated/enums';
import { Expose } from 'class-transformer';

export class OrderStatusHistoryResponseDto {
    @Expose() id!: string;
    @Expose() status!: OrderStatus;
    @Expose() changedBy!: string;
    @Expose() createdAt!: Date;
}
