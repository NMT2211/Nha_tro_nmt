import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import {
  DieuChinhHoaDonDto,
  HuyHoaDonDto,
  TinhHoaDonDto,
  UpdateHoaDonDto,
} from './dto/hoa-don.dto';
import { HoaDonService } from './hoa-don.service';
const uuid = new ParseUUIDPipe({ version: '4' });

@Controller()
@UseGuards(JwtAuthGuard)
@Scope('KHU_TRO')
export class HoaDonController {
  constructor(private readonly service: HoaDonService) {}
  @Post('hop-dong/:hopDongId/hoa-don/preview')
  @RequirePermissions(PERMISSIONS.HOA_DON_XEM)
  @UseGuards(PermissionGuard)
  preview(@Param('hopDongId', uuid) id: string, @Body() dto: TinhHoaDonDto) {
    return this.service.preview(id, dto);
  }
  @Post('hop-dong/:hopDongId/hoa-don')
  @RequirePermissions(PERMISSIONS.HOA_DON_TAO)
  @UseGuards(PermissionGuard)
  create(
    @CurrentUser() u: JwtPayload,
    @Param('hopDongId', uuid) id: string,
    @Body() dto: TinhHoaDonDto,
  ) {
    return this.service.create(u.sub, id, dto);
  }
  @Get('hop-dong/:hopDongId/hoa-don')
  @RequirePermissions(PERMISSIONS.HOA_DON_XEM)
  @UseGuards(PermissionGuard)
  list(@Param('hopDongId', uuid) id: string) {
    return this.service.list(id);
  }
  @Get('hop-dong/:hopDongId/cong-no')
  @RequirePermissions(PERMISSIONS.HOA_DON_XEM)
  @UseGuards(PermissionGuard)
  debt(@Param('hopDongId', uuid) id: string) {
    return this.service.debt(id);
  }
  @Get('hoa-don/:hoaDonId')
  @RequirePermissions(PERMISSIONS.HOA_DON_XEM)
  @UseGuards(PermissionGuard)
  get(@Param('hoaDonId', uuid) id: string) {
    return this.service.get(id);
  }
  @Patch('hoa-don/:hoaDonId')
  update(
    @CurrentUser() u: JwtPayload,
    @Param('hoaDonId', uuid) id: string,
    @Body() dto: UpdateHoaDonDto,
  ) {
    return this.service.update(u.sub, id, dto);
  }
  @Post('hoa-don/:hoaDonId/phat-hanh')
  @RequirePermissions(PERMISSIONS.HOA_DON_SUA_BAN_NHAP)
  @UseGuards(PermissionGuard)
  issue(@CurrentUser() u: JwtPayload, @Param('hoaDonId', uuid) id: string) {
    return this.service.issue(u.sub, id);
  }
  @Post('hoa-don/:hoaDonId/dieu-chinh')
  @RequirePermissions(PERMISSIONS.HOA_DON_DIEU_CHINH)
  @UseGuards(PermissionGuard)
  adjust(
    @CurrentUser() u: JwtPayload,
    @Param('hoaDonId', uuid) id: string,
    @Body() dto: DieuChinhHoaDonDto,
  ) {
    return this.service.adjust(u.sub, id, dto);
  }
  @Post('hoa-don/:hoaDonId/huy')
  @RequirePermissions(PERMISSIONS.HOA_DON_HUY)
  @UseGuards(PermissionGuard)
  cancel(
    @CurrentUser() u: JwtPayload,
    @Param('hoaDonId', uuid) id: string,
    @Body() dto: HuyHoaDonDto,
  ) {
    return this.service.cancel(u.sub, id, dto.lyDo);
  }
  @Post('hoa-don/:hoaDonId/lien-ket/khoa')
  @RequirePermissions(PERMISSIONS.HOA_DON_SUA_DA_PHAT_HANH)
  @UseGuards(PermissionGuard)
  lockLink(@CurrentUser() u: JwtPayload, @Param('hoaDonId', uuid) id: string) {
    return this.service.lockPublicLink(u.sub, id);
  }
  @Get('hoa-don/:hoaDonId/phien-ban')
  @RequirePermissions(PERMISSIONS.HOA_DON_XEM)
  @UseGuards(PermissionGuard)
  versions(@Param('hoaDonId', uuid) id: string) {
    return this.service.versions(id);
  }
}

@Controller('public/hoa-don')
export class PublicHoaDonController {
  constructor(private readonly service: HoaDonService) {}
  @Get(':token') lookup(@Param('token') token: string) {
    return this.service.publicLookup(token);
  }
}
