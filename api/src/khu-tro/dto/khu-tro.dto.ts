import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { QuyTacTinhNgayLe, XuLyBaoTre } from '../../../generated/prisma/client';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
export class CreateKhuTroDto {
  @IsUUID('4') toChucId!: string;
  @Transform(trim) @IsString() @Length(1, 150) tenKhu!: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(1, 30)
  soDienThoai?: string;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsEmail()
  email?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(1, 500)
  diaChiDayDu?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(1, 50)
  maTinhThanh?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(1, 50)
  maQuanHuyen?: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 50) maPhuongXa?: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 1000) ghiChu?: string;
}
export class UpdateKhuTroDto {
  @Transform(trim) @IsOptional() @IsString() @Length(1, 150) tenKhu?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(1, 30)
  soDienThoai?: string;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsEmail()
  email?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(1, 500)
  diaChiDayDu?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(1, 50)
  maTinhThanh?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(1, 50)
  maQuanHuyen?: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 50) maPhuongXa?: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 1000) ghiChu?: string;
}
export class AddThanhVienDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;
  @IsUUID('4') vaiTroId!: string;
}
export class UpdateThanhVienDto {
  @IsOptional() @IsUUID('4') vaiTroId?: string;
  @IsOptional() @IsBoolean() duocMoiThanhVien?: boolean;
}
export class UpdateCauHinhDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  ngayChotChiSoTu?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  ngayChotChiSoDen?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  ngayThuTien?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hanThanhToanSauNgay?: number;
  @IsOptional() @IsEnum(QuyTacTinhNgayLe) quyTacTinhNgayLe?: QuyTacTinhNgayLe;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) soNgayBaoTraPhong?: number;
  @IsOptional() @IsEnum(XuLyBaoTre) xuLyBaoTre?: XuLyBaoTre;
  @IsOptional() @IsBoolean() tienPhongTraTruoc?: boolean;
  @IsOptional() @IsBoolean() dienNuocTraSau?: boolean;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  soNgayKhachMienPhi?: number;
  @IsOptional() @IsBoolean() choPhepThanhToanMotPhan?: boolean;
  @IsOptional() @IsBoolean() giuLinkKhiSuaHoaDon?: boolean;
}
