import { Expose } from 'class-transformer';

export class UserResponseDto {
    @Expose() id!: string;
    @Expose() name!: string;
    @Expose() email!: string;
    @Expose() phone!: string;
    @Expose() role!: string;
    @Expose() createdAt!: Date;
    @Expose() updatedAt!: Date;
}
