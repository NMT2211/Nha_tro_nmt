import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import {
  KieuTinhDichVu,
  LoaiDichVu,
  TrangThaiChung,
} from '../../../generated/prisma/client';
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const DECIMAL = /^\d+(\.\d{1,3})?$/;
export class CreateDichVuDto {
  @Transform(trim) @IsString() @Length(1, 100) maDichVu!: string;
  @Transform(trim) @IsString() @Length(1, 200) tenDichVu!: string;
  @IsEnum(LoaiDichVu) loaiDichVu!: LoaiDichVu;
  @Transform(trim) @IsString() @Length(1, 50) donVi!: string;
  @IsOptional() @IsEnum(TrangThaiChung) trangThai?: TrangThaiChung;
}
export class UpdateDichVuDto {
  @Transform(trim) @IsOptional() @IsString() @Length(1, 100) maDichVu?: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 200) tenDichVu?: string;
  @IsOptional() @IsEnum(LoaiDichVu) loaiDichVu?: LoaiDichVu;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 50) donVi?: string;
  @IsOptional() @IsEnum(TrangThaiChung) trangThai?: TrangThaiChung;
}
export class CreateChinhSachGiaDichVuDto {
  @IsEnum(KieuTinhDichVu) kieuTinh!: KieuTinhDichVu;
  @Matches(/^\d+$/) donGia!: string;
  @IsOptional() @Matches(/^\d+$/) donGiaVuotMuc?: string;
  @IsOptional() @Matches(DECIMAL) mucToiThieu?: string;
  @IsOptional() @Matches(DECIMAL) soLuongBaoGom?: string;
  @IsDateString({ strict: true }) tuNgay!: string;
  @IsOptional() @IsDateString({ strict: true }) denNgay?: string;
  @IsOptional() @IsEnum(TrangThaiChung) trangThai?: TrangThaiChung;
  @IsOptional() @IsObject() cauHinhBoSung?: Record<string, unknown>;
}
export class UpdateChinhSachGiaDichVuDto extends CreateChinhSachGiaDichVuDto {}
export class CreateDichVuHopDongDto {
  @IsUUID('4') dichVuId!: string;
  @IsUUID('4') chinhSachGiaId!: string;
  @IsDateString({ strict: true }) tuNgay!: string;
  @IsOptional() @IsDateString({ strict: true }) denNgay?: string;
  @IsOptional() @Matches(DECIMAL) soLuongMacDinh?: string;
  @IsOptional() @IsEnum(TrangThaiChung) trangThai?: TrangThaiChung;
}
export class UpdateDichVuHopDongDto {
  @IsOptional() @IsDateString({ strict: true }) denNgay?: string;
  @IsOptional() @Matches(DECIMAL) soLuongMacDinh?: string;
  @IsOptional() @IsEnum(TrangThaiChung) trangThai?: TrangThaiChung;
}
export class CreatePhatSinhDichVuDto {
  @IsUUID('4') dichVuId!: string;
  @IsDateString({ strict: true }) ngayPhatSinh!: string;
  @Matches(DECIMAL) soLuong!: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 500) noiDung?: string;
}
export class PreviewDichVuDto {
  @IsDateString({ strict: true }) tuNgay!: string;
  @IsDateString({ strict: true }) denNgay!: string;
}
