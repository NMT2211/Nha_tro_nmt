import { Transform, Type } from 'class-transformer';
import {
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
  TrangThaiChung,
  TrangThaiPhong,
} from '../../../generated/prisma/client';
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
export class CreatePhongDto {
  @IsOptional() @IsUUID('4') khoiNhaId?: string;
  @IsOptional() @IsUUID('4') tangId?: string;
  @Transform(trim) @IsString() @Length(1, 50) maPhong!: string;
  @Transform(trim) @IsString() @Length(1, 150) tenPhong!: string;
  @IsOptional() @Type(() => Number) @Min(0) @Max(100000) dienTich?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  soNguoiToiDa?: number;
  @IsOptional() @IsEnum(TrangThaiPhong) trangThai?: TrangThaiPhong;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 1000) ghiChu?: string;
}
export class UpdatePhongDto extends CreatePhongDto {
  @IsOptional() declare maPhong: string;
  @IsOptional() declare tenPhong: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(1, 500)
  lyDoThayDoiTrangThai?: string;
}
export class CreateChinhSachGiaPhongDto {
  @Matches(/^\d+$/) giaCoBan!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) soNguoiBaoGom?: number;
  @IsOptional() @Matches(/^\d+$/) giaThemMoiNguoi?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) soNguoiToiDa?: number;
  @IsDateString({ strict: true }) tuNgay!: string;
  @IsOptional() @IsDateString({ strict: true }) denNgay?: string;
  @IsOptional() @IsEnum(TrangThaiChung) trangThai?: TrangThaiChung;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 1000) ghiChu?: string;
}
export class UpdateChinhSachGiaPhongDto extends CreateChinhSachGiaPhongDto {}
