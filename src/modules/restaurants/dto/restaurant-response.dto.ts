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
    @Transform(
        ({ value }: { value: Date | string | undefined }) =>
            value &&
            (typeof value === 'string' ? value : formatTimeString(value)),
    )
    openingTime!: string;

    @Expose()
    @Transform(
        ({ value }: { value: Date | null | undefined }) =>
            value &&
            (typeof value === 'string' ? value : formatTimeString(value)),
    )
    closingTime!: string;

    @Expose() createdAt!: Date;
    @Expose() updatedAt!: Date;

    @Expose()
    @Type(() => AddressResponseDto)
    address!: AddressResponseDto;
}
