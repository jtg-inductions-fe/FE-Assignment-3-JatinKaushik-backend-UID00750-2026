import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { CurrentUserPayload } from '@interfaces/current-user.interface';

/** Usage: `getProfile(@CurrentUser() user: CurrentUserPayload)` */
export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
        const request = ctx
            .switchToHttp()
            .getRequest<{ user: CurrentUserPayload }>();
        return request.user;
    },
);
