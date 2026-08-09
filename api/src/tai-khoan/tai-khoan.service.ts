import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../../generated/prisma/client';

export const PUBLIC_ACCOUNT_SELECT = {
  id: true,
  hoTen: true,
  email: true,
  soDienThoai: true,
  avatarUrl: true,
  trangThai: true,
  lanDangNhapCuoi: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TaiKhoanSelect;

@Injectable()
export class TaiKhoanService {
  constructor(private readonly prisma: PrismaService) {}
  findById(id: string) {
    return this.prisma.taiKhoan.findFirst({
      where: { id, deletedAt: null },
      select: PUBLIC_ACCOUNT_SELECT,
    });
  }
  findByEmail(email: string) {
    return this.prisma.taiKhoan.findFirst({
      where: { email, deletedAt: null },
    });
  }
  create(data: {
    hoTen: string;
    email: string;
    soDienThoai?: string;
    matKhauHash: string;
  }) {
    return this.prisma.taiKhoan.create({ data, select: PUBLIC_ACCOUNT_SELECT });
  }
  updateLastLogin(id: string) {
    return this.prisma.taiKhoan.update({
      where: { id },
      data: { lanDangNhapCuoi: new Date() },
      select: PUBLIC_ACCOUNT_SELECT,
    });
  }
}
