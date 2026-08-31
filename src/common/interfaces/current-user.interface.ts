import { Role } from '@enums/role.enum';

export interface CurrentUserPayload {
    id: string;
    email: string;
    role: Role;
}
