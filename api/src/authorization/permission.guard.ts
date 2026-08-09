import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/auth.types';
import type { PermissionCode } from '../common/constants/permissions';
import { PermissionService } from './permission.service';
import { REQUIRED_PERMISSIONS } from './require-permissions.decorator';
import {
  AUTHORIZATION_SCOPE,
  type AuthorizationScope,
} from './scope.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PermissionCode[]>(
      REQUIRED_PERMISSIONS,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;
    const scope = this.reflector.getAllAndOverride<AuthorizationScope>(
      AUTHORIZATION_SCOPE,
      [context.getHandler(), context.getClass()],
    );
    if (!scope)
      throw new ForbiddenException(
        'Endpoint chưa cấu hình authorization scope',
      );
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload }>();
    const rawScopeId =
      scope === 'TO_CHUC'
        ? (request.params.id ?? request.params.toChucId)
        : request.params.khuTroId;
    const scopeId = Array.isArray(rawScopeId) ? rawScopeId[0] : rawScopeId;
    if (
      !scopeId ||
      !(await this.permissions.hasPermissions(
        request.user.sub,
        scope,
        scopeId,
        required,
      ))
    )
      throw new ForbiddenException('Bạn không có quyền trên phạm vi này');
    return true;
  }
}
