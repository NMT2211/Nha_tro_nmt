import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { KhoiNhaController } from './khoi-nha.controller';
import { KhoiNhaService } from './khoi-nha.service';
@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [KhoiNhaController],
  providers: [KhoiNhaService],
})
export class KhoiNhaModule {}
