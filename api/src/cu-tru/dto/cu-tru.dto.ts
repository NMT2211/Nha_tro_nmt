import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  Matches,
} from 'class-validator';
import {
  LoaiHoSoCuTru,
  TrangThaiHoSoCuTru,
} from '../../../generated/prisma/client';
const trim = Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || undefined : value,
);
export class PageDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}
export class CreateHoSoCuTruDto {
  @IsUUID('4') phongId!: string;
  @IsOptional() @IsUUID('4') hopDongId?: string;
  @IsUUID('4') caNhanId!: string;
  @IsEnum(LoaiHoSoCuTru) loaiHoSo!: LoaiHoSoCuTru;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) tuNgay!: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) denNgay?: string;
  @trim @IsOptional() @IsString() @Length(1, 1000) ghiChu?: string;
}
export class HoSoQueryDto extends PageDto {
  @IsOptional() @IsEnum(LoaiHoSoCuTru) loaiHoSo?: LoaiHoSoCuTru;
  @IsOptional() @IsEnum(TrangThaiHoSoCuTru) trangThai?: TrangThaiHoSoCuTru;
  @IsOptional() @IsUUID('4') phongId?: string;
  @IsOptional() @IsDateString({ strict: true }) from?: string;
  @IsOptional() @IsDateString({ strict: true }) to?: string;
}
export class UpdateHoSoCuTruDto {
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) tuNgay?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) denNgay?: string;
  @trim @IsOptional() @IsString() @Length(1, 1000) ghiChu?: string;
}
export class TransitionHoSoDto {
  @trim @IsOptional() @IsString() @Length(1, 1000) noiDung?: string;
}
export class CreateKhachLuuTruDto {
  @IsUUID('4') phongId!: string;
  @IsUUID('4') caNhanId!: string;
  @IsOptional() @IsUUID('4') nguoiDuocThamId?: string;
  @IsISO8601() thoiGianDen!: string;
  @IsOptional() @IsISO8601() thoiGianDiDuKien?: string;
  @trim @IsOptional() @IsString() @Length(1, 1000) lyDoLuuTru?: string;
  @IsOptional() @Matches(/^\d+$/) phuThuPhatSinh?: string;
}
export class KhachQueryDto extends PageDto {
  @IsOptional() @IsUUID('4') phongId?: string;
}
export class UpdateKhachLuuTruDto {
  @IsOptional() @IsISO8601() thoiGianDiDuKien?: string;
  @trim @IsOptional() @IsString() @Length(1, 1000) lyDoLuuTru?: string;
  @IsOptional() @Matches(/^\d+$/) phuThuPhatSinh?: string;
}
export class RoiDiDto {
  @IsISO8601() thoiGianDiThucTe!: string;
}
export class CreateTamVangDto {
  @IsUUID('4') caNhanId!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) tuNgay!: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) denNgayDuKien?: string;
  @trim @IsOptional() @IsString() @Length(1, 1000) lyDo?: string;
  @IsOptional() @IsBoolean() anhHuongTinhPhi?: boolean;
}
export class UpdateTamVangDto {
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) denNgayDuKien?: string;
  @trim @IsOptional() @IsString() @Length(1, 1000) lyDo?: string;
  @IsOptional() @IsBoolean() anhHuongTinhPhi?: boolean;
}
export class QuayLaiDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/) denNgayThucTe!: string;
}
