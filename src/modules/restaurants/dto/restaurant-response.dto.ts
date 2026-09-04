import { Expose, Transform, Type } from 'class-transformer';
import { AddressResponseDto } from '@dto/address-response.dto';
import { formatTimeString } from '@utils/time.util';
import { DietaryType } from '@prisma-generated/enums';

export class RestaurantResponseDto {
    @Expose() id!: string;
    @Expose() ownerId!: string;
    @Expose() name!: string;
    @Expose() description?: string;
    @Expose() dietaryType!: DietaryType;
    @Expose() phone!: string;

    @Expose()
    @Transform(({ value }) =>
        value instanceof Date ? formatTimeString(value) : undefined,
    )
    openingTime!: string;

    @Expose()
    @Transform(({ value }) =>
        value instanceof Date ? formatTimeString(value) : undefined,
    )
    closingTime!: string;

    @Expose() createdAt!: Date;
    @Expose() updatedAt!: Date;

    @Expose()
    @Type(() => AddressResponseDto)
    address!: AddressResponseDto;
}
