import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { ToChucController } from './to-chuc.controller';
import { ToChucService } from './to-chuc.service';
@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [ToChucController],
  providers: [ToChucService],
})
export class ToChucModule {}
