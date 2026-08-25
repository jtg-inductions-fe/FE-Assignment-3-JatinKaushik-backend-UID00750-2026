import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponseBody {
    success: boolean;
    statusCode: number;
    error: string;
    message: string | string[];
    path: string;
    timestamp: string;
}

export function sendErrorResponse(
    host: ArgumentsHost,
    logger: Logger,
    statusCode: HttpStatus,
    error: string,
    message: string | string[],
    exception: unknown,
): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
        logger.error(
            `[CRITICAL] ${request.method} ${request.url} - Status: ${statusCode}`,
            exception instanceof Error ? exception.stack : String(exception),
        );
    } else {
        logger.warn(
            `[CLIENT_ERROR] ${request.method} ${request.url} - Status: ${statusCode} - Msg: ${JSON.stringify(message)}`,
        );
    }

    const body: ErrorResponseBody = {
        success: false,
        statusCode,
        error,
        message,
        path: request.url,
        timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
}

export function formatHttpStatusName(status: number): string {
    const rawName = HttpStatus[status] ?? 'Error';
    return rawName
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
