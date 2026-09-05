import { OrderStatus } from '@prisma-generated/client';
import { IsEnum } from 'class-validator';

export class UpdateOrderStatusDto {
    @IsEnum(OrderStatus)
    status!: OrderStatus;
}
