import {
    IsEmail,
    IsEnum,
    IsString,
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

    @IsEnum(Role)
    role!: Role;
}
