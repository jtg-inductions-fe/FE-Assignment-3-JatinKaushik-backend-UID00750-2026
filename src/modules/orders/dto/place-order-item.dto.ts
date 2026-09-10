import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class PlaceOrderItemDto {
    @IsUUID()
    @IsNotEmpty()
    menuItemId!: string;

    @IsInt()
    @Min(1)
    quantity!: number;
}
