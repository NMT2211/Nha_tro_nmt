import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import type { Request, Response } from 'express';

interface ErrorBody {
  message?: string | string[];
  error?: string;
  code?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Đã xảy ra lỗi hệ thống';
    let errors: string[] = [];

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = this.mapPrisma(exception.code);
      status = mapped.status;
      code = mapped.code;
      message = mapped.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      const detail: ErrorBody =
        typeof body === 'string' ? { message: body } : body;
      const messages = Array.isArray(detail.message) ? detail.message : [];
      code = detail.code ?? this.httpCode(status, messages.length > 0);
      message =
        messages.length > 0
          ? 'Dữ liệu không hợp lệ'
          : typeof detail.message === 'string'
            ? detail.message
            : exception.message;
      errors = messages;
    } else {
      this.logger.error(
        'Unexpected server error',
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      code,
      message,
      errors,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  private mapPrisma(prismaCode: string): {
    status: number;
    code: string;
    message: string;
  } {
    if (prismaCode === 'P2002')
      return {
        status: 409,
        code: 'RESOURCE_CONFLICT',
        message: 'Dữ liệu đã tồn tại',
      };
    if (prismaCode === 'P2003')
      return {
        status: 409,
        code: 'FOREIGN_KEY_CONFLICT',
        message: 'Dữ liệu đang được tham chiếu hoặc không hợp lệ',
      };
    if (prismaCode === 'P2025')
      return {
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Không tìm thấy dữ liệu',
      };
    return {
      status: 500,
      code: 'DATABASE_ERROR',
      message: 'Không thể xử lý dữ liệu',
    };
  }

  private httpCode(status: number, validation: boolean): string {
    if (validation && status === 400) return 'VALIDATION_ERROR';
    return (
      (
        {
          400: 'BAD_REQUEST',
          401: 'UNAUTHORIZED',
          403: 'FORBIDDEN',
          404: 'NOT_FOUND',
          409: 'CONFLICT',
        } as Record<number, string>
      )[status] ?? 'HTTP_ERROR'
    );
  }
}
