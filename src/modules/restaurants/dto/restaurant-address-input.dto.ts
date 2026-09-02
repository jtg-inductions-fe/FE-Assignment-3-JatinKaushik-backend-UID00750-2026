import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RestaurantAddressInputDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    street!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    city!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    state!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    pincode!: string;
}
