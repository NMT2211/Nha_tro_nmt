import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { CaNhanService } from './ca-nhan.service';
import {
  CaNhanQueryDto,
  CreateCaNhanDto,
  CreateDiaChiDto,
  CreateGiayToDto,
  CreateLienHeKhanCapDto,
  UpdateCaNhanDto,
  UpdateDiaChiDto,
  UpdateGiayToDto,
  UpdateLienHeKhanCapDto,
} from './dto/ca-nhan.dto';

@Controller('ca-nhan')
@UseGuards(JwtAuthGuard)
export class CaNhanController {
  constructor(private readonly service: CaNhanService) {}

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body() dto: CreateCaNhanDto) {
    return this.service.create(u.sub, dto);
  }
  @Get()
  list(@CurrentUser() u: JwtPayload, @Query() query: CaNhanQueryDto) {
    return this.service.list(u.sub, query);
  }
  @Get(':id')
  get(
    @CurrentUser() u: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('khuTroId', new ParseUUIDPipe({ version: '4' })) khuTroId: string,
  ) {
    return this.service.get(u.sub, khuTroId, id);
  }
  @Patch(':id')
  update(
    @CurrentUser() u: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateCaNhanDto,
  ) {
    return this.service.update(u.sub, id, dto);
  }

  @Get(':caNhanId/giay-to')
  listGiayTo(
    @CurrentUser() u: JwtPayload,
    @Param('caNhanId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('khuTroId', new ParseUUIDPipe({ version: '4' })) khuTroId: string,
  ) {
    return this.service.listGiayTo(u.sub, khuTroId, id);
  }
  @Post(':caNhanId/giay-to')
  createGiayTo(
    @CurrentUser() u: JwtPayload,
    @Param('caNhanId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateGiayToDto,
  ) {
    return this.service.createGiayTo(u.sub, id, dto);
  }
  @Patch(':caNhanId/giay-to/:id')
  updateGiayTo(
    @CurrentUser() u: JwtPayload,
    @Param('caNhanId', new ParseUUIDPipe({ version: '4' })) caNhanId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateGiayToDto,
  ) {
    return this.service.updateGiayTo(u.sub, caNhanId, id, dto);
  }

  @Get(':caNhanId/dia-chi')
  listDiaChi(
    @CurrentUser() u: JwtPayload,
    @Param('caNhanId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('khuTroId', new ParseUUIDPipe({ version: '4' })) khuTroId: string,
  ) {
    return this.service.listDiaChi(u.sub, khuTroId, id);
  }
  @Post(':caNhanId/dia-chi')
  createDiaChi(
    @CurrentUser() u: JwtPayload,
    @Param('caNhanId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateDiaChiDto,
  ) {
    return this.service.createDiaChi(u.sub, id, dto);
  }
  @Patch(':caNhanId/dia-chi/:id')
  updateDiaChi(
    @CurrentUser() u: JwtPayload,
    @Param('caNhanId', new ParseUUIDPipe({ version: '4' })) caNhanId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateDiaChiDto,
  ) {
    return this.service.updateDiaChi(u.sub, caNhanId, id, dto);
  }

  @Get(':caNhanId/lien-he-khan-cap')
  listLienHe(
    @CurrentUser() u: JwtPayload,
    @Param('caNhanId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('khuTroId', new ParseUUIDPipe({ version: '4' })) khuTroId: string,
  ) {
    return this.service.listLienHe(u.sub, khuTroId, id);
  }
  @Post(':caNhanId/lien-he-khan-cap')
  createLienHe(
    @CurrentUser() u: JwtPayload,
    @Param('caNhanId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateLienHeKhanCapDto,
  ) {
    return this.service.createLienHe(u.sub, id, dto);
  }
  @Patch(':caNhanId/lien-he-khan-cap/:id')
  updateLienHe(
    @CurrentUser() u: JwtPayload,
    @Param('caNhanId', new ParseUUIDPipe({ version: '4' })) caNhanId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateLienHeKhanCapDto,
  ) {
    return this.service.updateLienHe(u.sub, caNhanId, id, dto);
  }
}
