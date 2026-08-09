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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
