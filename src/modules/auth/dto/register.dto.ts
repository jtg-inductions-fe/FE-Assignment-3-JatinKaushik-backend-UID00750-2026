import {
    IsEmail,
    IsEnum,
    IsString,
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
    email!: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    password!: string;

    @IsString()
    @Matches(/^[0-9+\-\s]{7,20}$/, {
        message: 'phone must be a valid phone number',
    })
    phone!: string;

    @IsEnum(Role)
    role!: Role;
}
