import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import {
  LoaiHoaDon,
  LoaiKhoanHoaDon,
  Prisma,
  ThoiDiemTinh,
  TrangThaiHoaDon,
} from '../../generated/prisma/client';
import {
  tongTienHoaDon,
  trangThaiTheoThanhToan,
} from '../common/domain/billing';
import {
  inclusiveDays,
  parseDateOnly,
  prorate30Days,
} from '../common/domain/rental';
import { DichVuService } from '../dich-vu/dich-vu.service';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionService } from '../authorization/permission.service';
import { PERMISSIONS } from '../common/constants/permissions';
import type {
  DieuChinhHoaDonDto,
  TinhHoaDonDto,
  UpdateHoaDonDto,
} from './dto/hoa-don.dto';

type Line = {
  loaiKhoan: LoaiKhoanHoaDon;
  tenKhoan: string;
  thoiDiemTinh: ThoiDiemTinh;
  soLuong: string;
  donVi: string;
  donGia: bigint;
  thanhTien: bigint;
  tuNgay?: Date;
  denNgay?: Date;
  duLieuNguon: Prisma.InputJsonValue;
  thuTu: number;
};

@Injectable()
export class HoaDonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dichVu: DichVuService,
    private readonly permissions: PermissionService,
  ) {}

  async preview(hopDongId: string, dto: TinhHoaDonDto) {
    const start = parseDateOnly(dto.ngayBatDauKy),
      end = parseDateOnly(dto.ngayKetThucKy);
    if (end < start) throw new ConflictException('Kỳ hóa đơn không hợp lệ');
    const hop = await this.prisma.hopDong.findFirst({
      where: { id: hopDongId, deletedAt: null },
      include: {
        phong: { select: { maPhong: true, tenPhong: true } },
        thanhViens: true,
      },
    });
    if (!hop) throw new NotFoundException('Không tìm thấy hợp đồng');
    if (start < hop.ngayBatDau)
      throw new ConflictException(
        'Không được lập hóa đơn trước ngày bắt đầu hợp đồng',
      );
    if (
      hop.ngayKetThuc &&
      end > hop.ngayKetThuc &&
      dto.loaiHoaDon !== LoaiHoaDon.QUYET_TOAN_TRA_PHONG
    )
      throw new ConflictException('Kỳ hóa đơn vượt quá ngày kết thúc hợp đồng');
    const lines: Line[] = [];
    const eligibleStart = start > hop.ngayBatDau ? start : hop.ngayBatDau;
    const days = Math.min(30, inclusiveDays(eligibleStart, end));
    const rent =
      days === 30
        ? hop.giaThueThoaThuan
        : prorate30Days(hop.giaThueThoaThuan, days);
    if (rent > 0n)
      lines.push({
        loaiKhoan: LoaiKhoanHoaDon.TIEN_PHONG,
        tenKhoan: 'Tiền phòng',
        thoiDiemTinh: ThoiDiemTinh.TRA_TRUOC,
        soLuong: days === 30 ? '1' : `${days}/30`,
        donVi: 'tháng',
        donGia: hop.giaThueThoaThuan,
        thanhTien: rent,
        tuNgay: eligibleStart,
        denNgay: end,
        thuTu: 10,
        duLieuNguon: {
          hopDongId,
          giaThueThoaThuan: hop.giaThueThoaThuan.toString(),
          soNgayTinh: days,
          mauSoNgay: 30,
          quyTacTinhNgayLe: hop.quyTacTinhNgayLe,
        },
      });
    let extraPersonDays = 0;
    for (
      let cursor = new Date(eligibleStart);
      cursor <= end;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      const count = hop.thanhViens.filter(
        (m) =>
          m.ngayBatDauO <= cursor &&
          (!m.ngayKetThucO || m.ngayKetThucO >= cursor) &&
          m.trangThai === 'HOAT_DONG',
      ).length;
      extraPersonDays += Math.max(0, count - hop.soNguoiBaoGom);
    }
    const extra = prorate30Days(hop.giaThemMoiNguoi, extraPersonDays);
    if (extra > 0n)
      lines.push({
        loaiKhoan: LoaiKhoanHoaDon.PHU_THU_NGUOI,
        tenKhoan: 'Phụ thu người ở thêm',
        thoiDiemTinh: ThoiDiemTinh.TRA_TRUOC,
        soLuong: `${extraPersonDays}/30`,
        donVi: 'người-tháng',
        donGia: hop.giaThemMoiNguoi,
        thanhTien: extra,
        tuNgay: eligibleStart,
        denNgay: end,
        thuTu: 20,
        duLieuNguon: {
          hopDongId,
          soNguoiBaoGom: hop.soNguoiBaoGom,
          giaThemMoiNguoi: hop.giaThemMoiNguoi.toString(),
          tongNgayNguoiVuot: extraPersonDays,
          mauSoNgay: 30,
        },
      });
    const servicePreview = await this.dichVu.preview(hopDongId, {
      tuNgay: dto.ngayBatDauKy,
      denNgay: dto.ngayKetThucKy,
    });
    const consumedReadingIds = await this.consumedReadingIds();
    for (const raw of servicePreview.dichVus) {
      const amount = BigInt(raw.thanhTien as string);
      if (amount === 0n) continue;
      const readingIds = Array.isArray(raw.chiSoCongToIds)
        ? raw.chiSoCongToIds.filter(
            (id): id is string => typeof id === 'string',
          )
        : [];
      if (readingIds.some((id) => consumedReadingIds.has(id))) continue;
      const loai =
        raw.loaiDichVu === 'DIEN'
          ? LoaiKhoanHoaDon.TIEN_DIEN
          : raw.loaiDichVu === 'NUOC'
            ? LoaiKhoanHoaDon.TIEN_NUOC
            : LoaiKhoanHoaDon.DICH_VU;
      lines.push({
        loaiKhoan: loai,
        tenKhoan: String(raw.tenDichVu),
        thoiDiemTinh: ThoiDiemTinh.TRA_SAU,
        soLuong: String(raw.soLuong),
        donVi: typeof raw.donVi === 'string' ? raw.donVi : 'đơn vị',
        donGia: BigInt(raw.donGia as string),
        thanhTien: amount,
        tuNgay: start,
        denNgay: end,
        thuTu: 30 + lines.length,
        duLieuNguon: this.json({
          dichVuId: raw.dichVuId,
          dichVuHopDongId: raw.dichVuHopDongId,
          chinhSachGiaId: raw.chinhSachGiaId,
          kieuTinh: raw.kieuTinh,
          chiTiet: raw.chiTiet,
          chiSoCongToIds: readingIds,
        }),
      });
    }
    const occurrences = await this.prisma.phatSinhDichVu.findMany({
      where: {
        hopDongId,
        ngayPhatSinh: { gte: start, lte: end },
        NOT: { id: { in: await this.consumedOccurrenceIds() } },
      },
      include: { dichVu: true },
      orderBy: { ngayPhatSinh: 'asc' },
    });
    for (const item of occurrences)
      lines.push({
        loaiKhoan: LoaiKhoanHoaDon.PHAT_SINH,
        tenKhoan: item.noiDung ?? item.dichVu.tenDichVu,
        thoiDiemTinh: ThoiDiemTinh.TRA_SAU,
        soLuong: item.soLuong.toString(),
        donVi: item.dichVu.donVi,
        donGia: item.donGia,
        thanhTien: item.thanhTien,
        tuNgay: item.ngayPhatSinh,
        denNgay: item.ngayPhatSinh,
        thuTu: 100 + lines.length,
        duLieuNguon: { phatSinhDichVuId: item.id, dichVuId: item.dichVuId },
      });
    const total = tongTienHoaDon(lines);
    return {
      hopDong: { id: hop.id, maHopDong: hop.maHopDong, phong: hop.phong },
      period: { ngayBatDauKy: start, ngayKetThucKy: end },
      chiTiets: lines,
      tongTien: total,
      duLieuTinhToan: {
        mauSoNgay: 30,
        congNoTruocKy: (
          await this.outstandingBefore(hopDongId, start)
        ).toString(),
        serviceCalculation: 'DichVuService.preview',
        ...(dto.loaiHoaDon === LoaiHoaDon.QUYET_TOAN_TRA_PHONG
          ? { quyetToanTraPhong: await this.checkoutMetadata(hopDongId) }
          : {}),
      },
    };
  }

  async create(userId: string, hopDongId: string, dto: TinhHoaDonDto) {
    const preview = await this.preview(hopDongId, dto),
      start = parseDateOnly(dto.ngayBatDauKy),
      end = parseDateOnly(dto.ngayKetThucKy);
    const hop = await this.prisma.hopDong.findUniqueOrThrow({
      where: { id: hopDongId },
      include: { khuTro: true },
    });
    const ngayLap = dto.ngayLap
      ? parseDateOnly(dto.ngayLap)
      : new Date(
          Date.UTC(
            new Date().getUTCFullYear(),
            new Date().getUTCMonth(),
            new Date().getUTCDate(),
          ),
        );
    const config = await this.prisma.cauHinhKhuTro.findFirst({
      where: {
        khuTroId: hop.khuTroId,
        tuNgay: { lte: ngayLap },
        OR: [{ denNgay: null }, { denNgay: { gte: ngayLap } }],
      },
      orderBy: { tuNgay: 'desc' },
    });
    if (!config)
      throw new ConflictException('Không tìm thấy cấu hình khu trọ phù hợp');
    const due = new Date(ngayLap);
    due.setUTCDate(due.getUTCDate() + config.hanThanhToanSauNgay);
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const row = await tx.hoaDon.create({
            data: {
              khuTroId: hop.khuTroId,
              phongId: hop.phongId,
              hopDongId,
              maHoaDon: this.code('HD'),
              loaiHoaDon: dto.loaiHoaDon,
              kyHoaDon: `${dto.ngayBatDauKy}_${dto.ngayKetThucKy}`,
              ngayBatDauKy: start,
              ngayKetThucKy: end,
              ngayLap,
              hanThanhToan: due,
              tongTien: preview.tongTien,
              duLieuTinhToan: this.json(preview.duLieuTinhToan),
              ghiChu: dto.ghiChu,
              nguoiLapId: userId,
              chiTiets: {
                create: preview.chiTiets.map((l) => {
                  const raw = l.duLieuNguon as Record<string, unknown>;
                  const readingIds = Array.isArray(raw.chiSoCongToIds)
                    ? raw.chiSoCongToIds.filter(
                        (id): id is string => typeof id === 'string',
                      )
                    : [];
                  return {
                    ...l,
                    soLuong: new Prisma.Decimal(
                      l.soLuong.includes('/')
                        ? new Prisma.Decimal(l.soLuong.split('/')[0])
                            .div(30)
                            .toFixed(3)
                        : l.soLuong,
                    ),
                    ...(readingIds.length > 0
                      ? {
                          nguonChiSos: {
                            create: readingIds.map((chiSoCongToId) => ({
                              chiSoCongToId,
                            })),
                          },
                        }
                      : {}),
                  };
                }),
              },
            },
            include: { chiTiets: true },
          });
          await tx.phienBanHoaDon.create({
            data: {
              hoaDonId: row.id,
              soPhienBan: 1,
              duLieuHoaDon: this.snapshot(row),
              tongTien: row.tongTien,
              lyDoThayDoi: 'Tạo hóa đơn ban đầu',
              nguoiThucHienId: userId,
            },
          });
          await this.audit(
            tx,
            userId,
            hop.khuTro.toChucId,
            hop.khuTroId,
            'HOA_DON_TAO',
            row.id,
            row,
          );
          return row;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (e) {
      this.conflict(e);
    }
  }

  async list(hopDongId: string) {
    const rows = await this.prisma.hoaDon.findMany({
      where: { hopDongId },
      include: { chiTiets: true },
      orderBy: { ngayLap: 'desc' },
    });
    return rows.map((row) => ({
      ...row,
      trangThai: this.derivedStatus(row),
    }));
  }
  async get(id: string) {
    const row = await this.prisma.hoaDon.findUnique({
      where: { id },
      include: {
        chiTiets: { orderBy: { thuTu: 'asc' } },
        lienKetTraCuu: {
          select: { id: true, trangThai: true, hetHanLuc: true },
        },
      },
    });
    if (!row) throw new NotFoundException('Không tìm thấy hóa đơn');
    return { ...row, trangThai: this.derivedStatus(row) };
  }
  async versions(id: string) {
    await this.get(id);
    return this.prisma.phienBanHoaDon.findMany({
      where: { hoaDonId: id },
      orderBy: { soPhienBan: 'asc' },
    });
  }
  async update(userId: string, id: string, dto: UpdateHoaDonDto) {
    const old = await this.get(id);
    const permission =
      old.trangThai === TrangThaiHoaDon.NHAP
        ? PERMISSIONS.HOA_DON_SUA_BAN_NHAP
        : PERMISSIONS.HOA_DON_SUA_DA_PHAT_HANH;
    if (
      !(await this.permissions.hasPermissions(userId, 'KHU_TRO', old.khuTroId, [
        permission,
      ]))
    )
      throw new ForbiddenException('Bạn không có quyền sửa hóa đơn');
    if (old.trangThai !== TrangThaiHoaDon.NHAP && !dto.lyDoThayDoi)
      throw new ConflictException('Phải có lý do khi sửa hóa đơn đã phát hành');
    return this.prisma.$transaction(async (tx) => {
      const version =
        old.trangThai === TrangThaiHoaDon.NHAP
          ? old.phienBanHienTai
          : old.phienBanHienTai + 1;
      const row = await tx.hoaDon.update({
        where: { id },
        data: { ghiChu: dto.ghiChu, phienBanHienTai: version },
        include: { chiTiets: true },
      });
      if (version > old.phienBanHienTai)
        await tx.phienBanHoaDon.create({
          data: {
            hoaDonId: id,
            soPhienBan: version,
            duLieuHoaDon: this.snapshot(row),
            tongTien: row.tongTien,
            lyDoThayDoi: dto.lyDoThayDoi!,
            nguoiThucHienId: userId,
          },
        });
      await this.audit(
        tx,
        userId,
        (await tx.khuTro.findUniqueOrThrow({ where: { id: old.khuTroId } }))
          .toChucId,
        old.khuTroId,
        'HOA_DON_SUA',
        id,
        row,
        old,
      );
      return row;
    });
  }
  async adjust(userId: string, id: string, dto: DieuChinhHoaDonDto) {
    if (
      dto.loaiKhoan !== LoaiKhoanHoaDon.GIAM_TRU &&
      dto.loaiKhoan !== LoaiKhoanHoaDon.PHAT_SINH
    )
      throw new ConflictException('Loại điều chỉnh không hợp lệ');
    const old = await this.get(id),
      amount = BigInt(dto.soTien),
      signed = dto.loaiKhoan === LoaiKhoanHoaDon.GIAM_TRU ? -amount : amount;
    const newTotal = old.tongTien + signed;
    if (newTotal < 0n)
      throw new ConflictException('Giảm trừ vượt quá tổng hóa đơn');
    if (newTotal < old.tienDaThanhToanCache)
      throw new ConflictException(
        'Không thể giảm tổng hóa đơn thấp hơn số tiền đã thanh toán',
      );
    return this.prisma.$transaction(async (tx) => {
      await tx.chiTietHoaDon.create({
        data: {
          hoaDonId: id,
          loaiKhoan: dto.loaiKhoan,
          tenKhoan: dto.lyDo,
          thoiDiemTinh: ThoiDiemTinh.TRA_SAU,
          soLuong: new Prisma.Decimal(1),
          donVi: 'khoản',
          donGia: signed,
          thanhTien: signed,
          duLieuNguon: { loai: 'DIEU_CHINH_THU_CONG', lyDo: dto.lyDo },
          thuTu: 1000 + old.chiTiets.length,
        },
      });
      const version =
        old.trangThai === TrangThaiHoaDon.NHAP
          ? old.phienBanHienTai
          : old.phienBanHienTai + 1;
      const status =
        old.trangThai === TrangThaiHoaDon.NHAP
          ? old.trangThai
          : trangThaiTheoThanhToan({
              tongTien: newTotal,
              daThanhToan: old.tienDaThanhToanCache,
              hanThanhToan: old.hanThanhToan,
            });
      const row = await tx.hoaDon.update({
        where: { id },
        data: {
          tongTien: newTotal,
          phienBanHienTai: version,
          trangThai: status,
        },
        include: { chiTiets: true },
      });
      if (version > old.phienBanHienTai)
        await tx.phienBanHoaDon.create({
          data: {
            hoaDonId: id,
            soPhienBan: version,
            duLieuHoaDon: this.snapshot(row),
            tongTien: newTotal,
            lyDoThayDoi: dto.lyDo,
            nguoiThucHienId: userId,
          },
        });
      await this.audit(
        tx,
        userId,
        (await tx.khuTro.findUniqueOrThrow({ where: { id: old.khuTroId } }))
          .toChucId,
        old.khuTroId,
        'HOA_DON_DIEU_CHINH',
        id,
        row,
        old,
      );
      return row;
    });
  }
  async issue(userId: string, id: string) {
    const old = await this.get(id);
    if (old.trangThai !== TrangThaiHoaDon.NHAP) {
      const link = await this.prisma.lienKetTraCuu.findUnique({
        where: { hoaDonId: id },
      });
      return { hoaDon: old, lienKet: link ? { daTonTai: true } : null };
    }
    if (!old.chiTiets.length || old.tongTien < 0n)
      throw new ConflictException('Hóa đơn không hợp lệ để phát hành');
    const token = randomBytes(32).toString('base64url'),
      hash = this.hash(token);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.hoaDon.update({
        where: { id },
        data: {
          trangThai: trangThaiTheoThanhToan({
            tongTien: old.tongTien,
            daThanhToan: old.tienDaThanhToanCache,
            hanThanhToan: old.hanThanhToan,
          }),
        },
      });
      await tx.lienKetTraCuu.create({
        data: { hoaDonId: id, tokenHash: hash },
      });
      await this.audit(
        tx,
        userId,
        (await tx.khuTro.findUniqueOrThrow({ where: { id: old.khuTroId } }))
          .toChucId,
        old.khuTroId,
        'HOA_DON_PHAT_HANH',
        id,
        row,
        old,
      );
      return { hoaDon: row, publicToken: token };
    });
  }
  async cancel(userId: string, id: string, reason: string) {
    const old = await this.get(id);
    if (old.tienDaThanhToanCache > 0n)
      throw new ConflictException(
        'Hóa đơn đã có thanh toán và không thể hủy trực tiếp',
      );
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.hoaDon.update({
        where: { id },
        data: { trangThai: 'DA_HUY' },
      });
      await this.audit(
        tx,
        userId,
        (await tx.khuTro.findUniqueOrThrow({ where: { id: old.khuTroId } }))
          .toChucId,
        old.khuTroId,
        'HOA_DON_HUY',
        id,
        { ...row, lyDo: reason },
        old,
      );
      return row;
    });
  }
  async lockPublicLink(userId: string, id: string) {
    const invoice = await this.get(id);
    const link = await this.prisma.lienKetTraCuu.findUnique({
      where: { hoaDonId: id },
    });
    if (!link) throw new NotFoundException('Không tìm thấy liên kết hóa đơn');
    if (link.trangThai === 'DA_KHOA') return link;
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.lienKetTraCuu.update({
        where: { id: link.id },
        data: { trangThai: 'DA_KHOA' },
      });
      await this.audit(
        tx,
        userId,
        (await tx.khuTro.findUniqueOrThrow({ where: { id: invoice.khuTroId } }))
          .toChucId,
        invoice.khuTroId,
        'LIEN_KET_HOA_DON_KHOA',
        id,
        { lienKetId: row.id, trangThai: row.trangThai },
        { lienKetId: link.id, trangThai: link.trangThai },
      );
      return row;
    });
  }
  async debt(hopDongId: string) {
    const rows = await this.prisma.hoaDon.findMany({
      where: { hopDongId, trangThai: { not: 'DA_HUY' } },
      orderBy: { ngayLap: 'asc' },
    });
    const total = rows.reduce((s, r) => s + r.tongTien, 0n),
      paid = rows.reduce((s, r) => s + r.tienDaThanhToanCache, 0n);
    return {
      tongHoaDon: total,
      tongDaThanhToan: paid,
      tongConNo: total - paid,
      hoaDons: rows.map((r) => ({
        id: r.id,
        maHoaDon: r.maHoaDon,
        tongTien: r.tongTien,
        daThanhToan: r.tienDaThanhToanCache,
        conNo: r.tongTien - r.tienDaThanhToanCache,
        trangThai: this.derivedStatus(r),
      })),
    };
  }
  async publicLookup(token: string) {
    if (!/^[A-Za-z0-9_-]{40,100}$/.test(token))
      throw new NotFoundException(
        'Liên kết hóa đơn không hợp lệ hoặc đã hết hạn',
      );
    const now = new Date();
    const link = await this.prisma.lienKetTraCuu.findFirst({
      where: {
        tokenHash: this.hash(token),
        trangThai: 'HOAT_DONG',
        OR: [{ hetHanLuc: null }, { hetHanLuc: { gt: now } }],
      },
      include: {
        hoaDon: {
          include: {
            chiTiets: { orderBy: { thuTu: 'asc' } },
            khuTro: { select: { tenKhu: true, diaChiDayDu: true } },
            phong: { select: { maPhong: true, tenPhong: true } },
          },
        },
      },
    });
    if (!link)
      throw new NotFoundException(
        'Liên kết hóa đơn không hợp lệ hoặc đã hết hạn',
      );
    await this.prisma.lienKetTraCuu.update({
      where: { id: link.id },
      data: { soLanTruyCap: { increment: 1 }, lanTruyCapCuoi: now },
    });
    const h = link.hoaDon;
    return {
      khuTro: h.khuTro,
      phong: h.phong,
      maHoaDon: h.maHoaDon,
      loaiHoaDon: h.loaiHoaDon,
      kyHoaDon: h.kyHoaDon,
      ngayBatDauKy: h.ngayBatDauKy,
      ngayKetThucKy: h.ngayKetThucKy,
      hanThanhToan: h.hanThanhToan,
      chiTiets: h.chiTiets.map(
        ({
          loaiKhoan,
          tenKhoan,
          soLuong,
          donVi,
          donGia,
          thanhTien,
          tuNgay,
          denNgay,
        }) => ({
          loaiKhoan,
          tenKhoan,
          soLuong,
          donVi,
          donGia,
          thanhTien,
          tuNgay,
          denNgay,
        }),
      ),
      tongTien: h.tongTien,
      tienDaThanhToan: h.tienDaThanhToanCache,
      conLai: h.tongTien - h.tienDaThanhToanCache,
      trangThai: this.derivedStatus(h),
      phienBanHienTai: h.phienBanHienTai,
    };
  }

  private async consumedOccurrenceIds() {
    const rows = await this.prisma.chiTietHoaDon.findMany({
      where: { loaiKhoan: 'PHAT_SINH', duLieuNguon: { not: Prisma.JsonNull } },
      select: { duLieuNguon: true },
    });
    return rows
      .map((r) => (r.duLieuNguon as Record<string, unknown>)?.phatSinhDichVuId)
      .filter((v): v is string => typeof v === 'string');
  }
  private async consumedReadingIds() {
    const rows = await this.prisma.chiTietHoaDon.findMany({
      where: {
        loaiKhoan: { in: ['TIEN_DIEN', 'TIEN_NUOC'] },
        hoaDon: { trangThai: { not: 'DA_HUY' } },
        duLieuNguon: { not: Prisma.JsonNull },
      },
      select: { duLieuNguon: true },
    });
    return new Set(
      rows.flatMap((row) => {
        const value = (row.duLieuNguon as Record<string, unknown>)
          .chiSoCongToIds;
        return Array.isArray(value)
          ? value.filter((id): id is string => typeof id === 'string')
          : [];
      }),
    );
  }
  private async checkoutMetadata(hopDongId: string) {
    const checkout = await this.prisma.yeuCauTraPhong.findUnique({
      where: { hopDongId },
      select: { id: true, trangThai: true, soTienKhauTruCoc: true },
    });
    if (!checkout) return { coYeuCauTraPhong: false };
    const eligible = ['CHO_QUYET_TOAN', 'DA_HOAN_COC', 'HOAN_TAT'].includes(
      checkout.trangThai,
    );
    return {
      coYeuCauTraPhong: true,
      yeuCauTraPhongId: checkout.id,
      trangThai: checkout.trangThai,
      khauTruCocMetadataOnly: eligible,
      soTienKhauTruCoc: eligible ? checkout.soTienKhauTruCoc.toString() : '0',
      ghiChu:
        'Khoản khấu trừ cọc chỉ là metadata quyết toán; không tự động hoàn cọc hoặc tạo giao dịch tiền cọc.',
    };
  }
  private derivedStatus(invoice: {
    trangThai: TrangThaiHoaDon;
    tongTien: bigint;
    tienDaThanhToanCache: bigint;
    hanThanhToan: Date;
  }) {
    if (
      invoice.trangThai === TrangThaiHoaDon.NHAP ||
      invoice.trangThai === TrangThaiHoaDon.DA_HUY ||
      invoice.trangThai === TrangThaiHoaDon.DA_DIEU_CHINH
    )
      return invoice.trangThai;
    return trangThaiTheoThanhToan({
      tongTien: invoice.tongTien,
      daThanhToan: invoice.tienDaThanhToanCache,
      hanThanhToan: invoice.hanThanhToan,
    });
  }
  private async outstandingBefore(hopDongId: string, start: Date) {
    const rows = await this.prisma.hoaDon.findMany({
      where: {
        hopDongId,
        ngayKetThucKy: { lt: start },
        trangThai: { not: 'DA_HUY' },
      },
      select: { tongTien: true, tienDaThanhToanCache: true },
    });
    return rows.reduce((s, r) => s + r.tongTien - r.tienDaThanhToanCache, 0n);
  }
  private code(prefix: string) {
    return `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(6).toString('hex').toUpperCase()}`;
  }
  private hash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
  private json(value: unknown) {
    return JSON.parse(
      JSON.stringify(value, (_k, v: unknown) =>
        typeof v === 'bigint' ? v.toString() : v,
      ),
    ) as Prisma.InputJsonValue;
  }
  private snapshot(row: unknown) {
    return this.json(row);
  }
  private conflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    )
      throw new ConflictException(
        'Hóa đơn xung đột với một giao dịch tạo hóa đơn đồng thời',
      );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = JSON.stringify(error.meta?.target ?? '');
      if (
        target.includes('chi_so_cong_to_id') ||
        target.includes('uq_nguon_chi_so_hoa_don_chi_so_cong_to')
      )
        throw new ConflictException(
          'Chỉ số công tơ đã được tính trong hóa đơn khác',
        );
      throw new ConflictException('Hóa đơn đã tồn tại cho kỳ này');
    }
    throw error;
  }
  private audit(
    tx: Prisma.TransactionClient,
    userId: string,
    toChucId: string,
    khuTroId: string,
    action: string,
    id: string,
    after: unknown,
    before?: unknown,
  ) {
    return tx.nhatKyHeThong.create({
      data: {
        taiKhoanId: userId,
        toChucId,
        khuTroId,
        hanhDong: action,
        loaiDoiTuong: 'HOA_DON',
        doiTuongId: id,
        duLieuSau: this.json(after),
        ...(before ? { duLieuTruoc: this.json(before) } : {}),
      },
    });
  }
}
