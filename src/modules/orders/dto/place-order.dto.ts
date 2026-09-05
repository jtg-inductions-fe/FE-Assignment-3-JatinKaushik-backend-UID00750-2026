import {
    ArrayMinSize,
    IsArray,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlaceOrderItemDto } from './place-order-item.dto';

export class PlaceOrderDto {
    @IsUUID()
    restaurantId!: string;

    @IsUUID()
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
