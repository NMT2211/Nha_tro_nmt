/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PermissionService } from '../authorization/permission.service';
import { PrismaService } from '../prisma/prisma.service';
import { CaNhanService } from './ca-nhan.service';
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

describe('CaNhanService', () => {
  it('blocks cross-KhuTro access even when the UUID exists elsewhere', async () => {
    const prisma = { caNhan: { findFirst: jest.fn() } };
    const permissions = { hasPermissions: jest.fn().mockResolvedValue(false) };
    const service = new CaNhanService(
      prisma as unknown as PrismaService,
      permissions as unknown as PermissionService,
      {} as ConfigService,
    );
    await expect(
      service.get('user', 'unrelated', 'person'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.caNhan.findFirst).not.toHaveBeenCalled();
  });
  it('returns not found when a person is not relevant to the scoped KhuTro', async () => {
    const prisma = { caNhan: { findFirst: jest.fn().mockResolvedValue(null) } };
    const permissions = { hasPermissions: jest.fn().mockResolvedValue(true) };
    const service = new CaNhanService(
      prisma as unknown as PrismaService,
      permissions as unknown as PermissionService,
      {} as ConfigService,
    );
    await expect(service.get('user', 'khu', 'person')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.caNhan.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'person', deletedAt: null }),
      }),
    );
  });
});
