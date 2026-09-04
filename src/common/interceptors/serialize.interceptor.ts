import {
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    UseInterceptors,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance } from 'class-transformer';

type ClassConstructor = new (...args: unknown[]) => unknown;

export function Serialize(dto: ClassConstructor) {
    return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
    constructor(private dto: ClassConstructor) {}

    intercept(
        _context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        return next.handle().pipe(
            map((data: unknown) => {
                // Check if the response matches a paginated payload structure
                if (
                    data &&
                    typeof data === 'object' &&
                    'data' in data &&
                    Array.isArray(data.data)
                ) {
                    return {
                        ...data,
                        data: plainToInstance(this.dto, data.data, {
                            excludeExtraneousValues: true,
                        }),
                    };
                }

                // Default behavior for single objects or normal flat arrays
                return plainToInstance(this.dto, data, {
                    excludeExtraneousValues: true,
                });
            }),
        );
    }
}
