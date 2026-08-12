import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  { success: true; data: T }
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<{ success: true; data: T }> {
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data: serializePrismaValues(data) as T,
      })),
    );
  }
}

export function serializePrismaValues(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (Prisma.Decimal.isDecimal(value)) return value.toString();
  if (Array.isArray(value)) return value.map(serializePrismaValues);
  if (value instanceof Date || value === null || typeof value !== 'object')
    return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      serializePrismaValues(item),
    ]),
  );
}
