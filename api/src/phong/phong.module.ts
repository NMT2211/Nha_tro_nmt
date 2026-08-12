import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PhongController } from './phong.controller';
import { PhongService } from './phong.service';
@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [PhongController],
  providers: [PhongService],
})
export class PhongModule {}
