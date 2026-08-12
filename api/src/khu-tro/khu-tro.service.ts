import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client';
import { PermissionService } from '../authorization/permission.service';
import { PERMISSIONS } from '../common/constants/permissions';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AddThanhVienDto,
  CreateKhuTroDto,
  UpdateCauHinhDto,
  UpdateKhuTroDto,
  UpdateThanhVienDto,
} from './dto/khu-tro.dto';

@Injectable()
export class KhuTroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionService,
  ) {}
  async create(userId: string, dto: CreateKhuTroDto) {
    if (
      !(await this.permissions.hasPermissions(userId, 'TO_CHUC', dto.toChucId, [
        PERMISSIONS.KHU_TRO_TAO,
      ]))
    )
      throw new ForbiddenException(
        'Bạn không có quyền tạo khu trọ trong tổ chức này',
      );
    return this.prisma.$transaction(async (tx) => {
      const role = await tx.vaiTro.findFirst({
        where: {
          toChucId: dto.toChucId,
          vaiTroQuyens: {
            some: { quyen: { maQuyen: PERMISSIONS.KHU_TRO_SUA } },
          },
        },
        orderBy: [{ laHeThong: 'desc' }, { createdAt: 'asc' }],
      });
      if (!role)
        throw new ConflictException(
          'Tổ chức chưa có vai trò quản lý khu trọ phù hợp',
        );
      const khuTro = await tx.khuTro.create({
        data: {
          ...dto,
          maKhu: `KT-${randomBytes(6).toString('hex').toUpperCase()}`,
        },
      });
      const now = new Date();
      now.setUTCHours(0, 0, 0, 0);
      await tx.khuTroChuSoHuu.create({
        data: {
          khuTroId: khuTro.id,
          taiKhoanId: userId,
          laChuSoHuuChinh: true,
          tuNgay: now,
        },
      });
      await tx.thanhVienKhuTro.create({
        data: {
          khuTroId: khuTro.id,
          taiKhoanId: userId,
          vaiTroId: role.id,
          duocMoiThanhVien: true,
        },
      });
      await tx.cauHinhKhuTro.create({
        data: { khuTroId: khuTro.id, tuNgay: now },
      });
      await tx.nhatKyHeThong.create({
        data: {
          toChucId: dto.toChucId,
          khuTroId: khuTro.id,
          taiKhoanId: userId,
          hanhDong: 'KHU_TRO_TAO',
          loaiDoiTuong: 'KHU_TRO',
          doiTuongId: khuTro.id,
          duLieuSau: { maKhu: khuTro.maKhu, tenKhu: khuTro.tenKhu },
        },
      });
      return khuTro;
    });
  }
  async list(userId: string, page: number, limit: number, search?: string) {
    const where = {
      deletedAt: null,
      AND: [
        search
          ? {
              OR: [
                { tenKhu: { contains: search, mode: 'insensitive' as const } },
                { maKhu: { contains: search, mode: 'insensitive' as const } },
                {
                  diaChiDayDu: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            }
          : {},
        {
          OR: [
            {
              thanhViens: {
                some: { taiKhoanId: userId, trangThai: 'HOAT_DONG' as const },
              },
            },
            {
              chuSoHuus: {
                some: {
                  taiKhoanId: userId,
                  trangThai: 'HOAT_DONG' as const,
                  denNgay: null,
                },
              },
            },
          ],
        },
      ],
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.khuTro.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.khuTro.count({ where }),
    ]);
    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
  async get(id: string) {
    const result = await this.prisma.khuTro.findFirst({
      where: { id, deletedAt: null },
      include: {
        chuSoHuus: {
          where: {
            laChuSoHuuChinh: true,
            trangThai: 'HOAT_DONG',
            denNgay: null,
          },
          select: {
            taiKhoan: { select: { id: true, hoTen: true, email: true } },
          },
        },
        _count: { select: { khoiNhas: true, phongs: true } },
      },
    });
    if (!result) throw new NotFoundException('Không tìm thấy khu trọ');
    return result;
  }
  async update(userId: string, id: string, dto: UpdateKhuTroDto) {
    const before = await this.get(id);
    const result = await this.prisma.khuTro.update({
      where: { id },
      data: dto,
    });
    await this.audit(
      userId,
      result.toChucId,
      id,
      'KHU_TRO_SUA',
      'KHU_TRO',
      id,
      before,
      result,
    );
    return result;
  }
  async remove(userId: string, id: string) {
    const khuTro = await this.get(id);
    const dependent = await this.prisma.$transaction([
      this.prisma.phong.count({ where: { khuTroId: id, deletedAt: null } }),
      this.prisma.hopDong.count({ where: { khuTroId: id } }),
    ]);
    if (dependent.some(Boolean))
      throw new ConflictException(
        'Không thể xóa khu trọ đang có phòng hoặc hợp đồng',
      );
    const result = await this.prisma.khuTro.update({
      where: { id },
      data: { deletedAt: new Date(), trangThai: 'NGUNG_HOAT_DONG' },
    });
    await this.audit(
      userId,
      khuTro.toChucId,
      id,
      'KHU_TRO_XOA',
      'KHU_TRO',
      id,
      khuTro,
      result,
    );
    return result;
  }
  listThanhVien(khuTroId: string) {
    return this.prisma.thanhVienKhuTro.findMany({
      where: { khuTroId, trangThai: 'HOAT_DONG', khuTro: { deletedAt: null } },
      select: {
        taiKhoanId: true,
        duocMoiThanhVien: true,
        ngayThamGia: true,
        taiKhoan: { select: { hoTen: true, email: true, soDienThoai: true } },
        vaiTro: { select: { id: true, maVaiTro: true, tenVaiTro: true } },
      },
    });
  }
  async addThanhVien(userId: string, khuTroId: string, dto: AddThanhVienDto) {
    if (!(await this.permissions.canInviteKhuTroMember(userId, khuTroId)))
      throw new ForbiddenException('Bạn không có quyền mời thành viên khu trọ');
    const khuTro = await this.get(khuTroId);
    const [account, role] = await Promise.all([
      this.prisma.taiKhoan.findFirst({
        where: { email: dto.email, deletedAt: null, trangThai: 'HOAT_DONG' },
      }),
      this.prisma.vaiTro.findFirst({
        where: { id: dto.vaiTroId, toChucId: khuTro.toChucId },
      }),
    ]);
    if (!account) throw new NotFoundException('Không tìm thấy tài khoản');
    if (!role)
      throw new BadRequestException('Vai trò không thuộc tổ chức của khu trọ');
    const existing = await this.prisma.thanhVienKhuTro.findUnique({
      where: { khuTroId_taiKhoanId: { khuTroId, taiKhoanId: account.id } },
    });
    if (existing?.trangThai === 'HOAT_DONG')
      throw new ConflictException('Thành viên đã có trong khu trọ');
    const member = await this.prisma.thanhVienKhuTro.upsert({
      where: { khuTroId_taiKhoanId: { khuTroId, taiKhoanId: account.id } },
      create: {
        khuTroId,
        taiKhoanId: account.id,
        vaiTroId: role.id,
        nguoiMoiId: userId,
        duocMoiThanhVien: false,
      },
      update: {
        vaiTroId: role.id,
        nguoiMoiId: userId,
        duocMoiThanhVien: false,
        trangThai: 'HOAT_DONG',
        ngayThamGia: new Date(),
      },
    });
    await this.audit(
      userId,
      khuTro.toChucId,
      khuTroId,
      'KHU_TRO_THEM_THANH_VIEN',
      'THANH_VIEN_KHU_TRO',
      member.id,
      undefined,
      { taiKhoanId: account.id, vaiTroId: role.id },
    );
    return member;
  }
  async updateThanhVien(
    userId: string,
    khuTroId: string,
    taiKhoanId: string,
    dto: UpdateThanhVienDto,
  ) {
    const khuTro = await this.get(khuTroId);
    if (
      dto.vaiTroId &&
      !(await this.prisma.vaiTro.findFirst({
        where: { id: dto.vaiTroId, toChucId: khuTro.toChucId },
      }))
    )
      throw new BadRequestException('Vai trò không thuộc tổ chức của khu trọ');
    const before = await this.prisma.thanhVienKhuTro.findUnique({
      where: { khuTroId_taiKhoanId: { khuTroId, taiKhoanId } },
    });
    if (!before || before.trangThai !== 'HOAT_DONG')
      throw new NotFoundException('Không tìm thấy thành viên khu trọ');
    const result = await this.prisma.thanhVienKhuTro.update({
      where: { khuTroId_taiKhoanId: { khuTroId, taiKhoanId } },
      data: dto,
    });
    await this.audit(
      userId,
      khuTro.toChucId,
      khuTroId,
      'KHU_TRO_SUA_THANH_VIEN',
      'THANH_VIEN_KHU_TRO',
      result.id,
      before,
      result,
    );
    return result;
  }
  async removeThanhVien(userId: string, khuTroId: string, taiKhoanId: string) {
    const khuTro = await this.get(khuTroId);
    const owner = await this.prisma.khuTroChuSoHuu.findFirst({
      where: {
        khuTroId,
        taiKhoanId,
        laChuSoHuuChinh: true,
        trangThai: 'HOAT_DONG',
        denNgay: null,
      },
    });
    if (owner) throw new ConflictException('Không thể xóa chủ sở hữu chính');
    const member = await this.prisma.thanhVienKhuTro.findUnique({
      where: { khuTroId_taiKhoanId: { khuTroId, taiKhoanId } },
    });
    if (!member || member.trangThai !== 'HOAT_DONG')
      throw new NotFoundException('Không tìm thấy thành viên khu trọ');
    const result = await this.prisma.thanhVienKhuTro.update({
      where: { khuTroId_taiKhoanId: { khuTroId, taiKhoanId } },
      data: { trangThai: 'NGUNG_HOAT_DONG', duocMoiThanhVien: false },
    });
    await this.audit(
      userId,
      khuTro.toChucId,
      khuTroId,
      'KHU_TRO_XOA_THANH_VIEN',
      'THANH_VIEN_KHU_TRO',
      member.id,
      member,
      result,
    );
    return result;
  }
  async getCauHinh(khuTroId: string) {
    const result = await this.prisma.cauHinhKhuTro.findFirst({
      where: { khuTroId, denNgay: null },
      orderBy: { tuNgay: 'desc' },
    });
    if (!result) throw new NotFoundException('Không tìm thấy cấu hình khu trọ');
    return result;
  }
  async updateCauHinh(userId: string, khuTroId: string, dto: UpdateCauHinhDto) {
    const before = await this.getCauHinh(khuTroId);
    const start = dto.ngayChotChiSoTu ?? before.ngayChotChiSoTu;
    const end = dto.ngayChotChiSoDen ?? before.ngayChotChiSoDen;
    if (start > end)
      throw new ConflictException(
        'Ngày chốt chỉ số bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc',
      );
    const khuTro = await this.get(khuTroId);
    const result = await this.prisma.cauHinhKhuTro.update({
      where: { id: before.id },
      data: dto,
    });
    await this.audit(
      userId,
      khuTro.toChucId,
      khuTroId,
      'CAU_HINH_KHU_TRO_SUA',
      'CAU_HINH_KHU_TRO',
      result.id,
      before,
      result,
    );
    return result;
  }
  private audit(
    userId: string,
    toChucId: string,
    khuTroId: string,
    hanhDong: string,
    loaiDoiTuong: string,
    doiTuongId: string,
    before?: object,
    after?: object,
  ) {
    return this.prisma.nhatKyHeThong.create({
      data: {
        taiKhoanId: userId,
        toChucId,
        khuTroId,
        hanhDong,
        loaiDoiTuong,
        doiTuongId,
        ...(before
          ? {
              duLieuTruoc: JSON.parse(
                JSON.stringify(before),
              ) as Prisma.InputJsonValue,
            }
          : {}),
        ...(after
          ? {
              duLieuSau: JSON.parse(
                JSON.stringify(after),
              ) as Prisma.InputJsonValue,
            }
          : {}),
      },
    });
  }
}
