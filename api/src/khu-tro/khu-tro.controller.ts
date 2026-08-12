import {
  Body,
  Controller,
  Delete,
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
import { PermissionGuard } from '../authorization/permission.guard';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { Scope } from '../authorization/scope.decorator';
import { PERMISSIONS } from '../common/constants/permissions';
import {
  AddThanhVienDto,
  CreateKhuTroDto,
  UpdateCauHinhDto,
  UpdateKhuTroDto,
  UpdateThanhVienDto,
} from './dto/khu-tro.dto';
import { KhuTroQueryDto } from './dto/khu-tro-query.dto';
import { KhuTroService } from './khu-tro.service';

@Controller('khu-tro')
@UseGuards(JwtAuthGuard)
export class KhuTroController {
  constructor(private readonly service: KhuTroService) {}
  @Post() create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateKhuTroDto,
  ) {
    return this.service.create(user.sub, dto);
  }
  @Get() list(@CurrentUser() user: JwtPayload, @Query() query: KhuTroQueryDto) {
    return this.service.list(user.sub, query.page, query.limit, query.search);
  }
  @Get(':id')
  @Scope('KHU_TRO')
  @RequirePermissions(PERMISSIONS.KHU_TRO_XEM)
  @UseGuards(PermissionGuard)
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.get(id);
  }
  @Patch(':id')
  @Scope('KHU_TRO')
  @RequirePermissions(PERMISSIONS.KHU_TRO_SUA)
  @UseGuards(PermissionGuard)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateKhuTroDto,
  ) {
    return this.service.update(user.sub, id, dto);
  }
  @Delete(':id')
  @Scope('KHU_TRO')
  @RequirePermissions(PERMISSIONS.KHU_TRO_XOA)
  @UseGuards(PermissionGuard)
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.remove(user.sub, id);
  }
  @Get(':khuTroId/thanh-vien')
  @Scope('KHU_TRO')
  @RequirePermissions(PERMISSIONS.KHU_TRO_XEM)
  @UseGuards(PermissionGuard)
  members(@Param('khuTroId', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.listThanhVien(id);
  }
  @Post(':khuTroId/thanh-vien')
  @Scope('KHU_TRO')
  @RequirePermissions(PERMISSIONS.KHU_TRO_MOI_THANH_VIEN)
  @UseGuards(PermissionGuard)
  addMember(
    @CurrentUser() user: JwtPayload,
    @Param('khuTroId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: AddThanhVienDto,
  ) {
    return this.service.addThanhVien(user.sub, id, dto);
  }
  @Patch(':khuTroId/thanh-vien/:taiKhoanId')
  @Scope('KHU_TRO')
  @RequirePermissions(PERMISSIONS.KHU_TRO_SUA_QUYEN_THANH_VIEN)
  @UseGuards(PermissionGuard)
  updateMember(
    @CurrentUser() user: JwtPayload,
    @Param('khuTroId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('taiKhoanId', new ParseUUIDPipe({ version: '4' }))
    taiKhoanId: string,
    @Body() dto: UpdateThanhVienDto,
  ) {
    return this.service.updateThanhVien(user.sub, id, taiKhoanId, dto);
  }
  @Delete(':khuTroId/thanh-vien/:taiKhoanId')
  @Scope('KHU_TRO')
  @RequirePermissions(PERMISSIONS.KHU_TRO_XOA_THANH_VIEN)
  @UseGuards(PermissionGuard)
  removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('khuTroId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('taiKhoanId', new ParseUUIDPipe({ version: '4' }))
    taiKhoanId: string,
  ) {
    return this.service.removeThanhVien(user.sub, id, taiKhoanId);
  }
  @Get(':khuTroId/cau-hinh')
  @Scope('KHU_TRO')
  @RequirePermissions(PERMISSIONS.KHU_TRO_XEM)
  @UseGuards(PermissionGuard)
  config(@Param('khuTroId', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.getCauHinh(id);
  }
  @Patch(':khuTroId/cau-hinh')
  @Scope('KHU_TRO')
  @RequirePermissions(PERMISSIONS.KHU_TRO_SUA)
  @UseGuards(PermissionGuard)
  updateConfig(
    @CurrentUser() user: JwtPayload,
    @Param('khuTroId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateCauHinhDto,
  ) {
    return this.service.updateCauHinh(user.sub, id, dto);
  }
}
