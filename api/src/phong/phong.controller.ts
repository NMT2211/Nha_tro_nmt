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
  CreateChinhSachGiaPhongDto,
  CreatePhongDto,
  UpdateChinhSachGiaPhongDto,
  UpdatePhongDto,
} from './dto/phong.dto';
import { PhongService } from './phong.service';
@Controller()
@UseGuards(JwtAuthGuard)
@Scope('KHU_TRO')
export class PhongController {
  constructor(private readonly service: PhongService) {}
  @Post('khu-tro/:khuTroId/phong')
  @RequirePermissions(PERMISSIONS.PHONG_TAO)
  @UseGuards(PermissionGuard)
  create(
    @CurrentUser() u: JwtPayload,
    @Param('khuTroId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() d: CreatePhongDto,
  ) {
    return this.service.create(u.sub, id, d);
  }
  @Get('khu-tro/:khuTroId/phong')
  @RequirePermissions(PERMISSIONS.PHONG_XEM)
  @UseGuards(PermissionGuard)
  list(@Param('khuTroId', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.list(id);
  }
  @Get('phong/:id')
  @RequirePermissions(PERMISSIONS.PHONG_XEM)
  @UseGuards(PermissionGuard)
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.get(id);
  }
  @Patch('phong/:id')
  @RequirePermissions(PERMISSIONS.PHONG_SUA)
  @UseGuards(PermissionGuard)
  update(
    @CurrentUser() u: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() d: UpdatePhongDto,
  ) {
    return this.service.update(u.sub, id, d);
  }
  @Delete('phong/:id')
  @RequirePermissions(PERMISSIONS.PHONG_XOA)
  @UseGuards(PermissionGuard)
  remove(
    @CurrentUser() u: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.remove(u.sub, id);
  }
  @Get('phong/:phongId/chinh-sach-gia')
  @RequirePermissions(PERMISSIONS.PHONG_XEM)
  @UseGuards(PermissionGuard)
  listGia(@Param('phongId', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.listGia(id);
  }
  @Post('phong/:phongId/chinh-sach-gia')
  @RequirePermissions(PERMISSIONS.PHONG_SUA)
  @UseGuards(PermissionGuard)
  createGia(
    @CurrentUser() u: JwtPayload,
    @Param('phongId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() d: CreateChinhSachGiaPhongDto,
  ) {
    return this.service.createGia(u.sub, id, d);
  }
  @Patch('phong/:phongId/chinh-sach-gia/:id')
  @RequirePermissions(PERMISSIONS.PHONG_SUA)
  @UseGuards(PermissionGuard)
  updateGia(
    @CurrentUser() u: JwtPayload,
    @Param('phongId', new ParseUUIDPipe({ version: '4' })) pid: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() d: UpdateChinhSachGiaPhongDto,
  ) {
    return this.service.updateGia(u.sub, pid, id, d);
  }
}
