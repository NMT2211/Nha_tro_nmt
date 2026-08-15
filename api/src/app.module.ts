import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { AuditModule } from './audit/audit.module';
import { environmentValidationSchema } from './config/environment';
import { PrismaModule } from './prisma/prisma.module';
import { TaiKhoanModule } from './tai-khoan/tai-khoan.module';
import { ToChucModule } from './to-chuc/to-chuc.module';
import { KhuTroModule } from './khu-tro/khu-tro.module';
import { KhoiNhaModule } from './khoi-nha/khoi-nha.module';
import { TangModule } from './tang/tang.module';
import { PhongModule } from './phong/phong.module';
import { CaNhanModule } from './ca-nhan/ca-nhan.module';
import { HopDongModule } from './hop-dong/hop-dong.module';
import { DichVuModule } from './dich-vu/dich-vu.module';
import { CongToModule } from './cong-to/cong-to.module';
import { HoaDonModule } from './hoa-don/hoa-don.module';
import { PhieuThuModule } from './phieu-thu/phieu-thu.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: environmentValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    PrismaModule,
    AuthModule,
    AuthorizationModule,
    AuditModule,
    TaiKhoanModule,
    ToChucModule,
    KhuTroModule,
    KhoiNhaModule,
    TangModule,
    PhongModule,
    CaNhanModule,
    HopDongModule,
    DichVuModule,
    CongToModule,
    HoaDonModule,
    PhieuThuModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
