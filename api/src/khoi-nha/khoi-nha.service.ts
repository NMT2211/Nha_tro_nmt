import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateKhoiNhaDto, UpdateKhoiNhaDto } from './dto/khoi-nha.dto';
@Injectable()
export class KhoiNhaService {
  constructor(private readonly prisma: PrismaService) {}
  async create(userId: string, khuTroId: string, dto: CreateKhoiNhaDto) {
    const khu = await this.khu(khuTroId);
    try {
      const row = await this.prisma.khoiNha.create({
        data: { khuTroId, ...dto },
      });
      await this.audit(
        userId,
        khu.toChucId,
        khuTroId,
        'KHOI_NHA_TAO',
        row.id,
        row,
      );
      return row;
    } catch (e) {
      this.unique(e, 'Mã khối nhà đã tồn tại');
    }
  }
  list(khuTroId: string) {
    return this.prisma.khoiNha.findMany({
      where: { khuTroId, deletedAt: null, khuTro: { deletedAt: null } },
      orderBy: [{ thuTu: 'asc' }, { maKhoi: 'asc' }],
    });
  }
  async get(id: string) {
    const row = await this.prisma.khoiNha.findFirst({
      where: { id, deletedAt: null, khuTro: { deletedAt: null } },
    });
    if (!row) throw new NotFoundException('Không tìm thấy khối nhà');
    return row;
  }
  async update(userId: string, id: string, dto: UpdateKhoiNhaDto) {
    const before = await this.get(id);
    try {
      const row = await this.prisma.khoiNha.update({
        where: { id },
        data: dto,
      });
      await this.audit(
        userId,
        (await this.khu(row.khuTroId)).toChucId,
        row.khuTroId,
        'KHOI_NHA_SUA',
        id,
        row,
        before,
      );
      return row;
    } catch (e) {
      this.unique(e, 'Mã khối nhà đã tồn tại');
    }
  }
  async remove(userId: string, id: string) {
    const before = await this.get(id);
    const count = await this.prisma.phong.count({
      where: { khoiNhaId: id, deletedAt: null },
    });
    if (count)
      throw new ConflictException('Không thể xóa khối nhà đang có phòng');
    const row = await this.prisma.khoiNha.update({
      where: { id },
      data: { deletedAt: new Date(), trangThai: 'NGUNG_HOAT_DONG' },
    });
    await this.audit(
      userId,
      (await this.khu(row.khuTroId)).toChucId,
      row.khuTroId,
      'KHOI_NHA_XOA',
      id,
      row,
      before,
    );
    return row;
  }
  private async khu(id: string) {
    const row = await this.prisma.khuTro.findFirst({
      where: { id, deletedAt: null },
      select: { toChucId: true },
    });
    if (!row) throw new NotFoundException('Không tìm thấy khu trọ');
    return row;
  }
  private unique(e: unknown, msg: string): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      throw new ConflictException(msg);
    throw e;
  }
  private audit(
    uid: string,
    tc: string,
    kt: string,
    hd: string,
    id: string,
    after: object,
    before?: object,
  ) {
    return this.prisma.nhatKyHeThong.create({
      data: {
        taiKhoanId: uid,
        toChucId: tc,
        khuTroId: kt,
        hanhDong: hd,
        loaiDoiTuong: 'KHOI_NHA',
        doiTuongId: id,
        duLieuSau: JSON.parse(JSON.stringify(after)) as Prisma.InputJsonValue,
        ...(before
          ? {
              duLieuTruoc: JSON.parse(
                JSON.stringify(before),
              ) as Prisma.InputJsonValue,
            }
          : {}),
      },
    });
  }
}
