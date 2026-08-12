import { ConflictException } from '@nestjs/common';
import { PhongService } from './phong.service';
import { PrismaService } from '../prisma/prisma.service';
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
describe('PhongService', () => {
  const currentGia = {
    id: 'gia-cu',
    phongId: 'p',
    giaCoBan: 1000000n,
    soNguoiBaoGom: 1,
    giaThemMoiNguoi: 0n,
    soNguoiToiDa: null,
    tuNgay: new Date('2026-01-01'),
    denNgay: null,
    trangThai: 'HOAT_DONG',
    ghiChu: null,
  };
  const updateDto = { giaCoBan: '1000000', tuNgay: '2026-01-01' };
  it('rejects a KhoiNha from another KhuTro', async () => {
    const prisma = {
      khuTro: { findFirst: jest.fn().mockResolvedValue({ toChucId: 'tc' }) },
      khoiNha: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new PhongService(prisma as unknown as PrismaService);
    await expect(
      service.create('u', 'khu-a', {
        khoiNhaId: 'khoi-b',
        maPhong: 'P1',
        tenPhong: 'P1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('rejects overlapping pricing periods', async () => {
    const prisma = {
      phong: {
        findFirst: jest.fn().mockResolvedValue({ id: 'p', khuTroId: 'k' }),
      },
      chinhSachGiaPhong: {
        findFirst: jest.fn().mockResolvedValue({ id: 'old' }),
      },
    };
    const service = new PhongService(prisma as unknown as PrismaService);
    await expect(
      service.createGia('u', 'p', {
        giaCoBan: '1000000',
        tuNgay: '2026-01-01',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns the current version for an identical PATCH', async () => {
    const prisma = {
      phong: {
        findFirst: jest.fn().mockResolvedValue({ id: 'p', khuTroId: 'k' }),
      },
      chinhSachGiaPhong: { findFirst: jest.fn().mockResolvedValue(currentGia) },
      $transaction: jest.fn(),
    };
    const service = new PhongService(prisma as unknown as PrismaService);
    await expect(
      service.updateGia('u', 'p', 'gia-cu', updateDto),
    ).resolves.toBe(currentGia);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each([
    ['changed price', { ...updateDto, giaCoBan: '1100000' }],
    ['changed date', { ...updateDto, tuNgay: '2026-02-01' }],
  ])('creates a new version for %s', async (_name, dto) => {
    const tx = {
      chinhSachGiaPhong: {
        update: jest.fn(),
        create: jest.fn().mockResolvedValue({ ...currentGia, id: 'gia-moi' }),
      },
      nhatKyHeThong: { create: jest.fn() },
    };
    const prisma = {
      phong: {
        findFirst: jest.fn().mockResolvedValue({ id: 'p', khuTroId: 'k' }),
      },
      khuTro: { findFirst: jest.fn().mockResolvedValue({ toChucId: 'tc' }) },
      chinhSachGiaPhong: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(currentGia)
          .mockResolvedValueOnce(null),
      },
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new PhongService(prisma as unknown as PrismaService);
    await service.updateGia('u', 'p', 'gia-cu', dto);
    expect(tx.chinhSachGiaPhong.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'gia-cu' } }),
    );
    expect(tx.chinhSachGiaPhong.create).toHaveBeenCalledTimes(1);
  });

  it('rejects overlap without modifying old history', async () => {
    const prisma = {
      phong: {
        findFirst: jest.fn().mockResolvedValue({ id: 'p', khuTroId: 'k' }),
      },
      chinhSachGiaPhong: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(currentGia)
          .mockResolvedValueOnce({ id: 'overlap' }),
      },
      $transaction: jest.fn(),
    };
    const service = new PhongService(prisma as unknown as PrismaService);
    await expect(
      service.updateGia('u', 'p', 'gia-cu', {
        ...updateDto,
        giaCoBan: '1200000',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
