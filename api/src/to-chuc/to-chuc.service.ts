import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PERMISSION_DEFINITIONS } from '../common/constants/permissions';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateToChucDto } from './dto/create-to-chuc.dto';

@Injectable()
export class ToChucService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateToChucDto) {
    return this.prisma.$transaction(async (tx) => {
      for (const permission of PERMISSION_DEFINITIONS)
        await tx.quyen.upsert({
          where: { maQuyen: permission.maQuyen },
          update: {
            tenQuyen: permission.tenQuyen,
            nhomQuyen: permission.nhomQuyen,
          },
          create: permission,
        });
      const organization = await tx.toChuc.create({
        data: {
          maToChuc: `TC-${randomBytes(6).toString('hex').toUpperCase()}`,
          tenToChuc: dto.tenToChuc,
          ...(dto.email ? { email: dto.email } : {}),
          ...(dto.soDienThoai ? { soDienThoai: dto.soDienThoai } : {}),
        },
      });
      const ownerRole = await tx.vaiTro.create({
        data: {
          toChucId: organization.id,
          maVaiTro: 'CHU_SO_HUU',
          tenVaiTro: 'Chủ sở hữu',
          laMacDinh: true,
          laHeThong: true,
        },
      });
      const permissions = await tx.quyen.findMany({ select: { id: true } });
      await tx.vaiTroQuyen.createMany({
        data: permissions.map(({ id }) => ({
          vaiTroId: ownerRole.id,
          quyenId: id,
        })),
        skipDuplicates: true,
      });
      await tx.thanhVienToChuc.create({
        data: {
          toChucId: organization.id,
          taiKhoanId: userId,
          vaiTroId: ownerRole.id,
        },
      });
      await tx.nhatKyHeThong.create({
        data: {
          toChucId: organization.id,
          taiKhoanId: userId,
          hanhDong: 'TO_CHUC_TAO',
          loaiDoiTuong: 'TO_CHUC',
          doiTuongId: organization.id,
          duLieuSau: {
            tenToChuc: organization.tenToChuc,
            maToChuc: organization.maToChuc,
          },
        },
      });
      return organization;
    });
  }

  list(userId: string) {
    return this.prisma.toChuc.findMany({
      where: {
        deletedAt: null,
        thanhViens: { some: { taiKhoanId: userId, trangThai: 'HOAT_DONG' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async getById(userId: string, id: string) {
    const organization = await this.prisma.toChuc.findFirst({
      where: {
        id,
        deletedAt: null,
        thanhViens: { some: { taiKhoanId: userId, trangThai: 'HOAT_DONG' } },
      },
    });
    if (!organization) throw new NotFoundException('Không tìm thấy tổ chức');
    return organization;
  }
}
