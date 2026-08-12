import { ForbiddenException } from '@nestjs/common';
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PermissionService } from '../authorization/permission.service';
import { PrismaService } from '../prisma/prisma.service';
import { KhuTroService } from './khu-tro.service';
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

describe('KhuTroService', () => {
  const dto = { toChucId: 'to-chuc', tenKhu: 'Khu A' };
  it('rejects creation when user lacks ToChuc permission', async () => {
    const prisma = { $transaction: jest.fn() };
    const permissions = { hasPermissions: jest.fn().mockResolvedValue(false) };
    const service = new KhuTroService(
      prisma as unknown as PrismaService,
      permissions as unknown as PermissionService,
    );
    await expect(service.create('user', dto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('creates KhuTro, ownership, membership, config and audit in one transaction', async () => {
    const tx = {
      vaiTro: { findFirst: jest.fn().mockResolvedValue({ id: 'role' }) },
      khuTro: {
        create: jest.fn().mockResolvedValue({
          id: 'khu',
          toChucId: 'to-chuc',
          maKhu: 'KT-A',
          tenKhu: 'Khu A',
        }),
      },
      khuTroChuSoHuu: { create: jest.fn() },
      thanhVienKhuTro: { create: jest.fn() },
      cauHinhKhuTro: { create: jest.fn() },
      nhatKyHeThong: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const permissions = { hasPermissions: jest.fn().mockResolvedValue(true) };
    const service = new KhuTroService(
      prisma as unknown as PrismaService,
      permissions as unknown as PermissionService,
    );
    await service.create('user', dto);
    expect(tx.khuTroChuSoHuu.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ laChuSoHuuChinh: true }),
      }),
    );
    expect(tx.thanhVienKhuTro.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ duocMoiThanhVien: true }),
      }),
    );
    expect(tx.cauHinhKhuTro.create).toHaveBeenCalled();
    expect(tx.nhatKyHeThong.create).toHaveBeenCalled();
  });
  it('lists only ownership or active membership visibility', async () => {
    const prisma = {
      khuTro: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((queries: Promise<unknown>[]) =>
        Promise.all(queries),
      ),
    };
    const service = new KhuTroService(
      prisma as unknown as PrismaService,
      {} as PermissionService,
    );
    await service.list('user', 1, 20);
    expect(prisma.khuTro.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          AND: expect.any(Array),
        }),
      }),
    );
  });
});
