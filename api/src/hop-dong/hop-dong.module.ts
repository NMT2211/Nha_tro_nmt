import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { HopDongController } from './hop-dong.controller';
import { HopDongService } from './hop-dong.service';
@Module({
  imports: [AuthorizationModule],
  controllers: [HopDongController],
  providers: [HopDongService],
})
export class HopDongModule {}
