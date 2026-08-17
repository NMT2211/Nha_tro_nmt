import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { IdentityDataModule } from '../common/security/identity-data.module';
import { CuTruController } from './cu-tru.controller';
import { CuTruService } from './cu-tru.service';
@Module({
  imports: [AuthorizationModule, IdentityDataModule],
  controllers: [CuTruController],
  providers: [CuTruService],
})
export class CuTruModule {}
