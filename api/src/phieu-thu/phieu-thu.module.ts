import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PhieuThuController } from './phieu-thu.controller';
import { PhieuThuService } from './phieu-thu.service';
@Module({
  imports: [AuthorizationModule],
  controllers: [PhieuThuController],
  providers: [PhieuThuService],
})
export class PhieuThuModule {}
