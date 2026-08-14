import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TrangThaiChiSo } from '../../generated/prisma/client';
import { tinhSanLuongCongTo } from '../common/domain/billing';
import { parseDateOnly } from '../common/domain/rental';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateChiSoCongToDto,
  CreateCongToDto,
  DieuChinhChiSoDto,
  UpdateCongToDto,
} from './dto/cong-to.dto';
@Injectable()
export class CongToService {
  constructor(private readonly prisma: PrismaService) {}
  async create(uid: string, khuTroId: string, dto: CreateCongToDto) {
    const khu = await this.khu(khuTroId);
    await this.room(khuTroId, dto.phongId);
    this.multiplier(dto.heSoNhan);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const row = await tx.congTo.create({
          data: {
            khuTroId,
            ...dto,
            heSoNhan: new Prisma.Decimal(dto.heSoNhan),
            ngayLapDat: dto.ngayLapDat
              ? parseDateOnly(dto.ngayLapDat)
              : undefined,
          },
        });
        await this.audit(
          tx,
          uid,
          khu.toChucId,
          khuTroId,
          'CONG_TO_TAO',
          'CONG_TO',
          row.id,
          row,
        );
        return row;
      });
    } catch (e) {
      this.unique(e);
    }
  }
  list(k: string) {
    return this.prisma.congTo.findMany({
      where: { khuTroId: k, deletedAt: null },
      include: { phong: { select: { id: true, tenPhong: true } } },
      orderBy: { maCongTo: 'asc' },
    });
  }
  async get(id: string) {
    const r = await this.prisma.congTo.findFirst({
      where: { id, deletedAt: null },
      include: { khuTro: { select: { toChucId: true } } },
    });
    if (!r) throw new NotFoundException('Không tìm thấy công tơ');
    return r;
  }
  async update(uid: string, id: string, dto: UpdateCongToDto) {
    const old = await this.get(id);
    await this.room(old.khuTroId, dto.phongId);
    if (dto.heSoNhan) this.multiplier(dto.heSoNhan);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const row = await tx.congTo.update({
          where: { id },
          data: {
            ...dto,
            heSoNhan: dto.heSoNhan
              ? new Prisma.Decimal(dto.heSoNhan)
              : undefined,
            ngayLapDat: dto.ngayLapDat
              ? parseDateOnly(dto.ngayLapDat)
              : undefined,
          },
        });
        await this.audit(
          tx,
          uid,
          old.khuTro.toChucId,
          old.khuTroId,
          'CONG_TO_SUA',
          'CONG_TO',
          id,
          row,
          old,
        );
        return row;
      });
    } catch (e) {
      this.unique(e);
    }
  }
  async remove(uid: string, id: string) {
    const old = await this.get(id);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.congTo.update({
        where: { id },
        data: { deletedAt: new Date(), trangThai: 'NGUNG_HOAT_DONG' },
      });
      await this.audit(
        tx,
        uid,
        old.khuTro.toChucId,
        old.khuTroId,
        'CONG_TO_XOA',
        'CONG_TO',
        id,
        row,
        old,
      );
      return row;
    });
  }
  async listReadings(id: string) {
    await this.get(id);
    return this.prisma.chiSoCongTo.findMany({
      where: { congToId: id },
      orderBy: [{ denNgay: 'desc' }, { createdAt: 'desc' }],
    });
  }
  async getReading(congToId: string, id: string) {
    await this.get(congToId);
    const r = await this.prisma.chiSoCongTo.findFirst({
      where: { id, congToId },
      include: { dieuChinhs: true },
    });
    if (!r) throw new NotFoundException('Không tìm thấy chỉ số công tơ');
    return r;
  }
  async createReading(
    uid: string,
    congToId: string,
    dto: CreateChiSoCongToDto,
  ) {
    const meter = await this.get(congToId),
      start = parseDateOnly(dto.tuNgay),
      end = parseDateOnly(dto.denNgay);
    if (end < start)
      throw new ConflictException(
        'Ngày kết thúc kỳ ghi phải từ ngày bắt đầu trở đi',
      );
    let consumption;
    try {
      consumption = tinhSanLuongCongTo(
        dto.chiSoCu,
        dto.chiSoMoi,
        meter.heSoNhan,
      );
    } catch {
      throw new ConflictException('Chỉ số mới không được nhỏ hơn chỉ số cũ');
    }
    const duplicate = await this.prisma.chiSoCongTo.findUnique({
      where: {
        congToId_tuNgay_denNgay: { congToId, tuNgay: start, denNgay: end },
      },
    });
    if (duplicate) throw new ConflictException('Kỳ ghi chỉ số đã tồn tại');
    const previous = await this.prisma.chiSoCongTo.findFirst({
      where: {
        congToId,
        trangThai: {
          in: [TrangThaiChiSo.DA_CHOT, TrangThaiChiSo.DA_DIEU_CHINH],
        },
        denNgay: { lt: start },
      },
      orderBy: { denNgay: 'desc' },
    });
    if (previous && !previous.chiSoMoi.equals(new Prisma.Decimal(dto.chiSoCu)))
      throw new ConflictException('Chỉ số đầu kỳ không khớp với kỳ trước');
    const config = await this.prisma.cauHinhKhuTro.findFirst({
      where: {
        khuTroId: meter.khuTroId,
        tuNgay: { lte: end },
        OR: [{ denNgay: null }, { denNgay: { gte: start } }],
      },
      orderBy: { tuNgay: 'desc' },
    });
    const recorded = new Date(dto.ngayGhi);
    const outside = config
      ? recorded.getUTCDate() < config.ngayChotChiSoTu ||
        recorded.getUTCDate() > config.ngayChotChiSoDen
      : false;
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.chiSoCongTo.create({
        data: {
          congToId,
          tuNgay: start,
          denNgay: end,
          chiSoCu: new Prisma.Decimal(dto.chiSoCu),
          chiSoMoi: new Prisma.Decimal(dto.chiSoMoi),
          sanLuongTieuThu: consumption,
          ngayGhi: recorded,
          nguonDuLieu: dto.nguonDuLieu,
          anhCongToId: dto.anhCongToId,
          nguoiGhiId: uid,
          trangThai: dto.trangThai,
        },
      });
      await this.audit(
        tx,
        uid,
        meter.khuTro.toChucId,
        meter.khuTroId,
        'CHI_SO_CONG_TO_GHI',
        'CHI_SO_CONG_TO',
        row.id,
        row,
      );
      return { ...row, canhBaoNgoaiKhungGhi: outside };
    });
  }
  async adjust(
    uid: string,
    congToId: string,
    id: string,
    dto: DieuChinhChiSoDto,
  ) {
    const meter = await this.get(congToId),
      old = await this.prisma.chiSoCongTo.findFirst({
        where: { id, congToId },
      });
    if (!old) throw new NotFoundException('Không tìm thấy chỉ số công tơ');
    let consumption;
    try {
      consumption = tinhSanLuongCongTo(
        dto.chiSoCu,
        dto.chiSoMoi,
        meter.heSoNhan,
      );
    } catch {
      throw new ConflictException('Chỉ số mới không được nhỏ hơn chỉ số cũ');
    }
    return this.prisma.$transaction(async (tx) => {
      const history = await tx.dieuChinhChiSo.create({
        data: {
          chiSoCongToId: id,
          chiSoCuTruoc: old.chiSoCu,
          chiSoMoiTruoc: old.chiSoMoi,
          chiSoCuSau: new Prisma.Decimal(dto.chiSoCu),
          chiSoMoiSau: new Prisma.Decimal(dto.chiSoMoi),
          lyDo: dto.lyDo,
          nguoiThucHienId: uid,
        },
      });
      const row = await tx.chiSoCongTo.update({
        where: { id },
        data: {
          chiSoCu: new Prisma.Decimal(dto.chiSoCu),
          chiSoMoi: new Prisma.Decimal(dto.chiSoMoi),
          sanLuongTieuThu: consumption,
          trangThai: TrangThaiChiSo.DA_DIEU_CHINH,
        },
      });
      await this.audit(
        tx,
        uid,
        meter.khuTro.toChucId,
        meter.khuTroId,
        'CHI_SO_CONG_TO_DIEU_CHINH',
        'CHI_SO_CONG_TO',
        id,
        row,
        old,
      );
      return { chiSoCongTo: row, dieuChinh: history };
    });
  }
  private multiplier(v: string) {
    if (new Prisma.Decimal(v).lessThanOrEqualTo(0))
      throw new ConflictException('Hệ số nhân phải lớn hơn 0');
  }
  private async room(k: string, id?: string) {
    if (
      id &&
      !(await this.prisma.phong.findFirst({
        where: { id, khuTroId: k, deletedAt: null },
      }))
    )
      throw new ConflictException('Phòng không thuộc khu trọ của công tơ');
  }
  private async khu(id: string) {
    const r = await this.prisma.khuTro.findFirst({
      where: { id, deletedAt: null },
      select: { toChucId: true },
    });
    if (!r) throw new NotFoundException('Không tìm thấy khu trọ');
    return r;
  }
  private unique(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      throw new ConflictException('Mã công tơ đã tồn tại');
    throw e;
  }
  private audit(
    tx: Prisma.TransactionClient,
    uid: string,
    tc: string,
    kt: string,
    a: string,
    t: string,
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
        hanhDong: a,
        loaiDoiTuong: t,
        doiTuongId: id,
        duLieuSau: safe(after),
        ...(before ? { duLieuTruoc: safe(before) } : {}),
      },
    });
  }
}
