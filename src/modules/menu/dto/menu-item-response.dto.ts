import { VegType } from '@prisma-generated/client';
import { Expose, Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class MenuItemResponseDto {
    @Expose() id!: string;
    @Expose() categoryId!: string;
    @Expose() name!: string;
    @Expose() description?: string;

    @Expose()
    @Type(() => Number)
    @IsNumber()
    price!: number;

    @Expose() stockQty!: number;
    @Expose() vegType!: VegType;

    @Expose({ name: 'is_available' })
    get isAvailable(): boolean {
        return this.stockQty > 0;
    }

    @Expose() createdAt!: Date;
    @Expose() updatedAt!: Date;
}
