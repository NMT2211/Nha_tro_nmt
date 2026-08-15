import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DichVuModule } from '../dich-vu/dich-vu.module';
import { HoaDonController, PublicHoaDonController } from './hoa-don.controller';
import { HoaDonService } from './hoa-don.service';

@Module({
  imports: [AuthorizationModule, DichVuModule],
  controllers: [HoaDonController, PublicHoaDonController],
  providers: [HoaDonService],
  exports: [HoaDonService],
})
export class HoaDonModule {}
