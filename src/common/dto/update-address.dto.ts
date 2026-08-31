import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAddressDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    street?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    city?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    state?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    pincode?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    label?: string;
}
