import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TaiKhoanService } from '../tai-khoan/tai-khoan.service';
import type { JwtPayload, RequestMetadata } from './auth.types';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { DangKyDto } from './dto/dang-ky.dto';
import { DangNhapDto } from './dto/dang-nhap.dto';
import { LamMoiTokenDto } from './dto/lam-moi-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly accounts: TaiKhoanService,
  ) {}
  @Post('register') register(@Body() dto: DangKyDto) {
    return this.auth.register(dto);
  }
  @Post('login') login(
    @Body() dto: DangNhapDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.auth.login(dto, this.metadata(ip, userAgent));
  }
  @Post('refresh') refresh(
    @Body() dto: LamMoiTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.auth.refresh(dto.refreshToken, this.metadata(ip, userAgent));
  }
  @Post('logout') @UseGuards(JwtAuthGuard) logout(
    @CurrentUser() user: JwtPayload,
  ) {
    return this.auth.logout(user);
  }
  @Get('me') @UseGuards(JwtAuthGuard) async me(
    @CurrentUser() user: JwtPayload,
  ) {
    const account = await this.accounts.findById(user.sub);
    if (!account) throw new NotFoundException('Không tìm thấy tài khoản');
    return account;
  }
  private metadata(ip: string, userAgent?: string): RequestMetadata {
    return {
      diaChiIp: ip,
      ...(userAgent ? { userAgent: userAgent.slice(0, 500) } : {}),
    };
  }
}
