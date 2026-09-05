import { IsInt, IsUUID, Min } from 'class-validator';

export class PlaceOrderItemDto {
    @IsUUID()
    menuItemId!: string;

    @IsInt()
    @Min(1)
    quantity!: number;
}
