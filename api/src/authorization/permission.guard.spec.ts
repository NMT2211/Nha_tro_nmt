import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import { PermissionService } from './permission.service';

jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

describe('PermissionGuard', () => {
  it('denies access when scoped permissions are not granted', async () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(['TO_CHUC_XEM'])
        .mockReturnValueOnce('TO_CHUC'),
    };
    const permissions = { hasPermissions: jest.fn().mockResolvedValue(false) };
    const guard = new PermissionGuard(
      reflector as unknown as Reflector,
      permissions as unknown as PermissionService,
    );
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          params: { id: '71b39d2b-34ab-4fb0-8010-4ffde561479e' },
          user: { sub: 'user-id' },
        }),
      }),
    };
    await expect(
      guard.canActivate(context as unknown as ExecutionContext),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
