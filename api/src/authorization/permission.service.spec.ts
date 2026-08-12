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
});
