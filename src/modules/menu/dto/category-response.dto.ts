import { Expose } from 'class-transformer';

export class CategoryResponseDto {
    @Expose() id!: string;
    @Expose() restaurantId!: string;
    @Expose() name!: string;
    @Expose() sortOrder!: number;
    @Expose() createdAt!: Date;
    @Expose() updatedAt!: Date;
}
