import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import {
  LoaiCongTo,
  NguonChiSo,
  TrangThaiChiSo,
  TrangThaiChung,
} from '../../../generated/prisma/client';
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const DEC = /^\d+(\.\d{1,4})?$/;
export class CreateCongToDto {
  @IsOptional() @IsUUID('4') phongId?: string;
  @IsEnum(LoaiCongTo) loaiCongTo!: LoaiCongTo;
  @Transform(trim) @IsString() @Length(1, 100) maCongTo!: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 100) soSerial?: string;
  @Transform(trim) @IsString() @Length(1, 50) donVi!: string;
  @Matches(DEC) heSoNhan!: string;
  @IsOptional() @IsDateString({ strict: true }) ngayLapDat?: string;
  @IsOptional() @IsEnum(TrangThaiChung) trangThai?: TrangThaiChung;
}
export class UpdateCongToDto {
  @IsOptional() @IsUUID('4') phongId?: string;
  @IsOptional() @IsEnum(LoaiCongTo) loaiCongTo?: LoaiCongTo;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 100) maCongTo?: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 100) soSerial?: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 50) donVi?: string;
  @IsOptional() @Matches(DEC) heSoNhan?: string;
  @IsOptional() @IsDateString({ strict: true }) ngayLapDat?: string;
  @IsOptional() @IsEnum(TrangThaiChung) trangThai?: TrangThaiChung;
}
export class CreateChiSoCongToDto {
  @IsDateString({ strict: true }) tuNgay!: string;
  @IsDateString({ strict: true }) denNgay!: string;
  @Matches(/^\d+(\.\d{1,3})?$/) chiSoCu!: string;
  @Matches(/^\d+(\.\d{1,3})?$/) chiSoMoi!: string;
  @IsISO8601() ngayGhi!: string;
  @IsOptional() @IsEnum(NguonChiSo) nguonDuLieu?: NguonChiSo;
  @IsOptional() @IsUUID('4') anhCongToId?: string;
  @IsOptional() @IsEnum(TrangThaiChiSo) trangThai?: TrangThaiChiSo;
}
export class DieuChinhChiSoDto {
  @Matches(/^\d+(\.\d{1,3})?$/) chiSoCu!: string;
  @Matches(/^\d+(\.\d{1,3})?$/) chiSoMoi!: string;
  @Transform(trim) @IsString() @Length(1, 1000) lyDo!: string;
}
