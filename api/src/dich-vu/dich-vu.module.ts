import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DichVuController } from './dich-vu.controller';
import { DichVuService } from './dich-vu.service';
@Module({
  imports: [AuthorizationModule],
  controllers: [DichVuController],
  providers: [DichVuService],
  exports: [DichVuService],
})
export class DichVuModule {}
