import {
    ArrayMinSize,
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlaceOrderItemDto } from './place-order-item.dto';

export class PlaceOrderDto {
    @IsUUID()
    @IsNotEmpty()
    restaurantId!: string;

    @IsUUID()
    @IsNotEmpty()
    deliveryAddressId!: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => PlaceOrderItemDto)
    items!: PlaceOrderItemDto[];

    @IsOptional()
    @IsString()
    couponCode?: string;
}
