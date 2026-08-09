import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditInput {
  taiKhoanId: string;
  toChucId: string;
  khuTroId?: string;
  hanhDong: string;
  loaiDoiTuong: string;
  doiTuongId?: string;
  duLieuTruoc?: Prisma.InputJsonValue;
  duLieuSau?: Prisma.InputJsonValue;
  lyDo?: string;
  diaChiIp?: string;
}
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  write(input: AuditInput) {
    return this.prisma.nhatKyHeThong.create({ data: input });
  }
}
