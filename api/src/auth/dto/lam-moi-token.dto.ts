import { IsString, MinLength } from 'class-validator';
export class LamMoiTokenDto {
  @IsString() @MinLength(20) refreshToken!: string;
}
