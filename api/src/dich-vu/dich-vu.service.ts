import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  KieuTinhDichVu,
  LoaiDichVu,
  Prisma,
} from '../../generated/prisma/client';
import {
  multiplyDecimalMoney,
  tinhCoDinh,
  tinhTheoSoLuong,
} from '../common/domain/billing';
import { daysBetween, parseDateOnly } from '../common/domain/rental';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateChinhSachGiaDichVuDto,
  CreateDichVuDto,
  CreateDichVuHopDongDto,
  CreatePhatSinhDichVuDto,
  PreviewDichVuDto,
  UpdateChinhSachGiaDichVuDto,
  UpdateDichVuDto,
  UpdateDichVuHopDongDto,
} from './dto/dich-vu.dto';

@Injectable()
export class DichVuService {
  constructor(private readonly prisma: PrismaService) {}
  async create(uid: string, khuTroId: string, dto: CreateDichVuDto) {
    const khu = await this.khu(khuTroId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const row = await tx.dichVu.create({ data: { khuTroId, ...dto } });
        await this.audit(
          tx,
          uid,
          khu.toChucId,
          khuTroId,
          'DICH_VU_TAO',
          'DICH_VU',
          row.id,
          row,
        );
        return row;
      });
    } catch (e) {
      this.unique(e, 'Mã dịch vụ đã tồn tại');
    }
  }
  list(khuTroId: string) {
    return this.prisma.dichVu.findMany({
      where: { khuTroId, deletedAt: null },
      orderBy: { maDichVu: 'asc' },
    });
  }
  async get(id: string) {
    const row = await this.prisma.dichVu.findFirst({
      where: { id, deletedAt: null },
      include: { khuTro: { select: { toChucId: true } } },
    });
    if (!row) throw new NotFoundException('Không tìm thấy dịch vụ');
    return row;
  }
  async update(uid: string, id: string, dto: UpdateDichVuDto) {
    const old = await this.get(id);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const row = await tx.dichVu.update({ where: { id }, data: dto });
        await this.audit(
          tx,
          uid,
          old.khuTro.toChucId,
          old.khuTroId,
          'DICH_VU_SUA',
          'DICH_VU',
          id,
          row,
          old,
        );
        return row;
      });
    } catch (e) {
      this.unique(e, 'Mã dịch vụ đã tồn tại');
    }
  }
  async remove(uid: string, id: string) {
    const old = await this.get(id);
    const row = await this.prisma.$transaction(async (tx) => {
      const result = await tx.dichVu.update({
        where: { id },
        data: { deletedAt: new Date(), trangThai: 'NGUNG_HOAT_DONG' },
      });
      await this.audit(
        tx,
        uid,
        old.khuTro.toChucId,
        old.khuTroId,
        'DICH_VU_XOA',
        'DICH_VU',
        id,
        result,
        old,
      );
      return result;
    });
    return row;
  }
  async listGia(id: string) {
    await this.get(id);
    return this.prisma.chinhSachGiaDichVu.findMany({
      where: { dichVuId: id },
      orderBy: { tuNgay: 'desc' },
    });
  }
  async createGia(uid: string, id: string, dto: CreateChinhSachGiaDichVuDto) {
    const dv = await this.get(id);
    this.validateDates(dto.tuNgay, dto.denNgay);
    await this.noPriceOverlap(id, dto.tuNgay, dto.denNgay);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.chinhSachGiaDichVu.create({
        data: { dichVuId: id, ...this.priceData(dto) },
      });
      await this.audit(
        tx,
        uid,
        dv.khuTro.toChucId,
        dv.khuTroId,
        'CHINH_SACH_GIA_DICH_VU_TAO',
        'CHINH_SACH_GIA_DICH_VU',
        row.id,
        row,
      );
      return row;
    });
  }
  async updateGia(
    uid: string,
    dichVuId: string,
    id: string,
    dto: UpdateChinhSachGiaDichVuDto,
  ) {
    const dv = await this.get(dichVuId);
    const old = await this.prisma.chinhSachGiaDichVu.findFirst({
      where: { id, dichVuId },
    });
    if (!old)
      throw new NotFoundException('Không tìm thấy chính sách giá dịch vụ');
    if (this.samePrice(old, dto)) return old;
    this.validateDates(dto.tuNgay, dto.denNgay);
    await this.noPriceOverlap(dichVuId, dto.tuNgay, dto.denNgay, id);
    const start = parseDateOnly(dto.tuNgay),
      endOld = new Date(start);
    endOld.setUTCDate(endOld.getUTCDate() - 1);
    return this.prisma.$transaction(async (tx) => {
      await tx.chinhSachGiaDichVu.update({
        where: { id },
        data:
          old.tuNgay < start
            ? { denNgay: endOld }
            : { trangThai: 'NGUNG_HOAT_DONG' },
      });
      const row = await tx.chinhSachGiaDichVu.create({
        data: { dichVuId, ...this.priceData(dto) },
      });
      await this.audit(
        tx,
        uid,
        dv.khuTro.toChucId,
        dv.khuTroId,
        'CHINH_SACH_GIA_DICH_VU_TAO_PHIEN_BAN',
        'CHINH_SACH_GIA_DICH_VU',
        row.id,
        row,
        old,
      );
      return row;
    });
  }
  async listAssignments(hopDongId: string) {
    await this.hop(hopDongId);
    return this.prisma.dichVuHopDong.findMany({
      where: { hopDongId },
      include: { dichVu: true, chinhSachGia: true },
      orderBy: { tuNgay: 'asc' },
    });
  }
  async assign(uid: string, hopDongId: string, dto: CreateDichVuHopDongDto) {
    const hop = await this.hop(hopDongId),
      start = parseDateOnly(dto.tuNgay);
    this.validateDates(dto.tuNgay, dto.denNgay);
    const policy = await this.prisma.chinhSachGiaDichVu.findFirst({
      where: {
        id: dto.chinhSachGiaId,
        dichVuId: dto.dichVuId,
        dichVu: { khuTroId: hop.khuTroId, deletedAt: null },
        trangThai: 'HOAT_DONG',
        tuNgay: { lte: start },
        OR: [{ denNgay: null }, { denNgay: { gte: start } }],
      },
    });
    if (!policy)
      throw new ConflictException(
        'Dịch vụ hoặc chính sách giá không thuộc khu trọ của hợp đồng',
      );
    await this.noAssignmentOverlap(
      hopDongId,
      dto.dichVuId,
      dto.tuNgay,
      dto.denNgay,
    );
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.dichVuHopDong.create({
        data: {
          hopDongId,
          dichVuId: dto.dichVuId,
          chinhSachGiaId: dto.chinhSachGiaId,
          tuNgay: start,
          denNgay: dto.denNgay ? parseDateOnly(dto.denNgay) : undefined,
          soLuongMacDinh: dto.soLuongMacDinh
            ? new Prisma.Decimal(dto.soLuongMacDinh)
            : undefined,
          trangThai: dto.trangThai,
        },
      });
      await this.audit(
        tx,
        uid,
        hop.khuTro.toChucId,
        hop.khuTroId,
        'DICH_VU_HOP_DONG_TAO',
        'DICH_VU_HOP_DONG',
        row.id,
        row,
      );
      return row;
    });
  }
  async updateAssignment(
    uid: string,
    hopDongId: string,
    id: string,
    dto: UpdateDichVuHopDongDto,
  ) {
    const hop = await this.hop(hopDongId),
      old = await this.prisma.dichVuHopDong.findFirst({
        where: { id, hopDongId },
      });
    if (!old) throw new NotFoundException('Không tìm thấy dịch vụ hợp đồng');
    if (dto.denNgay)
      this.validateDates(old.tuNgay.toISOString().slice(0, 10), dto.denNgay);
    const row = await this.prisma.$transaction(async (tx) => {
      const r = await tx.dichVuHopDong.update({
        where: { id },
        data: {
          denNgay: dto.denNgay ? parseDateOnly(dto.denNgay) : undefined,
          soLuongMacDinh: dto.soLuongMacDinh
            ? new Prisma.Decimal(dto.soLuongMacDinh)
            : undefined,
          trangThai: dto.trangThai,
        },
      });
      await this.audit(
        tx,
        uid,
        hop.khuTro.toChucId,
        hop.khuTroId,
        'DICH_VU_HOP_DONG_SUA',
        'DICH_VU_HOP_DONG',
        id,
        r,
        old,
      );
      return r;
    });
    return row;
  }
  async removeAssignment(uid: string, hopDongId: string, id: string) {
    const hop = await this.hop(hopDongId),
      old = await this.prisma.dichVuHopDong.findFirst({
        where: { id, hopDongId },
      });
    if (!old) throw new NotFoundException('Không tìm thấy dịch vụ hợp đồng');
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.dichVuHopDong.update({
        where: { id },
        data: {
          trangThai: 'NGUNG_HOAT_DONG',
          denNgay: old.denNgay ?? new Date(),
        },
      });
      await this.audit(
        tx,
        uid,
        hop.khuTro.toChucId,
        hop.khuTroId,
        'DICH_VU_HOP_DONG_XOA',
        'DICH_VU_HOP_DONG',
        id,
        row,
        old,
      );
      return row;
    });
  }
  async listOccurrences(hopDongId: string) {
    await this.hop(hopDongId);
    return this.prisma.phatSinhDichVu.findMany({
      where: { hopDongId },
      include: { dichVu: true },
      orderBy: { ngayPhatSinh: 'desc' },
    });
  }
  async createOccurrence(
    uid: string,
    hopDongId: string,
    dto: CreatePhatSinhDichVuDto,
  ) {
    const hop = await this.hop(hopDongId),
      day = parseDateOnly(dto.ngayPhatSinh);
    const price = await this.prisma.chinhSachGiaDichVu.findFirst({
      where: {
        dichVuId: dto.dichVuId,
        dichVu: { khuTroId: hop.khuTroId, deletedAt: null },
        trangThai: 'HOAT_DONG',
        tuNgay: { lte: day },
        OR: [{ denNgay: null }, { denNgay: { gte: day } }],
      },
      orderBy: { tuNgay: 'desc' },
    });
    if (!price || price.kieuTinh === KieuTinhDichVu.NHAP_TAY)
      throw new ConflictException(
        'Không tìm thấy chính sách giá tự động phù hợp',
      );
    const amount = multiplyDecimalMoney(dto.soLuong, price.donGia);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.phatSinhDichVu.create({
        data: {
          hopDongId,
          dichVuId: dto.dichVuId,
          ngayPhatSinh: day,
          soLuong: new Prisma.Decimal(dto.soLuong),
          donGia: price.donGia,
          thanhTien: amount,
          noiDung: dto.noiDung,
        },
      });
      await this.audit(
        tx,
        uid,
        hop.khuTro.toChucId,
        hop.khuTroId,
        'PHAT_SINH_DICH_VU_TAO',
        'PHAT_SINH_DICH_VU',
        row.id,
        row,
      );
      return row;
    });
  }
  async preview(hopDongId: string, dto: PreviewDichVuDto) {
    const hop = await this.hop(hopDongId),
      start = parseDateOnly(dto.tuNgay),
      end = parseDateOnly(dto.denNgay);
    if (end < start)
      throw new ConflictException('Kỳ tính dịch vụ không hợp lệ');
    const assignments = await this.prisma.dichVuHopDong.findMany({
      where: {
        hopDongId,
        trangThai: 'HOAT_DONG',
        tuNgay: { lte: end },
        OR: [{ denNgay: null }, { denNgay: { gte: start } }],
      },
      include: { dichVu: true, chinhSachGia: true },
    });
    const results: Array<Record<string, unknown>> = [];
    for (const a of assignments) {
      const effectiveStart = a.tuNgay > start ? a.tuNgay : start,
        effectiveEnd = a.denNgay && a.denNgay < end ? a.denNgay : end;
      const config = (a.chinhSachGia.cauHinhBoSung ?? {}) as Record<
        string,
        unknown
      >;
      let quantity = a.soLuongMacDinh?.toString() ?? '1';
      let chiSoCongToIds: string[] = [];
      let calc;
      if (a.chinhSachGia.kieuTinh === KieuTinhDichVu.MIEN_PHI)
        calc = tinhCoDinh(0n);
      else if (a.chinhSachGia.kieuTinh === KieuTinhDichVu.THEO_NGUOI) {
        const members = await this.prisma.thanhVienHopDong.findMany({
          where: {
            hopDongId,
            trangThai: 'HOAT_DONG',
            ngayBatDauO: { lte: effectiveEnd },
            OR: [
              { ngayKetThucO: null },
              { ngayKetThucO: { gte: effectiveStart } },
            ],
          },
        });
        let personDays = 0;
        for (const m of members) {
          const s =
              m.ngayBatDauO > effectiveStart ? m.ngayBatDauO : effectiveStart,
            e =
              m.ngayKetThucO && m.ngayKetThucO < effectiveEnd
                ? m.ngayKetThucO
                : effectiveEnd;
          personDays += daysBetween(s, e) + 1;
        }
        quantity =
          config.prorate === false
            ? String(members.length)
            : (personDays / 30).toFixed(3);
        calc = tinhTheoSoLuong({
          soLuong: quantity,
          donGia: a.chinhSachGia.donGia,
          soLuongBaoGom: a.chinhSachGia.soLuongBaoGom,
          mucToiThieu: a.chinhSachGia.mucToiThieu,
          donGiaVuotMuc: a.chinhSachGia.donGiaVuotMuc,
        });
      } else if (a.chinhSachGia.kieuTinh === KieuTinhDichVu.CO_DINH_PHONG)
        calc =
          config.prorate === true
            ? tinhCoDinh(
                a.chinhSachGia.donGia,
                Math.min(30, daysBetween(effectiveStart, effectiveEnd) + 1),
              )
            : tinhCoDinh(a.chinhSachGia.donGia);
      else if (a.chinhSachGia.kieuTinh === KieuTinhDichVu.THEO_CHI_SO) {
        const type =
          a.dichVu.loaiDichVu === LoaiDichVu.DIEN
            ? 'DIEN'
            : a.dichVu.loaiDichVu === LoaiDichVu.NUOC
              ? 'NUOC'
              : null;
        if (!type)
          throw new ConflictException(
            'Dịch vụ theo chỉ số phải là điện hoặc nước',
          );
        const readings = await this.prisma.chiSoCongTo.findMany({
          where: {
            congTo: {
              khuTroId: hop.khuTroId,
              phongId: hop.phongId,
              loaiCongTo: type,
              deletedAt: null,
            },
            trangThai: { in: ['DA_CHOT', 'DA_DIEU_CHINH'] },
            tuNgay: { lte: end },
            denNgay: { gte: start },
          },
          orderBy: [{ tuNgay: 'asc' }, { id: 'asc' }],
        });
        chiSoCongToIds = readings.map((reading) => reading.id);
        quantity = readings
          .reduce(
            (sum, r) => sum.plus(r.sanLuongTieuThu),
            new Prisma.Decimal(0),
          )
          .toString();
        calc = tinhTheoSoLuong({
          soLuong: quantity,
          donGia: a.chinhSachGia.donGia,
          soLuongBaoGom: a.chinhSachGia.soLuongBaoGom,
          mucToiThieu: a.chinhSachGia.mucToiThieu,
          donGiaVuotMuc: a.chinhSachGia.donGiaVuotMuc,
        });
      } else
        calc = tinhTheoSoLuong({
          soLuong: quantity,
          donGia: a.chinhSachGia.donGia,
          soLuongBaoGom: a.chinhSachGia.soLuongBaoGom,
          mucToiThieu: a.chinhSachGia.mucToiThieu,
          donGiaVuotMuc: a.chinhSachGia.donGiaVuotMuc,
        });
      results.push({
        dichVuHopDongId: a.id,
        dichVuId: a.dichVuId,
        chinhSachGiaId: a.chinhSachGiaId,
        tenDichVu: a.dichVu.tenDichVu,
        loaiDichVu: a.dichVu.loaiDichVu,
        donVi: a.dichVu.donVi,
        kieuTinh: a.chinhSachGia.kieuTinh,
        chiSoCongToIds,
        ...calc,
      });
    }
    return {
      hopDongId,
      tuNgay: dto.tuNgay,
      denNgay: dto.denNgay,
      dichVus: results,
      tongTienDichVu: results
        .reduce((s, r) => s + BigInt(r.thanhTien as string), 0n)
        .toString(),
    };
  }
  private async khu(id: string) {
    const r = await this.prisma.khuTro.findFirst({
      where: { id, deletedAt: null },
      select: { toChucId: true },
    });
    if (!r) throw new NotFoundException('Không tìm thấy khu trọ');
    return r;
  }
  private async hop(id: string) {
    const r = await this.prisma.hopDong.findFirst({
      where: { id, deletedAt: null },
      include: { khuTro: { select: { toChucId: true } } },
    });
    if (!r) throw new NotFoundException('Không tìm thấy hợp đồng');
    return r;
  }
  private validateDates(a: string, b?: string) {
    if (b && parseDateOnly(b) < parseDateOnly(a))
      throw new ConflictException('Ngày kết thúc phải từ ngày bắt đầu trở đi');
  }
  private async noPriceOverlap(
    id: string,
    a: string,
    b?: string,
    exclude?: string,
  ) {
    if (
      await this.prisma.chinhSachGiaDichVu.findFirst({
        where: {
          dichVuId: id,
          trangThai: 'HOAT_DONG',
          ...(exclude ? { id: { not: exclude } } : {}),
          tuNgay: { lte: b ? parseDateOnly(b) : new Date('9999-12-31') },
          OR: [{ denNgay: null }, { denNgay: { gte: parseDateOnly(a) } }],
        },
      })
    )
      throw new ConflictException('Chính sách giá dịch vụ bị trùng thời gian');
  }
  private async noAssignmentOverlap(
    h: string,
    d: string,
    a: string,
    b?: string,
  ) {
    if (
      await this.prisma.dichVuHopDong.findFirst({
        where: {
          hopDongId: h,
          dichVuId: d,
          trangThai: 'HOAT_DONG',
          tuNgay: { lte: b ? parseDateOnly(b) : new Date('9999-12-31') },
          OR: [{ denNgay: null }, { denNgay: { gte: parseDateOnly(a) } }],
        },
      })
    )
      throw new ConflictException('Dịch vụ hợp đồng bị trùng thời gian');
  }
  private priceData(d: CreateChinhSachGiaDichVuDto) {
    return {
      kieuTinh: d.kieuTinh,
      donGia: BigInt(d.donGia),
      donGiaVuotMuc: d.donGiaVuotMuc ? BigInt(d.donGiaVuotMuc) : undefined,
      mucToiThieu: d.mucToiThieu
        ? new Prisma.Decimal(d.mucToiThieu)
        : undefined,
      soLuongBaoGom: d.soLuongBaoGom
        ? new Prisma.Decimal(d.soLuongBaoGom)
        : undefined,
      tuNgay: parseDateOnly(d.tuNgay),
      denNgay: d.denNgay ? parseDateOnly(d.denNgay) : undefined,
      trangThai: d.trangThai,
      cauHinhBoSung: d.cauHinhBoSung as Prisma.InputJsonValue | undefined,
    };
  }
  private samePrice(
    o: {
      kieuTinh: string;
      donGia: bigint;
      donGiaVuotMuc: bigint | null;
      mucToiThieu: Prisma.Decimal | null;
      soLuongBaoGom: Prisma.Decimal | null;
      tuNgay: Date;
      denNgay: Date | null;
      trangThai: string;
      cauHinhBoSung: unknown;
    },
    d: UpdateChinhSachGiaDichVuDto,
  ) {
    const day = (x: Date | string | null | undefined) =>
      x ? new Date(x).toISOString().slice(0, 10) : null;
    return (
      o.kieuTinh === d.kieuTinh &&
      o.donGia === BigInt(d.donGia) &&
      o.donGiaVuotMuc === (d.donGiaVuotMuc ? BigInt(d.donGiaVuotMuc) : null) &&
      o.mucToiThieu?.toString() === (d.mucToiThieu ?? undefined) &&
      o.soLuongBaoGom?.toString() === (d.soLuongBaoGom ?? undefined) &&
      day(o.tuNgay) === day(d.tuNgay) &&
      day(o.denNgay) === day(d.denNgay) &&
      o.trangThai === (d.trangThai ?? 'HOAT_DONG') &&
      JSON.stringify(o.cauHinhBoSung ?? null) ===
        JSON.stringify(d.cauHinhBoSung ?? null)
    );
  }
  private unique(e: unknown, msg: string): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      throw new ConflictException(msg);
    throw e;
  }
  private audit(
    tx: Prisma.TransactionClient,
    uid: string,
    tc: string,
    kt: string,
    action: string,
    type: string,
    id: string,
    after: object,
    before?: object,
  ) {
    const safe = (v: object) =>
      JSON.parse(
        JSON.stringify(v, (_k, x: unknown) =>
          typeof x === 'bigint' ? x.toString() : x,
        ),
      ) as Prisma.InputJsonValue;
    return tx.nhatKyHeThong.create({
      data: {
        taiKhoanId: uid,
        toChucId: tc,
        khuTroId: kt,
        hanhDong: action,
        loaiDoiTuong: type,
        doiTuongId: id,
        duLieuSau: safe(after),
        ...(before ? { duLieuTruoc: safe(before) } : {}),
      },
    });
  }
}
