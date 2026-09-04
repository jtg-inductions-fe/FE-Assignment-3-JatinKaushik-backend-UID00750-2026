import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/** Return a specific cookie value if a key is provided, otherwise return all cookies */
export const Cookies = createParamDecorator(
    (
        data: string | undefined,
        ctx: ExecutionContext,
    ): string | Record<string, string> | undefined => {
        const request = ctx.switchToHttp().getRequest<Request>();

        const cookies = request.cookies as
            Record<string, string | undefined> | undefined;

        if (!cookies) {
            return undefined;
        }

        return data ? cookies[data] : (cookies as Record<string, string>);
    },
);
