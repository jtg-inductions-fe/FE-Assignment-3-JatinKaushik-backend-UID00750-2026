import { Expose, Type } from 'class-transformer';

export class OrderItemResponseDto {
    @Expose() id!: string;
    @Expose() menuItemId!: string;
    @Expose() nameSnapshot!: string;

    @Expose()
    @Type(() => Number)
    priceSnapshot!: number;

    @Expose() quantity!: number;

    @Expose({ name: 'itemTotal', toPlainOnly: true })
    get itemTotal(): number {
        return Math.round(this.priceSnapshot * this.quantity * 100) / 100;
    }
}
