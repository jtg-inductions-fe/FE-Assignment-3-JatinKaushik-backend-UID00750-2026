import { Role } from '@common/enums/role.enum';
import { Expose } from 'class-transformer';

export class UserResponseDto {
    @Expose() id!: string;
    @Expose() name!: string;
    @Expose() email!: string;
    @Expose() phone!: string;
    @Expose() role!: Role;
    @Expose() createdAt!: Date;
    @Expose() updatedAt!: Date;
}
