import { Module } from '@nestjs/common';
import { IdentityDataService } from './identity-data.service';
@Module({ providers: [IdentityDataService], exports: [IdentityDataService] })
export class IdentityDataModule {}
