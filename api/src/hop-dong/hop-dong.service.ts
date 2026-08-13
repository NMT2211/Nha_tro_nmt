import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LoaiGiaoDichCoc,
  Prisma,
  TrangThaiHopDong,
  TrangThaiPhong,
  TrangThaiTraPhong,
} from '../../generated/prisma/client';
import { PermissionService } from '../authorization/permission.service';
import {
  PERMISSIONS,
  type PermissionCode,
} from '../common/constants/permissions';
import {
  ACTIVE_HOP_DONG_STATUSES,
  canTransitionHopDong,
  canTransitionTraPhong,
  daysBetween,
  parseDateOnly,
  requiresImmediateFirstRent,
} from '../common/domain/rental';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateGiaoDichTienCocDto,
  CreateHopDongDto,
  CreateThanhVienDto,
  CreateYeuCauTraPhongDto,
  HopDongQueryDto,
  UpdateHopDongDto,
  UpdateThanhVienDto,
  UpdateYeuCauTraPhongDto,
} from './dto/hop-dong.dto';

@Injectable()
export class HopDongService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionService,
  ) {}

  async create(userId: string, dto: CreateHopDongDto) {
    const start = parseDateOnly(dto.ngayBatDau);
    const end = dto.ngayKetThuc ? parseDateOnly(dto.ngayKetThuc) : undefined;
    if (end && end < start)
      throw new ConflictException('Ngày kết thúc hợp đồng không hợp lệ');
    const phong = await this.prisma.phong.findFirst({
      where: { id: dto.phongId, deletedAt: null, khuTro: { deletedAt: null } },
      include: { khuTro: { select: { toChucId: true } } },
    });
    if (!phong) throw new NotFoundException('Không tìm thấy phòng');
    await this.authorize(userId, phong.khuTroId, PERMISSIONS.HOP_DONG_TAO);
    if (
      phong.trangThai !== TrangThaiPhong.DANG_TRONG &&
      phong.trangThai !== TrangThaiPhong.DA_DAT_COC
    )
      throw new ConflictException(
        'Phòng không ở trạng thái hợp lệ để cho thuê',
      );
    const [occupied, price, config] = await Promise.all([
      this.prisma.hopDong.findFirst({
        where: {
          phongId: dto.phongId,
          deletedAt: null,
          trangThai: { in: ACTIVE_HOP_DONG_STATUSES },
        },
        select: { id: true },
      }),
      this.prisma.chinhSachGiaPhong.findFirst({
        where: {
          phongId: dto.phongId,
          trangThai: 'HOAT_DONG',
          tuNgay: { lte: start },
          OR: [{ denNgay: null }, { denNgay: { gte: start } }],
        },
        orderBy: { tuNgay: 'desc' },
      }),
      this.prisma.cauHinhKhuTro.findFirst({
        where: {
          khuTroId: phong.khuTroId,
          tuNgay: { lte: start },
          OR: [{ denNgay: null }, { denNgay: { gte: start } }],
        },
        orderBy: { tuNgay: 'desc' },
      }),
    ]);
    if (occupied)
      throw new ConflictException('Phòng đã có hợp đồng đang hoạt động');
    if (!price)
      throw new ConflictException('Không tìm thấy chính sách giá phù hợp');
    if (!config)
      throw new ConflictException('Không tìm thấy cấu hình khu trọ phù hợp');
    try {
      return await this.prisma.$transaction(async (tx) => {
        const row = await tx.hopDong.create({
          data: {
            khuTroId: phong.khuTroId,
            phongId: phong.id,
            maHopDong: dto.maHopDong,
            ngayKy: dto.ngayKy ? parseDateOnly(dto.ngayKy) : undefined,
            ngayBatDau: start,
            ngayKetThuc: end,
            giaThueThoaThuan: price.giaCoBan,
            soNguoiBaoGom: price.soNguoiBaoGom,
            giaThemMoiNguoi: price.giaThemMoiNguoi,
            soNguoiToiDa: price.soNguoiToiDa ?? phong.soNguoiToiDa,
            tienCocThoaThuan: BigInt(dto.tienCocThoaThuan ?? '0'),
            ngayThuTien: config.ngayThuTien,
            quyTacTinhNgayLe: config.quyTacTinhNgayLe,
            soNgayBaoTruoc: config.soNgayBaoTraPhong,
            xuLyBaoTre: config.xuLyBaoTre,
            ghiChu: dto.ghiChu,
          },
        });
        await this.auditTx(
          tx,
          userId,
          phong.khuTro.toChucId,
          phong.khuTroId,
          'HOP_DONG_TAO',
          'HOP_DONG',
          row.id,
          row,
        );
        return {
          ...row,
          yeuCauThuTienThangDauNgay: requiresImmediateFirstRent(start),
          kyTinhTienDau: {
            tuNgay: dto.ngayBatDau,
            denNgay: this.endOfMonth(start),
          },
        };
      });
    } catch (error) {
      this.hopDongConflict(error);
    }
  }

  async list(userId: string, query: HopDongQueryDto) {
    const accessible = await this.accessibleKhuTroIds(
      userId,
      PERMISSIONS.HOP_DONG_XEM,
    );
    const scoped = query.khuTroId
      ? accessible.filter((id) => id === query.khuTroId)
      : accessible;
    const where: Prisma.HopDongWhereInput = {
      deletedAt: null,
      khuTroId: { in: scoped },
      ...(query.phongId ? { phongId: query.phongId } : {}),
      ...(query.trangThai ? { trangThai: query.trangThai } : {}),
      ...(query.search
        ? {
            OR: [
              { maHopDong: { contains: query.search, mode: 'insensitive' } },
              {
                phong: {
                  tenPhong: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                thanhViens: {
                  some: {
                    caNhan: {
                      hoTen: { contains: query.search, mode: 'insensitive' },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.hopDong.findMany({
        where,
        include: {
          phong: { select: { maPhong: true, tenPhong: true } },
          _count: { select: { thanhViens: true } },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.hopDong.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
  async get(
    userId: string,
    id: string,
    permission: PermissionCode = PERMISSIONS.HOP_DONG_XEM,
  ) {
    const row = await this.prisma.hopDong.findFirst({
      where: { id, deletedAt: null },
      include: { phong: true, khuTro: { select: { toChucId: true } } },
    });
    if (!row) throw new NotFoundException('Không tìm thấy hợp đồng');
    await this.authorize(userId, row.khuTroId, permission);
    return row;
  }
  async update(userId: string, id: string, dto: UpdateHopDongDto) {
    const old = await this.get(
      userId,
      id,
      dto.trangThai === TrangThaiHopDong.DA_KET_THUC
        ? PERMISSIONS.HOP_DONG_KET_THUC
        : PERMISSIONS.HOP_DONG_SUA,
    );
    if (dto.trangThai && !canTransitionHopDong(old.trangThai, dto.trangThai))
      throw new ConflictException(
        'Không thể chuyển hợp đồng sang trạng thái này',
      );
    const end = dto.ngayKetThuc ? parseDateOnly(dto.ngayKetThuc) : undefined;
    if (end && end < old.ngayBatDau)
      throw new ConflictException('Ngày kết thúc hợp đồng không hợp lệ');
    if (dto.trangThai && ACTIVE_HOP_DONG_STATUSES.includes(dto.trangThai))
      await this.ensureNoOtherActive(old.phongId, id);
    return this.prisma.$transaction(async (tx) =>
      this.transitionTx(tx, userId, old, dto, dto.trangThai),
    );
  }
  activate(userId: string, id: string) {
    return this.update(userId, id, {
      trangThai: TrangThaiHopDong.DANG_HIEU_LUC,
    });
  }
  finish(userId: string, id: string) {
    return this.update(userId, id, { trangThai: TrangThaiHopDong.DA_KET_THUC });
  }

  async listMembers(userId: string, hopDongId: string) {
    await this.get(userId, hopDongId);
    return this.prisma.thanhVienHopDong.findMany({
      where: { hopDongId },
      include: { caNhan: true },
      orderBy: { ngayBatDauO: 'asc' },
    });
  }
  async addMember(userId: string, hopDongId: string, dto: CreateThanhVienDto) {
    const hop = await this.get(userId, hopDongId, PERMISSIONS.HOP_DONG_SUA);
    const start = parseDateOnly(dto.ngayBatDauO),
      end = dto.ngayKetThucO ? parseDateOnly(dto.ngayKetThucO) : undefined;
    this.memberDates(hop.ngayBatDau, hop.ngayKetThuc, start, end);
    if (
      !(await this.prisma.caNhan.findFirst({
        where: { id: dto.caNhanId, deletedAt: null },
      }))
    )
      throw new NotFoundException('Không tìm thấy cá nhân');
    const duplicate = await this.prisma.thanhVienHopDong.findFirst({
      where: {
        hopDongId,
        caNhanId: dto.caNhanId,
        trangThai: 'HOAT_DONG',
        ngayBatDauO: { lte: end ?? new Date('9999-12-31') },
        OR: [{ ngayKetThucO: null }, { ngayKetThucO: { gte: start } }],
      },
    });
    if (duplicate)
      throw new ConflictException(
        'Cá nhân đã là thành viên hoạt động của hợp đồng',
      );
    await this.ensureCapacity(hopDongId, hop.soNguoiToiDa, start, end);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.thanhVienHopDong.create({
        data: {
          hopDongId,
          caNhanId: dto.caNhanId,
          vaiTro: dto.vaiTro,
          laDaiDien: dto.laDaiDien,
          ngayBatDauO: start,
          ngayKetThucO: end,
          ghiChu: dto.ghiChu,
        },
      });
      await this.auditTx(
        tx,
        userId,
        hop.khuTro.toChucId,
        hop.khuTroId,
        'THANH_VIEN_HOP_DONG_TAO',
        'THANH_VIEN_HOP_DONG',
        row.id,
        row,
      );
      return row;
    });
  }
  async updateMember(
    userId: string,
    hopDongId: string,
    id: string,
    dto: UpdateThanhVienDto,
  ) {
    const hop = await this.get(userId, hopDongId, PERMISSIONS.HOP_DONG_SUA);
    const old = await this.prisma.thanhVienHopDong.findFirst({
      where: { id, hopDongId },
    });
    if (!old) throw new NotFoundException('Không tìm thấy thành viên hợp đồng');
    const start = dto.ngayBatDauO
        ? parseDateOnly(dto.ngayBatDauO)
        : old.ngayBatDauO,
      end = dto.ngayKetThucO
        ? parseDateOnly(dto.ngayKetThucO)
        : (old.ngayKetThucO ?? undefined);
    this.memberDates(hop.ngayBatDau, hop.ngayKetThuc, start, end);
    const row = await this.prisma.thanhVienHopDong.update({
      where: { id },
      data: { ...dto, ngayBatDauO: start, ngayKetThucO: end },
    });
    await this.audit(
      userId,
      hop.khuTro.toChucId,
      hop.khuTroId,
      'THANH_VIEN_HOP_DONG_SUA',
      'THANH_VIEN_HOP_DONG',
      id,
      row,
      old,
    );
    return row;
  }
  async removeMember(userId: string, hopDongId: string, id: string) {
    const hop = await this.get(userId, hopDongId, PERMISSIONS.HOP_DONG_SUA);
    const old = await this.prisma.thanhVienHopDong.findFirst({
      where: { id, hopDongId, trangThai: 'HOAT_DONG' },
    });
    if (!old) throw new NotFoundException('Không tìm thấy thành viên hợp đồng');
    const row = await this.prisma.thanhVienHopDong.update({
      where: { id },
      data: {
        trangThai: 'NGUNG_HOAT_DONG',
        ngayKetThucO: old.ngayKetThucO ?? new Date(),
      },
    });
    await this.audit(
      userId,
      hop.khuTro.toChucId,
      hop.khuTroId,
      'THANH_VIEN_HOP_DONG_XOA',
      'THANH_VIEN_HOP_DONG',
      id,
      row,
      old,
    );
    return row;
  }

  async listDeposits(userId: string, hopDongId: string) {
    const hop = await this.get(userId, hopDongId);
    const transactions = await this.prisma.giaoDichTienCoc.findMany({
      where: { hopDongId },
      orderBy: [{ ngayGiaoDich: 'asc' }, { createdAt: 'asc' }],
    });
    return {
      transactions,
      summary: this.depositSummary(hop.tienCocThoaThuan, transactions),
    };
  }
  async addDeposit(
    userId: string,
    hopDongId: string,
    dto: CreateGiaoDichTienCocDto,
  ) {
    const hop = await this.get(userId, hopDongId, PERMISSIONS.HOP_DONG_SUA);
    const amount = BigInt(dto.soTien);
    if (amount <= 0n)
      throw new ConflictException('Số tiền giao dịch phải lớn hơn 0');
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.giaoDichTienCoc.create({
        data: {
          hopDongId,
          loaiGiaoDich: dto.loaiGiaoDich,
          soTien: amount,
          ngayGiaoDich: parseDateOnly(dto.ngayGiaoDich),
          phuongThuc: dto.phuongThuc,
          maGiaoDich: dto.maGiaoDich,
          noiDung: dto.noiDung,
          nguoiThucHienId: userId,
        },
      });
      await this.auditTx(
        tx,
        userId,
        hop.khuTro.toChucId,
        hop.khuTroId,
        'GIAO_DICH_TIEN_COC_TAO',
        'GIAO_DICH_TIEN_COC',
        row.id,
        row,
      );
      return row;
    });
  }

  async getCheckout(userId: string, hopDongId: string) {
    await this.get(userId, hopDongId);
    const row = await this.prisma.yeuCauTraPhong.findUnique({
      where: { hopDongId },
    });
    if (!row) throw new NotFoundException('Không tìm thấy yêu cầu trả phòng');
    return row;
  }
  async createCheckout(
    userId: string,
    hopDongId: string,
    dto: CreateYeuCauTraPhongDto,
  ) {
    const hop = await this.get(userId, hopDongId, PERMISSIONS.HOP_DONG_SUA);
    if (hop.trangThai !== TrangThaiHopDong.DANG_HIEU_LUC)
      throw new ConflictException(
        'Hợp đồng chưa ở trạng thái có thể yêu cầu trả phòng',
      );
    const notice = parseDateOnly(dto.ngayBao),
      checkout = parseDateOnly(dto.ngayDuKienTra);
    const days = daysBetween(notice, checkout);
    if (days < 0)
      throw new ConflictException('Ngày dự kiến trả phòng không hợp lệ');
    const late = days < hop.soNgayBaoTruoc;
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.yeuCauTraPhong.create({
        data: {
          hopDongId,
          ngayBao: notice,
          ngayDuKienTra: checkout,
          soNgayBaoTruocThucTe: days,
          coBaoTre: late,
          hinhThucXuLy: late ? hop.xuLyBaoTre : null,
          lyDo: dto.lyDo,
          nguoiTaoId: userId,
        },
      });
      await this.transitionTx(
        tx,
        userId,
        hop,
        {},
        TrangThaiHopDong.CHO_TRA_PHONG,
      );
      await this.auditTx(
        tx,
        userId,
        hop.khuTro.toChucId,
        hop.khuTroId,
        'YEU_CAU_TRA_PHONG_TAO',
        'YEU_CAU_TRA_PHONG',
        row.id,
        row,
      );
      return { ...row, xuLyDeXuat: late ? hop.xuLyBaoTre : null };
    });
  }
  async updateCheckout(
    userId: string,
    hopDongId: string,
    id: string,
    dto: UpdateYeuCauTraPhongDto,
  ) {
    const hop = await this.get(
      userId,
      hopDongId,
      PERMISSIONS.HOP_DONG_KET_THUC,
    );
    const old = await this.prisma.yeuCauTraPhong.findFirst({
      where: { id, hopDongId },
    });
    if (!old) throw new NotFoundException('Không tìm thấy yêu cầu trả phòng');
    if (dto.trangThai && !canTransitionTraPhong(old.trangThai, dto.trangThai))
      throw new ConflictException(
        'Không thể chuyển yêu cầu trả phòng sang trạng thái này',
      );
    const isOverride =
      dto.hinhThucXuLy !== undefined && dto.hinhThucXuLy !== old.hinhThucXuLy;
    if (isOverride)
      await this.authorize(userId, hop.khuTroId, PERMISSIONS.HOP_DONG_KET_THUC);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.yeuCauTraPhong.update({
        where: { id },
        data: {
          trangThai: dto.trangThai,
          hinhThucXuLy: dto.hinhThucXuLy,
          soTienKhauTruCoc:
            dto.soTienKhauTruCoc === undefined
              ? undefined
              : BigInt(dto.soTienKhauTruCoc),
          ngayTraThucTe: dto.ngayTraThucTe
            ? parseDateOnly(dto.ngayTraThucTe)
            : undefined,
          lyDo: dto.lyDo,
          nguoiXacNhanId: userId,
        },
      });
      if (row.trangThai === TrangThaiTraPhong.HOAN_TAT) {
        if (!canTransitionHopDong(hop.trangThai, TrangThaiHopDong.DA_KET_THUC))
          throw new ConflictException(
            'Không thể hoàn tất trả phòng ở trạng thái hợp đồng hiện tại',
          );
        await this.transitionTx(
          tx,
          userId,
          hop,
          {},
          TrangThaiHopDong.DA_KET_THUC,
        );
      }
      await this.auditTx(
        tx,
        userId,
        hop.khuTro.toChucId,
        hop.khuTroId,
        isOverride
          ? 'YEU_CAU_TRA_PHONG_GHI_DE_XU_LY_COC'
          : 'YEU_CAU_TRA_PHONG_SUA',
        'YEU_CAU_TRA_PHONG',
        id,
        row,
        old,
      );
      return row;
    });
  }

  private depositSummary(
    agreed: bigint,
    rows: { loaiGiaoDich: LoaiGiaoDichCoc; soTien: bigint }[],
  ) {
    let received = 0n,
      refunded = 0n,
      deducted = 0n,
      transferred = 0n,
      adjusted = 0n;
    for (const row of rows) {
      if (
        row.loaiGiaoDich === LoaiGiaoDichCoc.THU_COC ||
        row.loaiGiaoDich === LoaiGiaoDichCoc.BO_SUNG_COC
      )
        received += row.soTien;
      else if (row.loaiGiaoDich === LoaiGiaoDichCoc.HOAN_COC)
        refunded += row.soTien;
      else if (row.loaiGiaoDich === LoaiGiaoDichCoc.KHAU_TRU_COC)
        deducted += row.soTien;
      else if (row.loaiGiaoDich === LoaiGiaoDichCoc.CHUYEN_COC)
        transferred += row.soTien;
      else adjusted += row.soTien;
    }
    return {
      agreed,
      received,
      refunded,
      forfeitedOrDeducted: deducted,
      transferred,
      adjusted,
      remaining: received + adjusted - refunded - deducted - transferred,
    };
  }
  private async transitionTx(
    tx: Prisma.TransactionClient,
    userId: string,
    old: Awaited<ReturnType<HopDongService['get']>>,
    dto: UpdateHopDongDto,
    status?: TrangThaiHopDong,
  ) {
    const row = await tx.hopDong.update({
      where: { id: old.id },
      data: {
        ngayKy: dto.ngayKy ? parseDateOnly(dto.ngayKy) : undefined,
        ngayKetThuc: dto.ngayKetThuc
          ? parseDateOnly(dto.ngayKetThuc)
          : undefined,
        tienCocThoaThuan:
          dto.tienCocThoaThuan === undefined
            ? undefined
            : BigInt(dto.tienCocThoaThuan),
        ghiChu: dto.ghiChu,
        trangThai: status,
      },
    });
    const roomStatus =
      status === TrangThaiHopDong.CHO_NHAN_PHONG
        ? TrangThaiPhong.CHO_NHAN_PHONG
        : status === TrangThaiHopDong.DANG_HIEU_LUC
          ? TrangThaiPhong.DANG_O
          : status === TrangThaiHopDong.CHO_TRA_PHONG
            ? TrangThaiPhong.SAP_TRA
            : status === TrangThaiHopDong.DA_KET_THUC ||
                status === TrangThaiHopDong.DA_HUY
              ? TrangThaiPhong.DANG_TRONG
              : undefined;
    if (roomStatus && roomStatus !== old.phong.trangThai) {
      await tx.lichSuTrangThaiPhong.updateMany({
        where: { phongId: old.phongId, denThoiDiem: null },
        data: { denThoiDiem: new Date() },
      });
      await tx.phong.update({
        where: { id: old.phongId },
        data: { trangThai: roomStatus },
      });
      await tx.lichSuTrangThaiPhong.create({
        data: {
          phongId: old.phongId,
          trangThaiCu: old.phong.trangThai,
          trangThaiMoi: roomStatus,
          nguoiThucHienId: userId,
          lyDo: `Hợp đồng ${row.maHopDong}: ${status}`,
        },
      });
    }
    await this.auditTx(
      tx,
      userId,
      old.khuTro.toChucId,
      old.khuTroId,
      'HOP_DONG_CHUYEN_TRANG_THAI',
      'HOP_DONG',
      row.id,
      row,
      old,
    );
    return row;
  }
  private async ensureNoOtherActive(phongId: string, excludeId: string) {
    if (
      await this.prisma.hopDong.findFirst({
        where: {
          phongId,
          id: { not: excludeId },
          deletedAt: null,
          trangThai: { in: ACTIVE_HOP_DONG_STATUSES },
        },
      })
    )
      throw new ConflictException('Phòng đã có hợp đồng đang hoạt động');
  }
  private memberDates(
    contractStart: Date,
    contractEnd: Date | null,
    start: Date,
    end?: Date,
  ) {
    if (
      start < contractStart ||
      (end && end < start) ||
      (contractEnd && (!end || start > contractEnd || end > contractEnd))
    )
      throw new ConflictException('Ngày tham gia không hợp lệ');
  }
  private async ensureCapacity(
    hopDongId: string,
    max: number | null,
    start: Date,
    end?: Date,
  ) {
    if (!max) return;
    const count = await this.prisma.thanhVienHopDong.count({
      where: {
        hopDongId,
        trangThai: 'HOAT_DONG',
        ngayBatDauO: { lte: end ?? start },
        OR: [{ ngayKetThucO: null }, { ngayKetThucO: { gte: start } }],
      },
    });
    if (count + 1 > max)
      throw new ConflictException('Số người vượt quá giới hạn của phòng');
  }
  private async authorize(
    userId: string,
    khuTroId: string,
    permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS],
  ) {
    if (
      !(await this.permissions.hasPermissions(userId, 'KHU_TRO', khuTroId, [
        permission,
      ]))
    )
      throw new ForbiddenException('Bạn không có quyền truy cập hợp đồng này');
  }
  private async accessibleKhuTroIds(
    userId: string,
    permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS],
  ) {
    const memberships = await this.prisma.thanhVienKhuTro.findMany({
      where: {
        taiKhoanId: userId,
        trangThai: 'HOAT_DONG',
        khuTro: { deletedAt: null },
        vaiTro: { vaiTroQuyens: { some: { quyen: { maQuyen: permission } } } },
      },
      select: { khuTroId: true },
    });
    return memberships.map((row) => row.khuTroId);
  }
  private hopDongConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new ConflictException(
        'Phòng đã có hợp đồng đang hoạt động hoặc mã hợp đồng đã tồn tại',
      );
    throw error;
  }
  private endOfMonth(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
      .toISOString()
      .slice(0, 10);
  }
  private audit(
    userId: string,
    toChucId: string,
    khuTroId: string,
    action: string,
    type: string,
    id: string,
    after: object,
    before?: object,
  ) {
    return this.prisma.$transaction(async (tx) =>
      this.auditTx(
        tx,
        userId,
        toChucId,
        khuTroId,
        action,
        type,
        id,
        after,
        before,
      ),
    );
  }
  private auditTx(
    tx: Prisma.TransactionClient,
    userId: string,
    toChucId: string,
    khuTroId: string,
    action: string,
    type: string,
    id: string,
    after: object,
    before?: object,
  ) {
    return tx.nhatKyHeThong.create({
      data: {
        taiKhoanId: userId,
        toChucId,
        khuTroId,
        hanhDong: action,
        loaiDoiTuong: type,
        doiTuongId: id,
        duLieuSau: this.json(after),
        ...(before ? { duLieuTruoc: this.json(before) } : {}),
      },
    });
  }
  private json(value: object): Prisma.InputJsonValue {
    return JSON.parse(
      JSON.stringify(value, (_key, item: unknown) =>
        typeof item === 'bigint' ? item.toString() : item,
      ),
    ) as Prisma.InputJsonValue;
  }
}
