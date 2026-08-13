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
import {
  CreateGiaoDichTienCocDto,
  CreateHopDongDto,
  CreateThanhVienDto,
  CreateYeuCauTraPhongDto,
  HopDongQueryDto,
  UpdateHopDongDto,
  UpdateThanhVienDto,
  UpdateYeuCauTraPhongDto,
} from './dto/hop-dong.dto';
import { HopDongService } from './hop-dong.service';

@Controller('hop-dong')
@UseGuards(JwtAuthGuard)
export class HopDongController {
  constructor(private readonly service: HopDongService) {}
  @Post() create(@CurrentUser() u: JwtPayload, @Body() d: CreateHopDongDto) {
    return this.service.create(u.sub, d);
  }
  @Get() list(@CurrentUser() u: JwtPayload, @Query() q: HopDongQueryDto) {
    return this.service.list(u.sub, q);
  }
  @Get(':id') get(
    @CurrentUser() u: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.get(u.sub, id);
  }
  @Patch(':id') update(
    @CurrentUser() u: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() d: UpdateHopDongDto,
  ) {
    return this.service.update(u.sub, id, d);
  }
  @Post(':id/kich-hoat') activate(
    @CurrentUser() u: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.activate(u.sub, id);
  }
  @Post(':id/ket-thuc') finish(
    @CurrentUser() u: JwtPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.finish(u.sub, id);
  }

  @Get(':hopDongId/thanh-vien') members(
    @CurrentUser() u: JwtPayload,
    @Param('hopDongId', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.listMembers(u.sub, id);
  }
  @Post(':hopDongId/thanh-vien') addMember(
    @CurrentUser() u: JwtPayload,
    @Param('hopDongId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() d: CreateThanhVienDto,
  ) {
    return this.service.addMember(u.sub, id, d);
  }
  @Patch(':hopDongId/thanh-vien/:id') updateMember(
    @CurrentUser() u: JwtPayload,
    @Param('hopDongId', new ParseUUIDPipe({ version: '4' })) hopDongId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() d: UpdateThanhVienDto,
  ) {
    return this.service.updateMember(u.sub, hopDongId, id, d);
  }
  @Delete(':hopDongId/thanh-vien/:id') removeMember(
    @CurrentUser() u: JwtPayload,
    @Param('hopDongId', new ParseUUIDPipe({ version: '4' })) hopDongId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.removeMember(u.sub, hopDongId, id);
  }

  @Get(':hopDongId/tien-coc') deposits(
    @CurrentUser() u: JwtPayload,
    @Param('hopDongId', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.listDeposits(u.sub, id);
  }
  @Post(':hopDongId/tien-coc') addDeposit(
    @CurrentUser() u: JwtPayload,
    @Param('hopDongId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() d: CreateGiaoDichTienCocDto,
  ) {
    return this.service.addDeposit(u.sub, id, d);
  }

  @Get(':hopDongId/yeu-cau-tra-phong') checkout(
    @CurrentUser() u: JwtPayload,
    @Param('hopDongId', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.getCheckout(u.sub, id);
  }
  @Post(':hopDongId/yeu-cau-tra-phong') createCheckout(
    @CurrentUser() u: JwtPayload,
    @Param('hopDongId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() d: CreateYeuCauTraPhongDto,
  ) {
    return this.service.createCheckout(u.sub, id, d);
  }
  @Patch(':hopDongId/yeu-cau-tra-phong/:id') updateCheckout(
    @CurrentUser() u: JwtPayload,
    @Param('hopDongId', new ParseUUIDPipe({ version: '4' })) hopDongId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() d: UpdateYeuCauTraPhongDto,
  ) {
    return this.service.updateCheckout(u.sub, hopDongId, id, d);
  }
}
