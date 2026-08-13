import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CaNhanController } from './ca-nhan.controller';
import { CaNhanService } from './ca-nhan.service';

@Module({
  imports: [AuthorizationModule],
  controllers: [CaNhanController],
  providers: [CaNhanService],
})
export class CaNhanModule {}
