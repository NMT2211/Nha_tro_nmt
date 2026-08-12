import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { TaiKhoanService } from './tai-khoan.service';

@Controller('tai-khoan')
@UseGuards(JwtAuthGuard)
export class TaiKhoanController {
  constructor(private readonly service: TaiKhoanService) {}
  @Get('me') async me(@CurrentUser() user: JwtPayload) {
    const account = await this.service.findById(user.sub);
    if (!account) throw new NotFoundException('Không tìm thấy tài khoản');
    return account;
  }
}
