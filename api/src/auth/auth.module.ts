import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TaiKhoanModule } from '../tai-khoan/tai-khoan.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PasswordService } from './password.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({}), TaiKhoanModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard, PasswordService],
})
export class AuthModule {}
