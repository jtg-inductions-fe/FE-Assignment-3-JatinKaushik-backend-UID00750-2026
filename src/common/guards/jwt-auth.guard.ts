import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@decorators/public.decorator';
import { isObservable, lastValueFrom } from 'rxjs';

/**
 * Global auth guard making routes secure by default.
 * All routes require JWT authentication unless marked with @Public().
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private readonly reflector: Reflector) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (isPublic) {
            return true;
        }

        const result = super.canActivate(context);

        if (typeof result === 'boolean') {
            return result;
        }

        if (isObservable(result)) {
            return lastValueFrom(result);
        }

        return result;
    }
}
