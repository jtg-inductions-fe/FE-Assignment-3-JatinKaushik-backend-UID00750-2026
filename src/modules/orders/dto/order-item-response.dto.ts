import { Expose, Transform } from 'class-transformer';

export class OrderItemResponseDto {
    @Expose() id!: string;
    @Expose() menuItemId!: string;
    @Expose() nameSnapshot!: string;

    @Expose()
    @Transform(({ value }) => Number(value))
    priceSnapshot!: number;

    @Expose() quantity!: number;

    @Expose({ name: 'itemTotal' })
    get itemTotal(): number {
        return Math.round(this.priceSnapshot * this.quantity * 100) / 100;
    }
}
