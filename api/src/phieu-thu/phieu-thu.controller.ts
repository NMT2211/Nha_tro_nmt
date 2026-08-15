import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../authorization/permission.guard';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { Scope } from '../authorization/scope.decorator';
import { PERMISSIONS } from '../common/constants/permissions';
import { CreatePhieuThuDto, HuyPhieuThuDto } from '../hoa-don/dto/hoa-don.dto';
import { PhieuThuService } from './phieu-thu.service';
const uuid = new ParseUUIDPipe({ version: '4' });
@Controller()
@UseGuards(JwtAuthGuard)
@Scope('KHU_TRO')
export class PhieuThuController {
  constructor(private readonly service: PhieuThuService) {}
  @Post('khu-tro/:khuTroId/phieu-thu')
  @RequirePermissions(PERMISSIONS.PHIEU_THU_TAO)
  @UseGuards(PermissionGuard)
  create(
    @CurrentUser() u: JwtPayload,
    @Param('khuTroId', uuid) id: string,
    @Body() dto: CreatePhieuThuDto,
  ) {
    return this.service.create(u.sub, id, dto);
  }
  @Get('khu-tro/:khuTroId/phieu-thu')
  @RequirePermissions(PERMISSIONS.PHIEU_THU_XEM)
  @UseGuards(PermissionGuard)
  list(@Param('khuTroId', uuid) id: string) {
    return this.service.list(id);
  }
  @Get('phieu-thu/:phieuThuId')
  @RequirePermissions(PERMISSIONS.PHIEU_THU_XEM)
  @UseGuards(PermissionGuard)
  get(@Param('phieuThuId', uuid) id: string) {
    return this.service.get(id);
  }
  @Post('phieu-thu/:phieuThuId/xac-nhan')
  @RequirePermissions(PERMISSIONS.PHIEU_THU_XAC_NHAN)
  @UseGuards(PermissionGuard)
  confirm(@CurrentUser() u: JwtPayload, @Param('phieuThuId', uuid) id: string) {
    return this.service.confirm(u.sub, id);
  }
  @Post('phieu-thu/:phieuThuId/huy')
  @RequirePermissions(PERMISSIONS.PHIEU_THU_HUY)
  @UseGuards(PermissionGuard)
  cancel(
    @CurrentUser() u: JwtPayload,
    @Param('phieuThuId', uuid) id: string,
    @Body() dto: HuyPhieuThuDto,
  ) {
    return this.service.cancel(u.sub, id, dto.lyDo);
  }
}
