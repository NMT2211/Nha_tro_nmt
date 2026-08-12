import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TrangThaiPhong } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateChinhSachGiaPhongDto,
  CreatePhongDto,
  UpdateChinhSachGiaPhongDto,
  UpdatePhongDto,
} from './dto/phong.dto';
@Injectable()
export class PhongService {
  constructor(private readonly prisma: PrismaService) {}
  async create(uid: string, khuTroId: string, dto: CreatePhongDto) {
    const khu = await this.khu(khuTroId);
    await this.parents(khuTroId, dto.khoiNhaId, dto.tangId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const row = await tx.phong.create({
          data: {
            khuTroId,
            ...dto,
            dienTich:
              dto.dienTich === undefined
                ? undefined
                : new Prisma.Decimal(dto.dienTich),
          },
        });
        await tx.lichSuTrangThaiPhong.create({
          data: {
            phongId: row.id,
            trangThaiMoi: row.trangThai,
            nguoiThucHienId: uid,
            lyDo: 'Khởi tạo phòng',
          },
        });
        await this.auditTx(
          tx,
          uid,
          khu.toChucId,
          khuTroId,
          'PHONG_TAO',
          'PHONG',
          row.id,
          row,
        );
        return row;
      });
    } catch (e) {
      this.unique(e);
    }
  }
  list(khuTroId: string) {
    return this.prisma.phong.findMany({
      where: { khuTroId, deletedAt: null, khuTro: { deletedAt: null } },
      include: {
        khoiNha: { select: { id: true, tenKhoi: true } },
        tang: { select: { id: true, tenTang: true } },
      },
      orderBy: { maPhong: 'asc' },
    });
  }
  async get(id: string) {
    const r = await this.prisma.phong.findFirst({
      where: { id, deletedAt: null, khuTro: { deletedAt: null } },
    });
    if (!r) throw new NotFoundException('Không tìm thấy phòng');
    return r;
  }
  async update(uid: string, id: string, dto: UpdatePhongDto) {
    const before = await this.get(id);
    await this.parents(before.khuTroId, dto.khoiNhaId, dto.tangId);
    const { lyDoThayDoiTrangThai, ...data } = dto;
    try {
      return await this.prisma.$transaction(async (tx) => {
        const row = await tx.phong.update({
          where: { id },
          data: {
            ...data,
            dienTich:
              data.dienTich === undefined
                ? undefined
                : new Prisma.Decimal(data.dienTich),
          },
        });
        if (data.trangThai && data.trangThai !== before.trangThai) {
          await tx.lichSuTrangThaiPhong.updateMany({
            where: { phongId: id, denThoiDiem: null },
            data: { denThoiDiem: new Date() },
          });
          await tx.lichSuTrangThaiPhong.create({
            data: {
              phongId: id,
              trangThaiCu: before.trangThai,
              trangThaiMoi: data.trangThai,
              nguoiThucHienId: uid,
              lyDo: lyDoThayDoiTrangThai,
            },
          });
        }
        const khu = await tx.khuTro.findUniqueOrThrow({
          where: { id: before.khuTroId },
        });
        await this.auditTx(
          tx,
          uid,
          khu.toChucId,
          before.khuTroId,
          'PHONG_SUA',
          'PHONG',
          id,
          row,
          before,
        );
        return row;
      });
    } catch (e) {
      this.unique(e);
    }
  }
  async remove(uid: string, id: string) {
    const before = await this.get(id);
    const count = await this.prisma.hopDong.count({ where: { phongId: id } });
    if (count)
      throw new ConflictException('Không thể xóa phòng đã có lịch sử hợp đồng');
    const khu = await this.khu(before.khuTroId);
    const row = await this.prisma.phong.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        trangThai: TrangThaiPhong.NGUNG_KINH_DOANH,
      },
    });
    await this.audit(
      uid,
      khu.toChucId,
      before.khuTroId,
      'PHONG_XOA',
      'PHONG',
      id,
      row,
      before,
    );
    return row;
  }
  async listGia(phongId: string) {
    await this.get(phongId);
    return this.prisma.chinhSachGiaPhong.findMany({
      where: { phongId },
      orderBy: { tuNgay: 'desc' },
    });
  }
  async createGia(
    uid: string,
    phongId: string,
    dto: CreateChinhSachGiaPhongDto,
  ) {
    const phong = await this.get(phongId);
    this.dates(dto.tuNgay, dto.denNgay);
    await this.noOverlap(phongId, dto.tuNgay, dto.denNgay);
    const data = this.giaData(dto);
    const row = await this.prisma.chinhSachGiaPhong.create({
      data: { phongId, ...data },
    });
    const khu = await this.khu(phong.khuTroId);
    await this.audit(
      uid,
      khu.toChucId,
      phong.khuTroId,
      'CHINH_SACH_GIA_PHONG_TAO',
      'CHINH_SACH_GIA_PHONG',
      row.id,
      row,
    );
    return row;
  }
  async updateGia(
    uid: string,
    phongId: string,
    id: string,
    dto: UpdateChinhSachGiaPhongDto,
  ) {
    const phong = await this.get(phongId);
    const old = await this.prisma.chinhSachGiaPhong.findFirst({
      where: { id, phongId },
    });
    if (!old)
      throw new NotFoundException('Không tìm thấy chính sách giá phòng');
    this.dates(dto.tuNgay, dto.denNgay);
    if (this.sameGia(old, dto)) return old;
    await this.noOverlap(phongId, dto.tuNgay, dto.denNgay, id);
    const start = new Date(dto.tuNgay);
    const previousEnd = new Date(start);
    previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
    const khu = await this.khu(phong.khuTroId);
    return this.prisma.$transaction(async (tx) => {
      if (old.tuNgay >= start)
        await tx.chinhSachGiaPhong.update({
          where: { id },
          data: { trangThai: 'NGUNG_HOAT_DONG' },
        });
      else
        await tx.chinhSachGiaPhong.update({
          where: { id },
          data: { denNgay: previousEnd },
        });
      const row = await tx.chinhSachGiaPhong.create({
        data: { phongId, ...this.giaData(dto) },
      });
      await this.auditTx(
        tx,
        uid,
        khu.toChucId,
        phong.khuTroId,
        'CHINH_SACH_GIA_PHONG_TAO_PHIÊN_BAN',
        'CHINH_SACH_GIA_PHONG',
        row.id,
        row,
        old,
      );
      return row;
    });
  }
  private giaData(d: CreateChinhSachGiaPhongDto) {
    return {
      giaCoBan: BigInt(d.giaCoBan),
      soNguoiBaoGom: d.soNguoiBaoGom,
      giaThemMoiNguoi:
        d.giaThemMoiNguoi === undefined ? undefined : BigInt(d.giaThemMoiNguoi),
      soNguoiToiDa: d.soNguoiToiDa,
      tuNgay: new Date(d.tuNgay),
      denNgay: d.denNgay ? new Date(d.denNgay) : undefined,
      trangThai: d.trangThai,
      ghiChu: d.ghiChu,
    };
  }
  private sameGia(
    current: {
      giaCoBan: bigint;
      soNguoiBaoGom: number;
      giaThemMoiNguoi: bigint;
      soNguoiToiDa: number | null;
      tuNgay: Date;
      denNgay: Date | null;
      trangThai: string;
      ghiChu: string | null;
    },
    dto: UpdateChinhSachGiaPhongDto,
  ): boolean {
    const day = (value: Date | string | null | undefined) =>
      value ? new Date(value).toISOString().slice(0, 10) : null;
    return (
      current.giaCoBan === BigInt(dto.giaCoBan) &&
      current.soNguoiBaoGom === (dto.soNguoiBaoGom ?? 1) &&
      current.giaThemMoiNguoi === BigInt(dto.giaThemMoiNguoi ?? '0') &&
      current.soNguoiToiDa === (dto.soNguoiToiDa ?? null) &&
      day(current.tuNgay) === day(dto.tuNgay) &&
      day(current.denNgay) === day(dto.denNgay) &&
      current.trangThai === (dto.trangThai ?? 'HOAT_DONG') &&
      current.ghiChu === (dto.ghiChu ?? null)
    );
  }
  private dates(a: string, b?: string) {
    if (b && new Date(a) > new Date(b))
      throw new ConflictException(
        'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc',
      );
  }
  private async noOverlap(
    pid: string,
    a: string,
    b?: string,
    exclude?: string,
  ) {
    const start = new Date(a),
      end = b ? new Date(b) : null;
    const overlap = await this.prisma.chinhSachGiaPhong.findFirst({
      where: {
        phongId: pid,
        trangThai: 'HOAT_DONG',
        ...(exclude ? { id: { not: exclude } } : {}),
        tuNgay: { lte: end ?? new Date('9999-12-31') },
        OR: [{ denNgay: null }, { denNgay: { gte: start } }],
      },
    });
    if (overlap)
      throw new ConflictException('Khoảng thời gian chính sách giá bị trùng');
  }
  private async parents(k: string, kn?: string, t?: string) {
    if (t && !kn)
      throw new ConflictException('Phải chọn khối nhà khi chọn tầng');
    if (!kn) return;
    const parent = await this.prisma.khoiNha.findFirst({
      where: { id: kn, khuTroId: k, deletedAt: null },
    });
    if (!parent)
      throw new ConflictException('Khối nhà không thuộc khu trọ đã chọn');
    if (
      t &&
      !(await this.prisma.tang.findFirst({
        where: { id: t, khoiNhaId: kn, deletedAt: null },
      }))
    )
      throw new ConflictException('Tầng không thuộc khối nhà đã chọn');
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
      throw new ConflictException('Mã phòng đã tồn tại');
    throw e;
  }
  private audit(
    uid: string,
    tc: string,
    kt: string,
    hd: string,
    type: string,
    id: string,
    a: object,
    b?: object,
  ) {
    return this.auditTx(this.prisma, uid, tc, kt, hd, type, id, a, b);
  }
  private auditTx(
    tx: Pick<PrismaService, 'nhatKyHeThong'>,
    uid: string,
    tc: string,
    kt: string,
    hd: string,
    type: string,
    id: string,
    a: object,
    b?: object,
  ) {
    const safe = (v: object): Prisma.InputJsonValue =>
      JSON.parse(
        JSON.stringify(v, (_k: string, x: unknown) =>
          typeof x === 'bigint' ? x.toString() : x,
        ),
      ) as Prisma.InputJsonValue;
    return tx.nhatKyHeThong.create({
      data: {
        taiKhoanId: uid,
        toChucId: tc,
        khuTroId: kt,
        hanhDong: hd,
        loaiDoiTuong: type,
        doiTuongId: id,
        duLieuSau: safe(a),
        ...(b ? { duLieuTruoc: safe(b) } : {}),
      },
    });
  }
}
