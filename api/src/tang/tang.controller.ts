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
import { CreateTangDto, UpdateTangDto } from './dto/tang.dto';
import { TangService } from './tang.service';
@Controller()
@UseGuards(JwtAuthGuard)
@Scope('KHU_TRO')
export class TangController {
  constructor(private readonly service: TangService) {}
  @Post('khoi-nha/:khoiNhaId/tang')
  @RequirePermissions(PERMISSIONS.PHONG_TAO)
  @UseGuards(PermissionGuard)
  create(
    @CurrentUser() u: JwtPayload,
    @Param('khoiNhaId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() d: CreateTangDto,
  ) {
    return this.service.create(u.sub, id, d);
  }
  @Get('khoi-nha/:khoiNhaId/tang')
  @RequirePermissions(PERMISSIONS.PHONG_XEM)
  @UseGuards(PermissionGuard)
  list(@Param('khoiNhaId', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.list(id);
  }
  @Get('tang/:id')
  @RequirePermissions(PERMISSIONS.PHONG_XEM)
  @UseGuards(PermissionGuard)
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.get(id);
  }
  @Patch('tang/:id')
  @RequirePermissions(PERMISSIONS.PHONG_SUA)
  @UseGuards(PermissionGuard)
  update(
    @CurrentUser() u: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() d: UpdateTangDto,
  ) {
    return this.service.update(u.sub, id, d);
  }
  @Delete('tang/:id')
  @RequirePermissions(PERMISSIONS.PHONG_XOA)
  @UseGuards(PermissionGuard)
  remove(
    @CurrentUser() u: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.remove(u.sub, id);
  }
}
