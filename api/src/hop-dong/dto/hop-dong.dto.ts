import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  LoaiGiaoDichCoc,
  PhuongThucThanhToan,
  TrangThaiHopDong,
  TrangThaiTraPhong,
  VaiTroThanhVienHopDong,
  XuLyBaoTre,
} from '../../../generated/prisma/client';
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateHopDongDto {
  @IsUUID('4') phongId!: string;
  @Transform(trim) @IsString() @Length(1, 100) maHopDong!: string;
  @IsOptional() @IsDateString({ strict: true }) ngayKy?: string;
  @IsDateString({ strict: true }) ngayBatDau!: string;
  @IsOptional() @IsDateString({ strict: true }) ngayKetThuc?: string;
  @IsOptional() @Matches(/^\d+$/) tienCocThoaThuan?: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 1000) ghiChu?: string;
}
export class UpdateHopDongDto {
  @IsOptional() @IsDateString({ strict: true }) ngayKy?: string;
  @IsOptional() @IsDateString({ strict: true }) ngayKetThuc?: string;
  @IsOptional() @Matches(/^\d+$/) tienCocThoaThuan?: string;
  @IsOptional() @IsEnum(TrangThaiHopDong) trangThai?: TrangThaiHopDong;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 1000) ghiChu?: string;
}
export class HopDongQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
  @IsOptional() @IsUUID('4') khuTroId?: string;
  @IsOptional() @IsUUID('4') phongId?: string;
  @IsOptional() @IsEnum(TrangThaiHopDong) trangThai?: TrangThaiHopDong;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 100) search?: string;
}
export class CreateThanhVienDto {
  @IsUUID('4') caNhanId!: string;
  @IsEnum(VaiTroThanhVienHopDong) vaiTro!: VaiTroThanhVienHopDong;
  @IsOptional() @IsBoolean() laDaiDien?: boolean;
  @IsDateString({ strict: true }) ngayBatDauO!: string;
  @IsOptional() @IsDateString({ strict: true }) ngayKetThucO?: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 500) ghiChu?: string;
}
export class UpdateThanhVienDto {
  @IsOptional() @IsEnum(VaiTroThanhVienHopDong) vaiTro?: VaiTroThanhVienHopDong;
  @IsOptional() @IsBoolean() laDaiDien?: boolean;
  @IsOptional() @IsDateString({ strict: true }) ngayBatDauO?: string;
  @IsOptional() @IsDateString({ strict: true }) ngayKetThucO?: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 500) ghiChu?: string;
}
export class CreateGiaoDichTienCocDto {
  @IsEnum(LoaiGiaoDichCoc) loaiGiaoDich!: LoaiGiaoDichCoc;
  @Matches(/^\d+$/) soTien!: string;
  @IsDateString({ strict: true }) ngayGiaoDich!: string;
  @IsEnum(PhuongThucThanhToan) phuongThuc!: PhuongThucThanhToan;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(1, 100)
  maGiaoDich?: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 500) noiDung?: string;
}
export class CreateYeuCauTraPhongDto {
  @IsDateString({ strict: true }) ngayBao!: string;
  @IsDateString({ strict: true }) ngayDuKienTra!: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 1000) lyDo?: string;
}
export class UpdateYeuCauTraPhongDto {
  @IsOptional() @IsDateString({ strict: true }) ngayTraThucTe?: string;
  @IsOptional() @IsEnum(TrangThaiTraPhong) trangThai?: TrangThaiTraPhong;
  @IsOptional() @IsEnum(XuLyBaoTre) hinhThucXuLy?: XuLyBaoTre;
  @IsOptional() @Matches(/^\d+$/) soTienKhauTruCoc?: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 1000) lyDo?: string;
}
