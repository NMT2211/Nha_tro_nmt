import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PermissionService } from '../authorization/permission.service';
import { PrismaService } from '../prisma/prisma.service';
import { KhuTroService } from './khu-tro.service';

jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

describe('KhuTroService member sharing', () => {
  const khuTro = { id: 'khu', toChucId: 'to-chuc' };
  const account = { id: 'tai-khoan' };
  const role = { id: 'vai-tro' };

  function setup(overrides: Record<string, unknown> = {}) {
    const prisma = {
      khuTro: { findFirst: jest.fn().mockResolvedValue(khuTro) },
      taiKhoan: { findFirst: jest.fn().mockResolvedValue(account) },
      vaiTro: { findFirst: jest.fn().mockResolvedValue(role) },
      thanhVienKhuTro: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: 'member' }),
      },
      nhatKyHeThong: { create: jest.fn() },
      ...overrides,
    };
    const permissions = {
      canInviteKhuTroMember: jest.fn().mockResolvedValue(true),
    };
    return {
      prisma,
      permissions,
      service: new KhuTroService(
        prisma as unknown as PrismaService,
        permissions as unknown as PermissionService,
      ),
    };
  }

  it('returns 404 when the email does not belong to an account', async () => {
    const { service, prisma } = setup();
    prisma.taiKhoan.findFirst.mockResolvedValue(null);
    await expect(
      service.addThanhVien('inviter', 'khu', {
        email: 'missing@example.com',
        vaiTroId: role.id,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 400 for a missing or unrelated role', async () => {
    const { service, prisma } = setup();
    prisma.vaiTro.findFirst.mockResolvedValue(null);
    await expect(
      service.addThanhVien('inviter', 'khu', {
        email: 'member@example.com',
        vaiTroId: 'wrong-role',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.vaiTro.findFirst).toHaveBeenCalledWith({
      where: { id: 'wrong-role', toChucId: khuTro.toChucId },
    });
  });

  it('returns 409 for duplicate active membership', async () => {
    const { service, prisma } = setup();
    prisma.thanhVienKhuTro.findUnique.mockResolvedValue({
      trangThai: 'HOAT_DONG',
    });
    await expect(
      service.addThanhVien('inviter', 'khu', {
        email: 'member@example.com',
        vaiTroId: role.id,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('adds an existing account with invite disabled by default', async () => {
    const { service, prisma } = setup();
    await expect(
      service.addThanhVien('inviter', 'khu', {
        email: 'member@example.com',
        vaiTroId: role.id,
      }),
    ).resolves.toEqual({ id: 'member' });
    expect(prisma.thanhVienKhuTro.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ duocMoiThanhVien: false }),
      }),
    );
  });

  it('does not allow a member without effective invite authority to share', async () => {
    const { service, permissions, prisma } = setup();
    permissions.canInviteKhuTroMember.mockResolvedValue(false);
    await expect(
      service.addThanhVien('member', 'khu', {
        email: 'other@example.com',
        vaiTroId: role.id,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.taiKhoan.findFirst).not.toHaveBeenCalled();
  });

  it('allows sharing when the permission service confirms both conditions', async () => {
    const { service, permissions } = setup();
    permissions.canInviteKhuTroMember.mockResolvedValue(true);
    await expect(
      service.addThanhVien('member', 'khu', {
        email: 'other@example.com',
        vaiTroId: role.id,
      }),
    ).resolves.toEqual({ id: 'member' });
  });
});
