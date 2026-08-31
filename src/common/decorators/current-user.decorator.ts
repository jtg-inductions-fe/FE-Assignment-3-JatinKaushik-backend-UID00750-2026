import {
    ExecutionContext,
    InternalServerErrorException,
    createParamDecorator,
} from '@nestjs/common';
import { CurrentUserPayload } from '@interfaces/current-user.interface';

/** Custom decorator to extract the authenticated user from the request context */
export const CurrentUser = createParamDecorator(
    (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
        const request = ctx
            .switchToHttp()
            .getRequest<{ user: CurrentUserPayload }>();

        const user = request.user;

        if (!user) {
            throw new InternalServerErrorException(
                'CurrentUser decorator used on a route without authenticated user context.',
            );
        }

        return data ? user[data] : user;
    },
);
