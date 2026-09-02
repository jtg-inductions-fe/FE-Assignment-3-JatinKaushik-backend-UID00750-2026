import {
    IsEnum,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PHONE_REGEX, TIME_24H_REGEX } from '@constants/validation.constants';
import { DietaryType } from '@prisma-generated/enums';
import { UpdateRestaurantAddressDto } from './update-restaurant-address.dto';

export class UpdateRestaurantDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(DietaryType)
    dietaryType?: DietaryType;

    @IsOptional()
    @IsString()
    @Matches(PHONE_REGEX, {
        message: 'phone must be a valid phone number',
    })
    phone?: string;

    @IsOptional()
    @IsString()
    @Matches(TIME_24H_REGEX, {
        message: 'openingTime must be in 24-hour "HH:mm" format',
    })
    openingTime?: string;

    @IsOptional()
    @IsString()
    @Matches(TIME_24H_REGEX, {
        message: 'closingTime must be in 24-hour "HH:mm" format',
    })
    closingTime?: string;

    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => UpdateRestaurantAddressDto)
    address?: UpdateRestaurantAddressDto;
}
