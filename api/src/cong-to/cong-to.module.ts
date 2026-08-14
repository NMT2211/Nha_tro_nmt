import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CongToController } from './cong-to.controller';
import { CongToService } from './cong-to.service';
@Module({
  imports: [AuthorizationModule],
  controllers: [CongToController],
  providers: [CongToService],
})
export class CongToModule {}
