import { VegType } from '@prisma-generated/enums';
import {
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    MaxLength,
    IsEnum,
} from 'class-validator';

export class UpdateMenuItemDto {
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.01)
    price?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    stockQty?: number;

    @IsOptional()
    @IsEnum(VegType)
    vegType?: VegType;
}
