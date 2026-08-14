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
import { CongToService } from './cong-to.service';
import {
  CreateChiSoCongToDto,
  CreateCongToDto,
  DieuChinhChiSoDto,
  UpdateCongToDto,
} from './dto/cong-to.dto';
const uuid = new ParseUUIDPipe({ version: '4' });
@Controller()
@UseGuards(JwtAuthGuard)
@Scope('KHU_TRO')
export class CongToController {
  constructor(private readonly service: CongToService) {}
  @Post('khu-tro/:khuTroId/cong-to')
  @RequirePermissions(PERMISSIONS.CONG_TO_TAO)
  @UseGuards(PermissionGuard)
  create(
    @CurrentUser() u: JwtPayload,
    @Param('khuTroId', uuid) k: string,
    @Body() d: CreateCongToDto,
  ) {
    return this.service.create(u.sub, k, d);
  }
  @Get('khu-tro/:khuTroId/cong-to')
  @RequirePermissions(PERMISSIONS.CONG_TO_XEM)
  @UseGuards(PermissionGuard)
  list(@Param('khuTroId', uuid) k: string) {
    return this.service.list(k);
  }
  @Get('cong-to/:id')
  @RequirePermissions(PERMISSIONS.CONG_TO_XEM)
  @UseGuards(PermissionGuard)
  get(@Param('id', uuid) id: string) {
    return this.service.get(id);
  }
  @Patch('cong-to/:id')
  @RequirePermissions(PERMISSIONS.CONG_TO_SUA)
  @UseGuards(PermissionGuard)
  update(
    @CurrentUser() u: JwtPayload,
    @Param('id', uuid) id: string,
    @Body() d: UpdateCongToDto,
  ) {
    return this.service.update(u.sub, id, d);
  }
  @Delete('cong-to/:id')
  @RequirePermissions(PERMISSIONS.CONG_TO_XOA)
  @UseGuards(PermissionGuard)
  remove(@CurrentUser() u: JwtPayload, @Param('id', uuid) id: string) {
    return this.service.remove(u.sub, id);
  }
  @Get('cong-to/:congToId/chi-so')
  @RequirePermissions(PERMISSIONS.CHI_SO_XEM)
  @UseGuards(PermissionGuard)
  readings(@Param('congToId', uuid) id: string) {
    return this.service.listReadings(id);
  }
  @Post('cong-to/:congToId/chi-so')
  @RequirePermissions(PERMISSIONS.CHI_SO_GHI)
  @UseGuards(PermissionGuard)
  reading(
    @CurrentUser() u: JwtPayload,
    @Param('congToId', uuid) id: string,
    @Body() d: CreateChiSoCongToDto,
  ) {
    return this.service.createReading(u.sub, id, d);
  }
  @Get('cong-to/:congToId/chi-so/:id')
  @RequirePermissions(PERMISSIONS.CHI_SO_XEM)
  @UseGuards(PermissionGuard)
  getReading(
    @Param('congToId', uuid) c: string,
    @Param('id', uuid) id: string,
  ) {
    return this.service.getReading(c, id);
  }
  @Post('cong-to/:congToId/chi-so/:chiSoId/dieu-chinh')
  @RequirePermissions(PERMISSIONS.CHI_SO_DIEU_CHINH)
  @UseGuards(PermissionGuard)
  adjust(
    @CurrentUser() u: JwtPayload,
    @Param('congToId', uuid) c: string,
    @Param('chiSoId', uuid) id: string,
    @Body() d: DieuChinhChiSoDto,
  ) {
    return this.service.adjust(u.sub, c, id, d);
  }
}
