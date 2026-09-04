import {
    IsEnum,
    IsNotEmptyObject,
    IsObject,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PHONE_REGEX, TIME_24H_REGEX } from '@constants/validation.constants';
import { RestaurantAddressInputDto } from './restaurant-address-input.dto';
import { DietaryType } from '@prisma-generated/enums';

export class CreateRestaurantDto {
    @IsString()
    @MaxLength(255)
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(DietaryType)
    dietaryType!: DietaryType;

    @IsString()
    @Matches(PHONE_REGEX, {
        message: 'phone must be a valid phone number',
    })
    phone!: string;

    @IsString()
    @Matches(TIME_24H_REGEX, {
        message: 'openingTime must be in 24-hour "HH:mm" format',
    })
    openingTime!: string;

    @IsString()
    @Matches(TIME_24H_REGEX, {
        message: 'closingTime must be in 24-hour "HH:mm" format',
    })
    closingTime!: string;

    @IsObject()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => RestaurantAddressInputDto)
    address!: RestaurantAddressInputDto;
}
