import { Injectable } from '@nestjs/common';
import type { PermissionCode } from '../common/constants/permissions';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthorizationScope } from './scope.decorator';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}
  async hasPermissions(
    userId: string,
    scope: AuthorizationScope,
    scopeId: string,
    required: PermissionCode[],
  ): Promise<boolean> {
    const role =
      scope === 'TO_CHUC'
        ? await this.prisma.thanhVienToChuc.findFirst({
            where: {
              taiKhoanId: userId,
              toChucId: scopeId,
              trangThai: 'HOAT_DONG',
              toChuc: { deletedAt: null },
            },
            select: {
              vaiTro: {
                select: {
                  vaiTroQuyens: {
                    select: { quyen: { select: { maQuyen: true } } },
                  },
                },
              },
            },
          })
        : await this.prisma.thanhVienKhuTro.findFirst({
            where: {
              taiKhoanId: userId,
              khuTroId: scopeId,
              trangThai: 'HOAT_DONG',
              khuTro: { deletedAt: null },
            },
            select: {
              vaiTro: {
                select: {
                  vaiTroQuyens: {
                    select: { quyen: { select: { maQuyen: true } } },
                  },
                },
              },
            },
          });
    if (!role) return false;
    const granted = new Set(
      role.vaiTro.vaiTroQuyens.map((item) => item.quyen.maQuyen),
    );
    return required.every((permission) => granted.has(permission));
  }

  async canInviteKhuTroMember(
    userId: string,
    khuTroId: string,
  ): Promise<boolean> {
    const membership = await this.prisma.thanhVienKhuTro.findFirst({
      where: {
        taiKhoanId: userId,
        khuTroId,
        trangThai: 'HOAT_DONG',
      },
      select: {
        duocMoiThanhVien: true,
        vaiTro: {
          select: {
            vaiTroQuyens: {
              where: { quyen: { maQuyen: 'KHU_TRO_MOI_THANH_VIEN' } },
              select: { quyenId: true },
            },
          },
        },
      },
    });
    return Boolean(
      membership?.duocMoiThanhVien && membership.vaiTro.vaiTroQuyens.length > 0,
    );
  }

  async resolveKhuTroId(params: Record<string, string | string[] | undefined>) {
    const read = (key: string) => {
      const raw = params[key];
      return Array.isArray(raw) ? raw[0] : raw;
    };
    const khuTroId = read('khuTroId');
    const phongId = read('phongId');
    const khoiNhaId = read('khoiNhaId');
    const tangId = read('tangId');
    const id = read('id');
    if (khuTroId) return khuTroId;
    if (phongId) {
      const phong = await this.prisma.phong.findFirst({
        where: { id: phongId, deletedAt: null },
        select: { khuTroId: true },
      });
      return phong?.khuTroId;
    }
    if (khoiNhaId) {
      const khoiNha = await this.prisma.khoiNha.findFirst({
        where: { id: khoiNhaId, deletedAt: null },
        select: { khuTroId: true },
      });
      return khoiNha?.khuTroId;
    }
    if (tangId) {
      const tang = await this.prisma.tang.findFirst({
        where: { id: tangId, deletedAt: null },
        select: { khoiNha: { select: { khuTroId: true } } },
      });
      return tang?.khoiNha.khuTroId;
    }
    if (id) {
      const [phong, khoiNha, tang] = await Promise.all([
        this.prisma.phong.findFirst({
          where: { id, deletedAt: null },
          select: { khuTroId: true },
        }),
        this.prisma.khoiNha.findFirst({
          where: { id, deletedAt: null },
          select: { khuTroId: true },
        }),
        this.prisma.tang.findFirst({
          where: { id, deletedAt: null },
          select: { khoiNha: { select: { khuTroId: true } } },
        }),
      ]);
      return (
        phong?.khuTroId ?? khoiNha?.khuTroId ?? tang?.khoiNha.khuTroId ?? id
      );
    }
    return undefined;
  }
}
