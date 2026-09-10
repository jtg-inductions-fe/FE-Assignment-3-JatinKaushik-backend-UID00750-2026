import { Expose, Type } from 'class-transformer';
import { getTotalPrice } from '../utils/pricing.util';

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
        return getTotalPrice(this.subtotal, this.platformFee, this.discount);
    }

    @Expose() createdAt!: Date;
    @Expose() updatedAt!: Date;
}
