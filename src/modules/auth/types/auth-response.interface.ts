import { Role } from '@enums/role.enum';

export interface UserResponse {
    id: string;
    email: string;
    name: string;
    role: Role;
    phone: string;
    createdAt: Date;
}

export interface RegisterResponse {
    user: UserResponse;
}

export interface LoginResponse {
    user: UserResponse;
    accessToken: string;
    refreshToken: string;
}
