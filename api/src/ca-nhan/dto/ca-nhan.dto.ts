import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
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
  GioiTinh,
  LoaiDiaChi,
  LoaiGiayTo,
} from '../../../generated/prisma/client';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const optionalTrim = Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || undefined : value,
);
const PHONE = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;

export class CreateCaNhanDto {
  @IsUUID('4') khuTroId!: string;
  @Transform(trim) @IsString() @Length(1, 150) hoTen!: string;
  @IsOptional() @IsDateString({ strict: true }) ngaySinh?: string;
  @IsOptional() @IsEnum(GioiTinh) gioiTinh?: GioiTinh;
  @optionalTrim @IsOptional() @Matches(PHONE) soDienThoai?: string;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() || undefined : value,
  )
  @IsOptional()
  @IsEmail()
  email?: string;
  @optionalTrim @IsOptional() @IsString() @Length(1, 150) ngheNghiep?: string;
  @optionalTrim @IsOptional() @IsString() @Length(1, 250) noiLamViec?: string;
  @optionalTrim @IsOptional() @IsString() @Length(1, 1000) ghiChu?: string;
}

export class UpdateCaNhanDto extends CreateCaNhanDto {
  @IsOptional() declare khuTroId: string;
  @IsOptional() declare hoTen: string;
}

export class CaNhanQueryDto {
  @IsUUID('4') khuTroId!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
  @optionalTrim @IsOptional() @IsString() @Length(1, 100) search?: string;
}

export class CreateGiayToDto {
  @IsUUID('4') khuTroId!: string;
  @IsEnum(LoaiGiayTo) loaiGiayTo!: LoaiGiayTo;
  @Transform(trim) @IsString() @Length(4, 50) soGiayTo!: string;
  @IsOptional() @IsDateString({ strict: true }) ngayCap?: string;
  @optionalTrim @IsOptional() @IsString() @Length(1, 200) noiCap?: string;
  @IsOptional() @IsDateString({ strict: true }) ngayHetHan?: string;
  @IsOptional() @IsBoolean() laGiayToChinh?: boolean;
  @IsOptional() @IsUUID('4') anhMatTruocId?: string;
  @IsOptional() @IsUUID('4') anhMatSauId?: string;
}
export class UpdateGiayToDto extends CreateGiayToDto {
  @IsOptional() declare khuTroId: string;
  @IsOptional() declare loaiGiayTo: LoaiGiayTo;
  @IsOptional() declare soGiayTo: string;
}

export class CreateDiaChiDto {
  @IsUUID('4') khuTroId!: string;
  @IsEnum(LoaiDiaChi) loaiDiaChi!: LoaiDiaChi;
  @optionalTrim
  @IsOptional()
  @IsString()
  @Length(1, 300)
  diaChiChiTiet?: string;
  @optionalTrim @IsOptional() @IsString() @Length(1, 20) maTinhThanh?: string;
  @optionalTrim @IsOptional() @IsString() @Length(1, 100) tenTinhThanh?: string;
  @optionalTrim @IsOptional() @IsString() @Length(1, 20) maQuanHuyen?: string;
  @optionalTrim @IsOptional() @IsString() @Length(1, 100) tenQuanHuyen?: string;
  @optionalTrim @IsOptional() @IsString() @Length(1, 20) maPhuongXa?: string;
  @optionalTrim @IsOptional() @IsString() @Length(1, 100) tenPhuongXa?: string;
  @optionalTrim @IsOptional() @IsString() @Length(1, 500) diaChiDayDu?: string;
  @optionalTrim @IsOptional() @IsString() @Length(1, 500) diaChiCu?: string;
  @optionalTrim
  @IsOptional()
  @IsString()
  @Length(1, 500)
  diaChiChuyenDoi?: string;
  @IsOptional() @IsDateString({ strict: true }) tuNgay?: string;
  @IsOptional() @IsDateString({ strict: true }) denNgay?: string;
  @IsOptional() @IsBoolean() laHienTai?: boolean;
}
export class UpdateDiaChiDto extends CreateDiaChiDto {
  @IsOptional() declare khuTroId: string;
  @IsOptional() declare loaiDiaChi: LoaiDiaChi;
}

export class CreateLienHeKhanCapDto {
  @IsUUID('4') khuTroId!: string;
  @Transform(trim) @IsString() @Length(1, 150) hoTen!: string;
  @Transform(trim) @Matches(PHONE) soDienThoai!: string;
  @Transform(trim) @IsString() @Length(1, 100) moiQuanHe!: string;
  @optionalTrim @IsOptional() @IsString() @Length(1, 500) ghiChu?: string;
}
export class UpdateLienHeKhanCapDto extends CreateLienHeKhanCapDto {
  @IsOptional() declare khuTroId: string;
  @IsOptional() declare hoTen: string;
  @IsOptional() declare soDienThoai: string;
  @IsOptional() declare moiQuanHe: string;
}
