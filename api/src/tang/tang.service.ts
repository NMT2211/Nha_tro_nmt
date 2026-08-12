import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTangDto, UpdateTangDto } from './dto/tang.dto';
@Injectable()
export class TangService {
  constructor(private readonly prisma: PrismaService) {}
  async create(uid: string, khoiNhaId: string, dto: CreateTangDto) {
    const parent = await this.parent(khoiNhaId);
    try {
      const row = await this.prisma.tang.create({
        data: { khoiNhaId, ...dto },
      });
      await this.audit(
        uid,
        parent.khuTro.toChucId,
        parent.khuTroId,
        'TANG_TAO',
        row,
      );
      return row;
    } catch (e) {
      this.unique(e);
    }
  }
  async list(khoiNhaId: string) {
    await this.parent(khoiNhaId);
    return this.prisma.tang.findMany({
      where: { khoiNhaId, deletedAt: null },
      orderBy: [{ thuTu: 'asc' }, { soTang: 'asc' }],
    });
  }
  async get(id: string) {
    const row = await this.prisma.tang.findFirst({
      where: {
        id,
        deletedAt: null,
        khoiNha: { deletedAt: null, khuTro: { deletedAt: null } },
      },
      include: {
        khoiNha: {
          select: { khuTroId: true, khuTro: { select: { toChucId: true } } },
        },
      },
    });
    if (!row) throw new NotFoundException('Không tìm thấy tầng');
    return row;
  }
  async update(uid: string, id: string, dto: UpdateTangDto) {
    const before = await this.get(id);
    try {
      const row = await this.prisma.tang.update({ where: { id }, data: dto });
      await this.audit(
        uid,
        before.khoiNha.khuTro.toChucId,
        before.khoiNha.khuTroId,
        'TANG_SUA',
        row,
        before,
      );
      return row;
    } catch (e) {
      this.unique(e);
    }
  }
  async remove(uid: string, id: string) {
    const before = await this.get(id);
    if (
      await this.prisma.phong.count({ where: { tangId: id, deletedAt: null } })
    )
      throw new ConflictException('Không thể xóa tầng đang có phòng');
    const row = await this.prisma.tang.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.audit(
      uid,
      before.khoiNha.khuTro.toChucId,
      before.khoiNha.khuTroId,
      'TANG_XOA',
      row,
      before,
    );
    return row;
  }
  private async parent(id: string) {
    const r = await this.prisma.khoiNha.findFirst({
      where: { id, deletedAt: null, khuTro: { deletedAt: null } },
      select: { khuTroId: true, khuTro: { select: { toChucId: true } } },
    });
    if (!r) throw new NotFoundException('Không tìm thấy khối nhà');
    return r;
  }
  private unique(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      throw new ConflictException('Mã tầng đã tồn tại trong khối nhà');
    throw e;
  }
  private audit(
    uid: string,
    tc: string,
    kt: string,
    hd: string,
    a: object,
    b?: object,
  ) {
    return this.prisma.nhatKyHeThong.create({
      data: {
        taiKhoanId: uid,
        toChucId: tc,
        khuTroId: kt,
        hanhDong: hd,
        loaiDoiTuong: 'TANG',
        doiTuongId: (a as { id: string }).id,
        duLieuSau: JSON.parse(JSON.stringify(a)) as Prisma.InputJsonValue,
        ...(b
          ? {
              duLieuTruoc: JSON.parse(
                JSON.stringify(b),
              ) as Prisma.InputJsonValue,
            }
          : {}),
      },
    });
  }
}
