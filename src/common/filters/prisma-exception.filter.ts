import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma-generated/client';
import { sendErrorResponse } from './filter.utils';

@Catch(
    Prisma.PrismaClientKnownRequestError,
    Prisma.PrismaClientInitializationError,
    Prisma.PrismaClientValidationError,
    Prisma.PrismaClientUnknownRequestError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(PrismaExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        let error = 'Internal Server Error';
        let message: string | string[] = 'A system database error occurred.';

        if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            switch (exception.code) {
                case 'P2002': {
                    const target =
                        (exception.meta?.target as string[] | undefined)?.join(
                            ', ',
                        ) ?? 'field';
                    statusCode = HttpStatus.CONFLICT;
                    error = 'Conflict';
                    message = `A record with this ${target} already exists.`;
                    break;
                }
                case 'P2025':
                    statusCode = HttpStatus.NOT_FOUND;
                    error = 'Not Found';
                    message = 'The requested record was not found.';
                    break;
                case 'P2003':
                    statusCode = HttpStatus.BAD_REQUEST;
                    error = 'Bad Request';
                    message =
                        'This operation references a record that does not exist.';
                    break;
                default:
                    statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
                    error = 'Internal Server Error';
                    message = `Database error occurred (Code: ${exception.code}).`;
                    break;
            }
        }

        sendErrorResponse(
            host,
            this.logger,
            statusCode,
            error,
            message,
            exception,
        );
    }
}
