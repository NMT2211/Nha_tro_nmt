import { ConflictException, ForbiddenException } from '@nestjs/common';
import {
  LoaiGiaoDichCoc,
  TrangThaiHopDong,
} from '../../generated/prisma/client';
import { PermissionService } from '../authorization/permission.service';
import { PrismaService } from '../prisma/prisma.service';
import { HopDongService } from './hop-dong.service';
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

describe('HopDongService', () => {
  const hop = {
    id: 'hop',
    khuTroId: 'khu',
    phongId: 'phong',
    maHopDong: 'HD-1',
    ngayBatDau: new Date('2026-08-01'),
    ngayKetThuc: null,
    tienCocThoaThuan: 3_000_000n,
    soNgayBaoTruoc: 7,
    xuLyBaoTre: 'MAT_TOAN_BO_COC',
    trangThai: TrangThaiHopDong.DANG_HIEU_LUC,
    soNguoiToiDa: 2,
    phong: { trangThai: 'DANG_O' },
    khuTro: { toChucId: 'tc' },
  };
  const permission = { hasPermissions: jest.fn().mockResolvedValue(true) };

  it('rejects an unrelated account before returning a contract', async () => {
    const prisma = { hopDong: { findFirst: jest.fn().mockResolvedValue(hop) } };
    const denied = { hasPermissions: jest.fn().mockResolvedValue(false) };
    const service = new HopDongService(
      prisma as unknown as PrismaService,
      denied as unknown as PermissionService,
    );
    await expect(service.get('other', 'hop')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('calculates exact deposit balance from immutable transactions', async () => {
    const rows = [
      { loaiGiaoDich: LoaiGiaoDichCoc.THU_COC, soTien: 3_000_000n },
      { loaiGiaoDich: LoaiGiaoDichCoc.KHAU_TRU_COC, soTien: 500_000n },
      { loaiGiaoDich: LoaiGiaoDichCoc.HOAN_COC, soTien: 1_000_000n },
    ];
    const prisma = {
      hopDong: { findFirst: jest.fn().mockResolvedValue(hop) },
      giaoDichTienCoc: { findMany: jest.fn().mockResolvedValue(rows) },
    };
    const service = new HopDongService(
      prisma as unknown as PrismaService,
      permission as unknown as PermissionService,
    );
    const result = await service.listDeposits('user', 'hop');
    expect(result.summary).toEqual(
      expect.objectContaining({
        received: 3_000_000n,
        refunded: 1_000_000n,
        forfeitedOrDeducted: 500_000n,
        remaining: 1_500_000n,
      }),
    );
  });

  it('rejects a duplicate active member', async () => {
    const prisma = {
      hopDong: { findFirst: jest.fn().mockResolvedValue(hop) },
      caNhan: { findFirst: jest.fn().mockResolvedValue({ id: 'cn' }) },
      thanhVienHopDong: {
        findFirst: jest.fn().mockResolvedValue({ id: 'member' }),
      },
    };
    const service = new HopDongService(
      prisma as unknown as PrismaService,
      permission as unknown as PermissionService,
    );
    await expect(
      service.addMember('user', 'hop', {
        caNhanId: 'cn',
        vaiTro: 'NGUOI_CUNG_O',
        ngayBatDauO: '2026-08-01',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
