import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
export class CreateTangDto {
  @Transform(trim) @IsString() @Length(1, 50) maTang!: string;
  @Transform(trim) @IsString() @Length(1, 150) tenTang!: string;
  @Type(() => Number) @IsInt() @Min(-10) @Max(200) soTang!: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) thuTu?: number;
}
export class UpdateTangDto {
  @Transform(trim) @IsOptional() @IsString() @Length(1, 50) maTang?: string;
  @Transform(trim) @IsOptional() @IsString() @Length(1, 150) tenTang?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-10)
  @Max(200)
  soTang?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) thuTu?: number;
}
