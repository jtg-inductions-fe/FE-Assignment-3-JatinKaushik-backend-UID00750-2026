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
                return plainToInstance(this.dto, data, {
                    excludeExtraneousValues: true,
                });
            }),
        );
    }
}
