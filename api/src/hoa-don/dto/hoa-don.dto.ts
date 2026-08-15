import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  LoaiHoaDon,
  LoaiKhoanHoaDon,
  PhuongThucThanhToan,
} from '../../../generated/prisma/client';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const MONEY = /^\d+$/;

export class TinhHoaDonDto {
  @IsEnum(LoaiHoaDon) loaiHoaDon!: LoaiHoaDon;
  @Matches(DATE_ONLY) ngayBatDauKy!: string;
  @Matches(DATE_ONLY) ngayKetThucKy!: string;
  @IsOptional() @Matches(DATE_ONLY) ngayLap?: string;
  @IsOptional() @IsString() @MaxLength(1000) ghiChu?: string;
}

export class UpdateHoaDonDto {
  @IsOptional() @IsString() @MaxLength(1000) ghiChu?: string;
  @IsOptional() @IsString() @MaxLength(1000) lyDoThayDoi?: string;
}

export class DieuChinhHoaDonDto {
  @IsEnum(LoaiKhoanHoaDon) loaiKhoan!: LoaiKhoanHoaDon;
  @Matches(MONEY) soTien!: string;
  @IsString() @MaxLength(500) lyDo!: string;
}

export class HuyHoaDonDto {
  @IsString() @MaxLength(500) lyDo!: string;
}

export class PhanBoDto {
  @IsString() hoaDonId!: string;
  @Matches(MONEY) soTienPhanBo!: string;
}

export class CreatePhieuThuDto {
  @IsOptional() @IsString() caNhanNguoiNopId?: string;
  @Matches(MONEY) soTien!: string;
  @IsEnum(PhuongThucThanhToan) phuongThuc!: PhuongThucThanhToan;
  @IsOptional() @IsString() @MaxLength(200) maGiaoDich?: string;
  @Matches(DATE_ONLY) ngayThanhToan!: string;
  @IsOptional() @IsString() @MaxLength(1000) noiDung?: string;
  @ValidateNested({ each: true }) @Type(() => PhanBoDto) phanBos!: PhanBoDto[];
}

export class HuyPhieuThuDto {
  @IsString() @MaxLength(500) lyDo!: string;
}
