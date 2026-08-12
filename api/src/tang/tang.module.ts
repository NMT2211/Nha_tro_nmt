import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { TangController } from './tang.controller';
import { TangService } from './tang.service';
@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [TangController],
  providers: [TangService],
})
export class TangModule {}
