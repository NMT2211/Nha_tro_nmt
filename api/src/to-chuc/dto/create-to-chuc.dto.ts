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
export class CreateToChucDto {
  @Transform(trim) @IsString() @Length(2, 150) tenToChuc!: string;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/[\s.-]/g, '') : value,
  )
  @IsOptional()
  @Matches(/^(?:\+84|0)\d{9}$/)
  soDienThoai?: string;
}
