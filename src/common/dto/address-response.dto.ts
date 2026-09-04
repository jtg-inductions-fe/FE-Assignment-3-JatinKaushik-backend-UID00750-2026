import { Expose } from 'class-transformer';

export class AddressResponseDto {
    @Expose() id!: string;
    @Expose() street!: string;
    @Expose() city!: string;
    @Expose() state!: string;
    @Expose() pincode!: string;
    @Expose() label?: string;
    @Expose() createdAt!: Date;
    @Expose() updatedAt!: Date;
}
