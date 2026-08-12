import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { LoaiKhoiNha } from '../../../generated/prisma/client';
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
export class CreateKhoiNhaDto {
  @Transform(trim) @IsString() @Length(1, 50) maKhoi!: string;
  @Transform(trim) @IsString() @Length(1, 150) tenKhoi!: string;
  @IsEnum(LoaiKhoiNha) loaiKhoi!: LoaiKhoiNha;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) thuTu?: number;
}
export class UpdateKhoiNhaDto {
  @Transform(trim) @IsOptional() @IsString() @Length(1, 50) maKhoi?: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 150) tenKhoi?: string;
  @IsOptional() @IsEnum(LoaiKhoiNha) loaiKhoi?: LoaiKhoiNha;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) thuTu?: number;
}
