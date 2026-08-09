import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload => {
    return context.switchToHttp().getRequest<Request & { user: JwtPayload }>()
      .user;
  },
);
