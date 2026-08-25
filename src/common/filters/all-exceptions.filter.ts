import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { sendErrorResponse } from './filter.utils';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        sendErrorResponse(
            host,
            this.logger,
            HttpStatus.INTERNAL_SERVER_ERROR,
            'Internal Server Error',
            'Something went wrong. Please try again later.',
            exception,
        );
    }
}
