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
import type { JwtPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CuTruService } from './cu-tru.service';
import {
  CreateHoSoCuTruDto,
  CreateKhachLuuTruDto,
  CreateTamVangDto,
  HoSoQueryDto,
  KhachQueryDto,
  QuayLaiDto,
  RoiDiDto,
  TransitionHoSoDto,
  UpdateHoSoCuTruDto,
  UpdateKhachLuuTruDto,
  UpdateTamVangDto,
} from './dto/cu-tru.dto';
@Controller()
@UseGuards(JwtAuthGuard)
export class CuTruController {
  constructor(private readonly service: CuTruService) {}
  @Post('khu-tro/:khuTroId/ho-so-cu-tru') createHoSo(
    @CurrentUser() u: JwtPayload,
    @Param('khuTroId', new ParseUUIDPipe({ version: '4' })) k: string,
    @Body() d: CreateHoSoCuTruDto,
  ) {
    return this.service.createHoSo(u.sub, k, d);
  }
  @Get('khu-tro/:khuTroId/ho-so-cu-tru') listHoSo(
    @CurrentUser() u: JwtPayload,
    @Param('khuTroId', new ParseUUIDPipe({ version: '4' })) k: string,
    @Query() q: HoSoQueryDto,
  ) {
    return this.service.listHoSo(u.sub, k, q);
  }
  @Get('ho-so-cu-tru/:hoSoCuTruId') getHoSo(
    @CurrentUser() u: JwtPayload,
    @Param('hoSoCuTruId', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.getHoSo(u.sub, id);
  }
  @Patch('ho-so-cu-tru/:hoSoCuTruId') updateHoSo(
    @CurrentUser() u: JwtPayload,
    @Param('hoSoCuTruId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() d: UpdateHoSoCuTruDto,
  ) {
    return this.service.updateHoSo(u.sub, id, d);
  }
  @Get('ho-so-cu-tru/:hoSoCuTruId/lich-su') history(
    @CurrentUser() u: JwtPayload,
    @Param('hoSoCuTruId', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.history(u.sub, id);
  }
  @Get('ho-so-cu-tru/:hoSoCuTruId/ct01-data') ct01(
    @CurrentUser() u: JwtPayload,
    @Param('hoSoCuTruId', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.ct01(u.sub, id);
  }
  @Post('ho-so-cu-tru/:hoSoCuTruId/hoan-thien') complete(
    @CurrentUser() u: JwtPayload,
    @Param('hoSoCuTruId') id: string,
    @Body() d: TransitionHoSoDto,
  ) {
    return this.service.transition(u.sub, id, 'DA_TAO', 'HOAN_THIEN', d);
  }
  @Post('ho-so-cu-tru/:hoSoCuTruId/cho-gui') ready(
    @CurrentUser() u: JwtPayload,
    @Param('hoSoCuTruId') id: string,
    @Body() d: TransitionHoSoDto,
  ) {
    return this.service.transition(u.sub, id, 'CHO_GUI', 'CHO_GUI', d);
  }
  @Post('ho-so-cu-tru/:hoSoCuTruId/danh-dau-da-gui') sent(
    @CurrentUser() u: JwtPayload,
    @Param('hoSoCuTruId') id: string,
    @Body() d: TransitionHoSoDto,
  ) {
    return this.service.transition(u.sub, id, 'DA_GUI', 'DANH_DAU_DA_GUI', d);
  }
  @Post('ho-so-cu-tru/:hoSoCuTruId/tiep-nhan') received(
    @CurrentUser() u: JwtPayload,
    @Param('hoSoCuTruId') id: string,
    @Body() d: TransitionHoSoDto,
  ) {
    return this.service.transition(u.sub, id, 'DA_TIEP_NHAN', 'TIEP_NHAN', d);
  }
  @Post('ho-so-cu-tru/:hoSoCuTruId/duyet') approve(
    @CurrentUser() u: JwtPayload,
    @Param('hoSoCuTruId') id: string,
    @Body() d: TransitionHoSoDto,
  ) {
    return this.service.transition(u.sub, id, 'DA_DUYET', 'DUYET', d);
  }
  @Post('ho-so-cu-tru/:hoSoCuTruId/yeu-cau-bo-sung') supplement(
    @CurrentUser() u: JwtPayload,
    @Param('hoSoCuTruId') id: string,
    @Body() d: TransitionHoSoDto,
  ) {
    return this.service.transition(
      u.sub,
      id,
      'YEU_CAU_BO_SUNG',
      'YEU_CAU_BO_SUNG',
      d,
    );
  }
  @Post('ho-so-cu-tru/:hoSoCuTruId/tu-choi') reject(
    @CurrentUser() u: JwtPayload,
    @Param('hoSoCuTruId') id: string,
    @Body() d: TransitionHoSoDto,
  ) {
    return this.service.transition(u.sub, id, 'BI_TU_CHOI', 'TU_CHOI', d);
  }
  @Post('ho-so-cu-tru/:hoSoCuTruId/ket-thuc') finish(
    @CurrentUser() u: JwtPayload,
    @Param('hoSoCuTruId') id: string,
    @Body() d: TransitionHoSoDto,
  ) {
    return this.service.transition(u.sub, id, 'DA_KET_THUC', 'KET_THUC', d);
  }
  @Post('khu-tro/:khuTroId/khach-luu-tru') createGuest(
    @CurrentUser() u: JwtPayload,
    @Param('khuTroId') k: string,
    @Body() d: CreateKhachLuuTruDto,
  ) {
    return this.service.createKhach(u.sub, k, d);
  }
  @Get('khu-tro/:khuTroId/khach-luu-tru') guests(
    @CurrentUser() u: JwtPayload,
    @Param('khuTroId') k: string,
    @Query() q: KhachQueryDto,
  ) {
    return this.service.listKhach(u.sub, k, q);
  }
  @Get('khach-luu-tru/:khachLuuTruId') guest(
    @CurrentUser() u: JwtPayload,
    @Param('khachLuuTruId') id: string,
  ) {
    return this.service.getKhach(u.sub, id);
  }
  @Patch('khach-luu-tru/:khachLuuTruId') updateGuest(
    @CurrentUser() u: JwtPayload,
    @Param('khachLuuTruId') id: string,
    @Body() d: UpdateKhachLuuTruDto,
  ) {
    return this.service.updateKhach(u.sub, id, d);
  }
  @Post('khach-luu-tru/:khachLuuTruId/roi-di') depart(
    @CurrentUser() u: JwtPayload,
    @Param('khachLuuTruId') id: string,
    @Body() d: RoiDiDto,
  ) {
    return this.service.depart(u.sub, id, d);
  }
  @Post('khach-luu-tru/:khachLuuTruId/huy') cancelGuest(
    @CurrentUser() u: JwtPayload,
    @Param('khachLuuTruId') id: string,
  ) {
    return this.service.cancelKhach(u.sub, id);
  }
  @Post('hop-dong/:hopDongId/tam-vang') createAbsence(
    @CurrentUser() u: JwtPayload,
    @Param('hopDongId') id: string,
    @Body() d: CreateTamVangDto,
  ) {
    return this.service.createTamVang(u.sub, id, d);
  }
  @Get('hop-dong/:hopDongId/tam-vang') absences(
    @CurrentUser() u: JwtPayload,
    @Param('hopDongId') id: string,
  ) {
    return this.service.listTamVang(u.sub, id);
  }
  @Get('tam-vang/:tamVangId') absence(
    @CurrentUser() u: JwtPayload,
    @Param('tamVangId') id: string,
  ) {
    return this.service.getTamVang(u.sub, id);
  }
  @Patch('tam-vang/:tamVangId') updateAbsence(
    @CurrentUser() u: JwtPayload,
    @Param('tamVangId') id: string,
    @Body() d: UpdateTamVangDto,
  ) {
    return this.service.updateTamVang(u.sub, id, d);
  }
  @Post('tam-vang/:tamVangId/quay-lai') returned(
    @CurrentUser() u: JwtPayload,
    @Param('tamVangId') id: string,
    @Body() d: QuayLaiDto,
  ) {
    return this.service.returnTamVang(u.sub, id, d);
  }
  @Post('tam-vang/:tamVangId/huy') cancelAbsence(
    @CurrentUser() u: JwtPayload,
    @Param('tamVangId') id: string,
  ) {
    return this.service.cancelTamVang(u.sub, id);
  }
  @Get('khu-tro/:khuTroId/cu-tru/export') exportData(
    @CurrentUser() u: JwtPayload,
    @Param('khuTroId') k: string,
    @Query() q: HoSoQueryDto,
  ) {
    return this.service.exportData(u.sub, k, q);
  }
}
