import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/** Restricts a route to one or more roles - any role at all if omitted. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
