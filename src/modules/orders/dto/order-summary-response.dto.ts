import { Expose, Type } from 'class-transformer';

export class OrderSummaryResponseDto {
    @Expose() id!: string;
    @Expose() customerId!: string;
    @Expose() restaurantId!: string;
    @Expose() status!: string;

    @Expose()
    @Type(() => Number)
    subtotal!: number;

    @Expose()
    @Type(() => Number)
    platformFee!: number;

    @Expose()
    @Type(() => Number)
    discount!: number;

    @Expose({ name: 'total', toPlainOnly: true })
    get totalAmount(): number {
        return (
            Math.round(
                (this.subtotal - this.discount + this.platformFee) * 100,
            ) / 100
        );
    }

    @Expose() createdAt!: Date;
    @Expose() updatedAt!: Date;
}
