import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAddressDto {
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

    @IsOptional()
    @IsString()
    @MaxLength(50)
    label?: string; // text like "Home"/"Work"/"Other"
}
