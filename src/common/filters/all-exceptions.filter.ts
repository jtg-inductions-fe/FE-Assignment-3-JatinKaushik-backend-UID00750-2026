import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma-generated/client';
import { Request, Response } from 'express';

interface ErrorResponseBody {
    statusCode: number;
    error: string;
    message: string | string[];
    path: string;
    timestamp: string;
}

interface ResolvedException {
    statusCode: HttpStatus;
    error: string;
    message: string | string[];
}

interface NestHttpErrorResponse {
    message?: string | string[];
    error?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const { statusCode, error, message } = this.resolveException(exception);

        // full stack trace output for 500 Errors
        if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `[CRITICAL] ${request.method} ${request.url} - Status: ${statusCode}`,
                exception instanceof Error
                    ? exception.stack
                    : String(exception),
            );
        } else {
            // full stack trace output for 4xx Client warnings
            this.logger.warn(
                `[CLIENT_ERROR] ${request.method} ${request.url} - Status: ${statusCode} - Msg: ${JSON.stringify(message)}`,
            );
        }

        const body: ErrorResponseBody = {
            statusCode,
            error,
            message,
            path: request.url,
            timestamp: new Date().toISOString(),
        };

        response.status(statusCode).json(body);
    }

    /** Finds if the error comes from NestJS, Prisma, or a system crash */
    private resolveException(exception: unknown): ResolvedException {
        // For HTTP Exceptions
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const res =
                exception.getResponse() as unknown as NestHttpErrorResponse;
            const message =
                typeof res === 'string'
                    ? res
                    : ((res as { message?: string | string[] }).message ??
                      exception.message);
            return {
                statusCode: status,
                error: this.errorNameFor(status),
                message,
            };
        }

        // For Prisma Exceptions
        if (this.isPrismaException(exception)) {
            return this.resolvePrismaError(exception);
        }

        // For Default Unknown Runtime Exceptions
        return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
            message: 'Something went wrong. Please try again later.',
        };
    }

    /** Converts technical database errors into clear HTTP responses for the client */
    private resolvePrismaError(exception: unknown): ResolvedException {
        if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            switch (exception.code) {
                case 'P2002': {
                    const target =
                        (exception.meta?.target as string[] | undefined)?.join(
                            ', ',
                        ) ?? 'field';
                    return {
                        statusCode: HttpStatus.CONFLICT,
                        error: 'Conflict',
                        message: `A record with this ${target} already exists.`,
                    };
                }
                case 'P2025':
                    return {
                        statusCode: HttpStatus.NOT_FOUND,
                        error: 'Not Found',
                        message: 'The requested record was not found.',
                    };
                case 'P2003':
                    return {
                        statusCode: HttpStatus.BAD_REQUEST,
                        error: 'Bad Request',
                        message:
                            'This operation references a record that does not exist.',
                    };
                default:
                    return {
                        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                        error: 'Internal Server Error',
                        message: `Database error occurred (Code: ${exception.code}).`,
                    };
            }
        }

        return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
            message: 'A system database error occurred.',
        };
    }

    /** Checks if the error was triggered by the Prisma database */
    private isPrismaException(exception: unknown): boolean {
        return (
            exception instanceof Prisma.PrismaClientKnownRequestError ||
            exception instanceof Prisma.PrismaClientInitializationError ||
            exception instanceof Prisma.PrismaClientValidationError ||
            exception instanceof Prisma.PrismaClientUnknownRequestError
        );
    }

    /** Returns status codes names with clean text for clients */
    private errorNameFor(status: number): string {
        const rawName = HttpStatus[status] ?? 'Error';
        return rawName
            .toLowerCase()
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}
