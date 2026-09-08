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

export class CreateMenuItemDto {
    @IsUUID()
    categoryId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.01)
    price!: number;

    @IsInt()
    @Min(0)
    stockQty!: number;

    @IsEnum(VegType)
    vegType!: VegType;
}
