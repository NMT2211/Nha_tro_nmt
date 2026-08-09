import { Module } from '@nestjs/common';
import { TaiKhoanController } from './tai-khoan.controller';
import { TaiKhoanService } from './tai-khoan.service';
@Module({
  controllers: [TaiKhoanController],
  providers: [TaiKhoanService],
  exports: [TaiKhoanService],
})
export class TaiKhoanModule {}
