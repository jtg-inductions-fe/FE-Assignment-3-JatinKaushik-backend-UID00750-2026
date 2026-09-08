import {
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsString()
    @Matches(/^[0-9+\-\s]{7,20}$/, {
        message: 'phone must be a valid phone number',
    })
    phone?: string;
}
