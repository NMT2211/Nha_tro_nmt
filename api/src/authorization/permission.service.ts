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

  async canInvitePropertyMember(
    userId: string,
    propertyId: string,
  ): Promise<boolean> {
    const membership = await this.prisma.thanhVienKhuTro.findFirst({
      where: {
        taiKhoanId: userId,
        khuTroId: propertyId,
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
}
