import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { PermissionGuard } from '../authorization/permission.guard';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { Scope } from '../authorization/scope.decorator';
import { PERMISSIONS } from '../common/constants/permissions';
import {
  CreateChinhSachGiaDichVuDto,
  CreateDichVuDto,
  CreateDichVuHopDongDto,
  CreatePhatSinhDichVuDto,
  PreviewDichVuDto,
  UpdateChinhSachGiaDichVuDto,
  UpdateDichVuDto,
  UpdateDichVuHopDongDto,
} from './dto/dich-vu.dto';
import { DichVuService } from './dich-vu.service';
const uuid = new ParseUUIDPipe({ version: '4' });
@Controller()
@UseGuards(JwtAuthGuard)
@Scope('KHU_TRO')
export class DichVuController {
  constructor(private readonly service: DichVuService) {}
  @Post('khu-tro/:khuTroId/dich-vu')
  @RequirePermissions(PERMISSIONS.DICH_VU_TAO)
  @UseGuards(PermissionGuard)
  create(
    @CurrentUser() u: JwtPayload,
    @Param('khuTroId', uuid) k: string,
    @Body() d: CreateDichVuDto,
  ) {
    return this.service.create(u.sub, k, d);
  }
  @Get('khu-tro/:khuTroId/dich-vu')
  @RequirePermissions(PERMISSIONS.DICH_VU_XEM)
  @UseGuards(PermissionGuard)
  list(@Param('khuTroId', uuid) k: string) {
    return this.service.list(k);
  }
  @Get('dich-vu/:id')
  @RequirePermissions(PERMISSIONS.DICH_VU_XEM)
  @UseGuards(PermissionGuard)
  get(@Param('id', uuid) id: string) {
    return this.service.get(id);
  }
  @Patch('dich-vu/:id')
  @RequirePermissions(PERMISSIONS.DICH_VU_SUA)
  @UseGuards(PermissionGuard)
  update(
    @CurrentUser() u: JwtPayload,
    @Param('id', uuid) id: string,
    @Body() d: UpdateDichVuDto,
  ) {
    return this.service.update(u.sub, id, d);
  }
  @Delete('dich-vu/:id')
  @RequirePermissions(PERMISSIONS.DICH_VU_XOA)
  @UseGuards(PermissionGuard)
  remove(@CurrentUser() u: JwtPayload, @Param('id', uuid) id: string) {
    return this.service.remove(u.sub, id);
  }
  @Get('dich-vu/:dichVuId/chinh-sach-gia')
  @RequirePermissions(PERMISSIONS.DICH_VU_XEM)
  @UseGuards(PermissionGuard)
  listGia(@Param('dichVuId', uuid) id: string) {
    return this.service.listGia(id);
  }
  @Post('dich-vu/:dichVuId/chinh-sach-gia')
  @RequirePermissions(PERMISSIONS.DICH_VU_SUA)
  @UseGuards(PermissionGuard)
  createGia(
    @CurrentUser() u: JwtPayload,
    @Param('dichVuId', uuid) id: string,
    @Body() d: CreateChinhSachGiaDichVuDto,
  ) {
    return this.service.createGia(u.sub, id, d);
  }
  @Patch('dich-vu/:dichVuId/chinh-sach-gia/:id')
  @RequirePermissions(PERMISSIONS.DICH_VU_SUA)
  @UseGuards(PermissionGuard)
  updateGia(
    @CurrentUser() u: JwtPayload,
    @Param('dichVuId', uuid) dv: string,
    @Param('id', uuid) id: string,
    @Body() d: UpdateChinhSachGiaDichVuDto,
  ) {
    return this.service.updateGia(u.sub, dv, id, d);
  }
  @Get('hop-dong/:hopDongId/dich-vu')
  @RequirePermissions(PERMISSIONS.DICH_VU_XEM)
  @UseGuards(PermissionGuard)
  assignments(@Param('hopDongId', uuid) h: string) {
    return this.service.listAssignments(h);
  }
  @Post('hop-dong/:hopDongId/dich-vu')
  @RequirePermissions(PERMISSIONS.DICH_VU_TAO)
  @UseGuards(PermissionGuard)
  assign(
    @CurrentUser() u: JwtPayload,
    @Param('hopDongId', uuid) h: string,
    @Body() d: CreateDichVuHopDongDto,
  ) {
    return this.service.assign(u.sub, h, d);
  }
  @Patch('hop-dong/:hopDongId/dich-vu/:id')
  @RequirePermissions(PERMISSIONS.DICH_VU_SUA)
  @UseGuards(PermissionGuard)
  updateAssignment(
    @CurrentUser() u: JwtPayload,
    @Param('hopDongId', uuid) h: string,
    @Param('id', uuid) id: string,
    @Body() d: UpdateDichVuHopDongDto,
  ) {
    return this.service.updateAssignment(u.sub, h, id, d);
  }
  @Delete('hop-dong/:hopDongId/dich-vu/:id')
  @RequirePermissions(PERMISSIONS.DICH_VU_XOA)
  @UseGuards(PermissionGuard)
  removeAssignment(
    @CurrentUser() u: JwtPayload,
    @Param('hopDongId', uuid) h: string,
    @Param('id', uuid) id: string,
  ) {
    return this.service.removeAssignment(u.sub, h, id);
  }
  @Get('hop-dong/:hopDongId/phat-sinh-dich-vu')
  @RequirePermissions(PERMISSIONS.DICH_VU_XEM)
  @UseGuards(PermissionGuard)
  occurrences(@Param('hopDongId', uuid) h: string) {
    return this.service.listOccurrences(h);
  }
  @Post('hop-dong/:hopDongId/phat-sinh-dich-vu')
  @RequirePermissions(PERMISSIONS.DICH_VU_TAO)
  @UseGuards(PermissionGuard)
  occurrence(
    @CurrentUser() u: JwtPayload,
    @Param('hopDongId', uuid) h: string,
    @Body() d: CreatePhatSinhDichVuDto,
  ) {
    return this.service.createOccurrence(u.sub, h, d);
  }
  @Post('hop-dong/:hopDongId/dich-vu/tinh-thu')
  @RequirePermissions(PERMISSIONS.DICH_VU_XEM)
  @UseGuards(PermissionGuard)
  preview(@Param('hopDongId', uuid) h: string, @Body() d: PreviewDichVuDto) {
    return this.service.preview(h, d);
  }
}
