import { Expose, Transform } from 'class-transformer';

export class OrderSummaryResponseDto {
    @Expose() id!: string;
    @Expose() customerId!: string;
    @Expose() restaurantId!: string;
    @Expose() status!: string;

    @Expose()
    @Transform(({ value }) => Number(value))
    subtotal!: number;

    @Expose()
    @Transform(({ value }) => Number(value))
    platformFee!: number;

    @Expose()
    @Transform(({ value }) => Number(value))
    discount!: number;

    @Expose({ name: 'total' })
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
