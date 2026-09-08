import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '@dto/pagination-query.dto';
import { DietaryType } from '@prisma-generated/enums';

export class SearchRestaurantsQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsEnum(DietaryType)
    dietaryType?: DietaryType;
}
