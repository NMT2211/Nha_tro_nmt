import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client';
import { trangThaiTheoThanhToan } from '../common/domain/billing';
import { parseDateOnly } from '../common/domain/rental';
import type { CreatePhieuThuDto } from '../hoa-don/dto/hoa-don.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PhieuThuService {
  constructor(private readonly prisma: PrismaService) {}
  async create(userId: string, khuTroId: string, dto: CreatePhieuThuDto) {
    const khu = await this.prisma.khuTro.findFirst({
      where: { id: khuTroId, deletedAt: null },
    });
    if (!khu) throw new NotFoundException('Không tìm thấy khu trọ');
    const amount = BigInt(dto.soTien);
    if (amount <= 0n)
      throw new ConflictException('Số tiền phiếu thu phải lớn hơn 0');
    const allocations = dto.phanBos.map((p) => ({
      ...p,
      amount: BigInt(p.soTienPhanBo),
    }));
    if (
      !allocations.length ||
      allocations.some((p) => p.amount <= 0n) ||
      allocations.reduce((s, p) => s + p.amount, 0n) !== amount
    )
      throw new ConflictException('Tổng phân bổ phải bằng số tiền phiếu thu');
    if (new Set(allocations.map((p) => p.hoaDonId)).size !== allocations.length)
      throw new ConflictException('Hóa đơn bị phân bổ trùng');
    const invoices = await this.prisma.hoaDon.findMany({
      where: {
        id: { in: allocations.map((p) => p.hoaDonId) },
        khuTroId,
        trangThai: { not: 'DA_HUY' },
      },
    });
    if (invoices.length !== allocations.length)
      throw new ConflictException('Hóa đơn không thuộc khu trọ hoặc đã bị hủy');
    if (dto.caNhanNguoiNopId) {
      const relevant = await this.prisma.thanhVienHopDong.findFirst({
        where: {
          caNhanId: dto.caNhanNguoiNopId,
          hopDong: { khuTroId, deletedAt: null },
        },
      });
      if (!relevant)
        throw new ConflictException('Người nộp không thuộc khu trọ');
    }
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.phieuThu.create({
        data: {
          khuTroId,
          caNhanNguoiNopId: dto.caNhanNguoiNopId,
          maPhieuThu: this.code(),
          soTien: amount,
          phuongThuc: dto.phuongThuc,
          maGiaoDich: dto.maGiaoDich,
          ngayThanhToan: parseDateOnly(dto.ngayThanhToan),
          noiDung: dto.noiDung,
          nguoiTaoId: userId,
          phanBos: {
            create: allocations.map((p) => ({
              hoaDonId: p.hoaDonId,
              soTienPhanBo: p.amount,
            })),
          },
        },
        include: { phanBos: true },
      });
      await this.audit(
        tx,
        userId,
        khu.toChucId,
        khuTroId,
        'PHIEU_THU_TAO',
        row.id,
        row,
      );
      if (invoices.some((invoice) => invoice.trangThai === 'NHAP'))
        throw new ConflictException(
          'Không thể phân bổ thanh toán cho hóa đơn nháp',
        );
      return row;
    });
  }
  list(khuTroId: string) {
    return this.prisma.phieuThu.findMany({
      where: { khuTroId },
      include: { phanBos: true },
      orderBy: { createdAt: 'desc' },
    });
  }
  async get(id: string) {
    const row = await this.prisma.phieuThu.findUnique({
      where: { id },
      include: {
        phanBos: {
          include: {
            hoaDon: {
              select: {
                maHoaDon: true,
                tongTien: true,
                tienDaThanhToanCache: true,
                trangThai: true,
              },
            },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Không tìm thấy phiếu thu');
    return row;
  }
  async confirm(userId: string, id: string) {
    const receipt = await this.get(id);
    if (receipt.trangThai === 'THANH_CONG')
      throw new ConflictException('Phiếu thu đã được xác nhận');
    if (receipt.trangThai === 'DA_HUY')
      throw new ConflictException('Phiếu thu đã bị hủy');
    const ids = receipt.phanBos.map((p) => p.hoaDonId).sort();
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM hoa_don WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE`,
        );
        for (const allocation of receipt.phanBos) {
          const invoice = await tx.hoaDon.findUniqueOrThrow({
            where: { id: allocation.hoaDonId },
          });
          if (invoice.trangThai === 'DA_HUY')
            throw new ConflictException('Không thể phân bổ vào hóa đơn đã hủy');
          const paid = await this.effectivePaid(tx, invoice.id);
          if (allocation.soTienPhanBo > invoice.tongTien - paid)
            throw new ConflictException(
              'Số tiền phân bổ vượt quá số tiền còn phải thu',
            );
        }
        const row = await tx.phieuThu.update({
          where: { id },
          data: { trangThai: 'THANH_CONG' },
          include: { phanBos: true },
        });
        for (const hoaDonId of ids) await this.recompute(tx, hoaDonId);
        await this.audit(
          tx,
          userId,
          (
            await tx.khuTro.findUniqueOrThrow({
              where: { id: receipt.khuTroId },
            })
          ).toChucId,
          receipt.khuTroId,
          'PHIEU_THU_XAC_NHAN',
          id,
          row,
          receipt,
        );
        return row;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }
  async cancel(userId: string, id: string, reason: string) {
    const receipt = await this.get(id);
    if (receipt.trangThai === 'DA_HUY') return receipt;
    const ids = receipt.phanBos.map((p) => p.hoaDonId).sort();
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM hoa_don WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE`,
        );
        const row = await tx.phieuThu.update({
          where: { id },
          data: { trangThai: 'DA_HUY' },
          include: { phanBos: true },
        });
        for (const hoaDonId of ids) await this.recompute(tx, hoaDonId);
        await this.audit(
          tx,
          userId,
          (
            await tx.khuTro.findUniqueOrThrow({
              where: { id: receipt.khuTroId },
            })
          ).toChucId,
          receipt.khuTroId,
          'PHIEU_THU_HUY',
          id,
          { ...row, lyDo: reason },
          receipt,
        );
        return row;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }
  private async effectivePaid(tx: Prisma.TransactionClient, hoaDonId: string) {
    const result = await tx.phanBoThanhToan.aggregate({
      _sum: { soTienPhanBo: true },
      where: { hoaDonId, phieuThu: { trangThai: 'THANH_CONG' } },
    });
    return result._sum.soTienPhanBo ?? 0n;
  }
  private async recompute(tx: Prisma.TransactionClient, id: string) {
    const invoice = await tx.hoaDon.findUniqueOrThrow({ where: { id } }),
      paid = await this.effectivePaid(tx, id);
    if (paid > invoice.tongTien)
      throw new ConflictException(
        'Số tiền đã thanh toán vượt quá tổng hóa đơn',
      );
    const status =
      invoice.trangThai === 'DA_HUY'
        ? 'DA_HUY'
        : trangThaiTheoThanhToan({
            tongTien: invoice.tongTien,
            daThanhToan: paid,
            hanThanhToan: invoice.hanThanhToan,
          });
    return tx.hoaDon.update({
      where: { id },
      data: { tienDaThanhToanCache: paid, trangThai: status },
    });
  }
  private code() {
    return `PT-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(6).toString('hex').toUpperCase()}`;
  }
  private json(value: unknown) {
    return JSON.parse(
      JSON.stringify(value, (_k, v: unknown) =>
        typeof v === 'bigint' ? v.toString() : v,
      ),
    ) as Prisma.InputJsonValue;
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
        loaiDoiTuong: 'PHIEU_THU',
        doiTuongId: id,
        duLieuSau: this.json(after),
        ...(before ? { duLieuTruoc: this.json(before) } : {}),
      },
    });
  }
}
