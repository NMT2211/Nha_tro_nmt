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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { PermissionGuard } from '../authorization/permission.guard';
import { RequirePermissions } from '../authorization/require-permissions.decorator';
import { Scope } from '../authorization/scope.decorator';
import { PERMISSIONS } from '../common/constants/permissions';
import { CreateToChucDto } from './dto/create-to-chuc.dto';
import { ToChucService } from './to-chuc.service';

@Controller('to-chuc')
@UseGuards(JwtAuthGuard)
export class ToChucController {
  constructor(private readonly service: ToChucService) {}
  @Post() create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateToChucDto,
  ) {
    return this.service.create(user.sub, dto);
  }
  @Get() list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user.sub);
  }
  @Get(':id')
  @Scope('TO_CHUC')
  @RequirePermissions(PERMISSIONS.TO_CHUC_XEM)
  @UseGuards(PermissionGuard)
  get(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.getById(user.sub, id);
  }
}
