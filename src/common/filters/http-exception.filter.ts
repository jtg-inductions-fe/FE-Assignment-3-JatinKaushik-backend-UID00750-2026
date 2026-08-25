import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    Logger,
} from '@nestjs/common';
import { formatHttpStatusName, sendErrorResponse } from './filter.utils';

interface NestHttpErrorResponse {
    message?: string | string[];
    error?: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const status = exception.getStatus();
        const res = exception.getResponse() as unknown as NestHttpErrorResponse;

        const message =
            typeof res === 'string' ? res : (res.message ?? exception.message);

        sendErrorResponse(
            host,
            this.logger,
            status,
            formatHttpStatusName(status),
            message,
            exception,
        );
    }
}
