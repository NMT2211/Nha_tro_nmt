import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class DangKyDto {
  @Transform(trim) @IsString() @Length(2, 100) hoTen!: string;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/[\s.-]/g, '') : value,
  )
  @IsOptional()
  @Matches(/^(?:\+84|0)\d{9}$/)
  soDienThoai?: string;
  @IsString()
  @Length(10, 128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'matKhau phải có chữ hoa, chữ thường và chữ số',
  })
  matKhau!: string;
}
