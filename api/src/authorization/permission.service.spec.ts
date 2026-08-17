import { PermissionService } from './permission.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

describe('PermissionService', () => {
  it('requires active scoped membership and every requested permission', async () => {
    const prisma = {
      thanhVienToChuc: {
        findFirst: jest.fn().mockResolvedValue({
          vaiTro: { vaiTroQuyens: [{ quyen: { maQuyen: 'TO_CHUC_XEM' } }] },
        }),
      },
    };
    const service = new PermissionService(prisma as unknown as PrismaService);
    await expect(
      service.hasPermissions('user', 'TO_CHUC', 'org', ['TO_CHUC_XEM']),
    ).resolves.toBe(true);
    await expect(
      service.hasPermissions('user', 'TO_CHUC', 'org', [
        'TO_CHUC_XEM',
        'TO_CHUC_SUA',
      ]),
    ).resolves.toBe(false);
  });
  it('requires both invite flag and permission', async () => {
    const prisma = {
      thanhVienKhuTro: {
        findFirst: jest.fn().mockResolvedValue({
          duocMoiThanhVien: false,
          vaiTro: { vaiTroQuyens: [{ quyenId: 'q' }] },
        }),
      },
    };
    const service = new PermissionService(prisma as unknown as PrismaService);
    await expect(service.canInviteKhuTroMember('user', 'khu')).resolves.toBe(
      false,
    );
  });
  it('resolves every residence resource to its actual KhuTro', async () => {
    const prisma = {
      hoSoCuTru: {
        findUnique: jest.fn().mockResolvedValue({ khuTroId: 'k1' }),
      },
      khachLuuTru: {
        findUnique: jest.fn().mockResolvedValue({ khuTroId: 'k2' }),
      },
      tamVang: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ hopDong: { khuTroId: 'k3' } }),
      },
    };
    const service = new PermissionService(prisma as unknown as PrismaService);
    await expect(service.resolveKhuTroId({ hoSoCuTruId: 'h' })).resolves.toBe(
      'k1',
    );
    await expect(service.resolveKhuTroId({ khachLuuTruId: 'g' })).resolves.toBe(
      'k2',
    );
    await expect(service.resolveKhuTroId({ tamVangId: 'a' })).resolves.toBe(
      'k3',
    );
  });
  it('does not treat an unknown generic id as a KhuTro id', async () => {
    const none = { findFirst: jest.fn().mockResolvedValue(null) };
    const unique = { findUnique: jest.fn().mockResolvedValue(null) };
    const prisma = {
      khuTro: none,
      phong: none,
      khoiNha: none,
      tang: none,
      dichVu: none,
      congTo: none,
      hoaDon: unique,
      phieuThu: unique,
    };
    const service = new PermissionService(prisma as unknown as PrismaService);
    await expect(
      service.resolveKhuTroId({ id: 'unknown' }),
    ).resolves.toBeUndefined();
  });
});
