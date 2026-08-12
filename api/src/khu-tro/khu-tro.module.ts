import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { KhuTroController } from './khu-tro.controller';
import { KhuTroService } from './khu-tro.service';
@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [KhuTroController],
  providers: [KhuTroService],
  exports: [KhuTroService],
})
export class KhuTroModule {}
