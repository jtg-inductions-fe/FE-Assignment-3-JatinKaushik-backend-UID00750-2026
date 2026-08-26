import {
    IsEmail,
    IsEnum,
    IsString,
    IsStrongPassword,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';
import { Role } from '@enums/role.enum';

export class RegisterDto {
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    name!: string;

    @IsEmail()
    @MaxLength(254)
    email!: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    })
    password!: string;

    @IsString()
    @Matches(/^[0-9+\-\s]{7,20}$/, {
        message: 'phone must be a valid phone number',
    })
    phone!: string;

    @IsEnum(Role)
    role!: Role;
}
