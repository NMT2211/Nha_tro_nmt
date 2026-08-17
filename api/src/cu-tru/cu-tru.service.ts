import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
  LoaiHoSoCuTru,
  Prisma,
  TrangThaiHoSoCuTru,
} from '../../generated/prisma/client';
import { PermissionService } from '../authorization/permission.service';
import { PERMISSIONS, PermissionCode } from '../common/constants/permissions';
import {
  canTransitionHoSo,
  deriveHoSoStatus,
  guestChargeableDays,
  guestStayDays,
  selectPrimaryDocument,
  selectResidenceAddress,
} from '../common/domain/cu-tru';
import { parseDateOnly } from '../common/domain/rental';
import { IdentityDataService } from '../common/security/identity-data.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
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

@Injectable()
export class CuTruService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionService,
    private readonly identity: IdentityDataService,
  ) {}

  async createHoSo(userId: string, khuTroId: string, dto: CreateHoSoCuTruDto) {
    await this.authorize(userId, khuTroId, PERMISSIONS.CU_TRU_TAO);
    const tuNgay = parseDateOnly(dto.tuNgay);
    const denNgay = dto.denNgay ? parseDateOnly(dto.denNgay) : null;
    this.period(tuNgay, denNgay);
    const context = await this.context(
      khuTroId,
      dto.phongId,
      dto.hopDongId,
      dto.caNhanId,
      tuNgay,
    );
    if (this.tenantType(dto.loaiHoSo) && !dto.hopDongId)
      throw new ConflictException('Loại hồ sơ này yêu cầu hợp đồng');
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${khuTroId}:${dto.caNhanId}:${dto.loaiHoSo}`}))`;
      const row = await tx.hoSoCuTru.create({
        data: {
          khuTroId,
          phongId: dto.phongId,
          hopDongId: dto.hopDongId,
          caNhanId: dto.caNhanId,
          loaiHoSo: dto.loaiHoSo,
          maHoSo: `HSCT-${randomBytes(8).toString('hex').toUpperCase()}`,
          tuNgay,
          denNgay,
          ghiChu: dto.ghiChu,
          nguoiTaoId: userId,
        },
      });
      await tx.lichSuHoSoCuTru.create({
        data: {
          hoSoCuTruId: row.id,
          hanhDong: 'TAO',
          trangThaiMoi: row.trangThai,
          noiDung: dto.ghiChu,
          nguoiThucHienId: userId,
        },
      });
      await this.audit(
        tx,
        userId,
        context.toChucId,
        khuTroId,
        'HO_SO_CU_TRU_TAO',
        'HO_SO_CU_TRU',
        row.id,
        { loaiHoSo: row.loaiHoSo, trangThai: row.trangThai },
      );
      return row;
    });
  }
  async listHoSo(userId: string, khuTroId: string, q: HoSoQueryDto) {
    await this.authorize(userId, khuTroId, PERMISSIONS.CU_TRU_XEM);
    const where: Prisma.HoSoCuTruWhereInput = {
      khuTroId,
      loaiHoSo: q.loaiHoSo,
      trangThai: q.trangThai,
      phongId: q.phongId,
      tuNgay: {
        gte: q.from ? parseDateOnly(q.from) : undefined,
        lte: q.to ? parseDateOnly(q.to) : undefined,
      },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.hoSoCuTru.findMany({
        where,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: [{ tuNgay: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.hoSoCuTru.count({ where }),
    ]);
    return {
      items: items.map((r) => ({
        ...r,
        trangThaiHienTai: deriveHoSoStatus(r.trangThai, r.denNgay),
      })),
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit),
      },
    };
  }
  async getHoSo(userId: string, id: string) {
    const row = await this.prisma.hoSoCuTru.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Không tìm thấy hồ sơ cư trú');
    await this.authorize(userId, row.khuTroId, PERMISSIONS.CU_TRU_XEM);
    return {
      ...row,
      trangThaiHienTai: deriveHoSoStatus(row.trangThai, row.denNgay),
    };
  }
  async updateHoSo(userId: string, id: string, dto: UpdateHoSoCuTruDto) {
    const old = await this.getHoSo(userId, id);
    await this.authorize(userId, old.khuTroId, PERMISSIONS.CU_TRU_SUA);
    if (!['CHUA_TAO', 'DA_TAO'].includes(old.trangThai))
      throw new ConflictException('Hồ sơ đã gửi không được sửa trực tiếp');
    const tuNgay = dto.tuNgay ? parseDateOnly(dto.tuNgay) : old.tuNgay;
    const denNgay = dto.denNgay ? parseDateOnly(dto.denNgay) : old.denNgay;
    this.period(tuNgay, denNgay);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.hoSoCuTru.update({
        where: { id },
        data: { tuNgay, denNgay, ghiChu: dto.ghiChu },
      });
      const khu = await tx.khuTro.findUniqueOrThrow({
        where: { id: row.khuTroId },
        select: { toChucId: true },
      });
      await this.audit(
        tx,
        userId,
        khu.toChucId,
        row.khuTroId,
        'HO_SO_CU_TRU_SUA',
        'HO_SO_CU_TRU',
        id,
        { tuNgay, denNgay, ghiChu: row.ghiChu },
      );
      return row;
    });
  }
  async transition(
    userId: string,
    id: string,
    to: TrangThaiHoSoCuTru,
    action: string,
    dto: TransitionHoSoDto,
  ) {
    const current = await this.getHoSo(userId, id);
    await this.authorize(userId, current.khuTroId, PERMISSIONS.CU_TRU_SUA);
    if (!canTransitionHoSo(current.trangThai, to))
      throw new ConflictException(
        `Không thể chuyển hồ sơ từ ${current.trangThai} sang ${to}`,
      );
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.hoSoCuTru.update({
        where: { id },
        data: {
          trangThai: to,
          ...(to === 'DA_GUI' ? { ngayGui: new Date() } : {}),
          ...(to === 'DA_TIEP_NHAN' ? { ngayTiepNhan: new Date() } : {}),
        },
      });
      await tx.lichSuHoSoCuTru.create({
        data: {
          hoSoCuTruId: id,
          hanhDong: action,
          trangThaiCu: current.trangThai,
          trangThaiMoi: to,
          noiDung: dto.noiDung,
          nguoiThucHienId: userId,
        },
      });
      const khu = await tx.khuTro.findUniqueOrThrow({
        where: { id: row.khuTroId },
        select: { toChucId: true },
      });
      await this.audit(
        tx,
        userId,
        khu.toChucId,
        row.khuTroId,
        `HO_SO_${action}`,
        'HO_SO_CU_TRU',
        id,
        { trangThaiCu: current.trangThai, trangThaiMoi: to },
      );
      return row;
    });
  }
  async history(userId: string, id: string) {
    await this.getHoSo(userId, id);
    return this.prisma.lichSuHoSoCuTru.findMany({
      where: { hoSoCuTruId: id },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async ct01(userId: string, id: string) {
    const hoSo = await this.prisma.hoSoCuTru.findUnique({
      where: { id },
      include: {
        caNhan: {
          include: {
            giayTos: { where: { deletedAt: null } },
            diaChis: { include: { diaChi: true } },
          },
        },
        khuTro: true,
        phong: true,
        hopDong: true,
      },
    });
    if (!hoSo) throw new NotFoundException('Không tìm thấy hồ sơ cư trú');
    await this.authorize(
      userId,
      hoSo.khuTroId,
      PERMISSIONS.CU_TRU_XUAT_DU_LIEU,
      PERMISSIONS.CCCD_XEM,
    );
    const selected = selectPrimaryDocument(hoSo.caNhan.giayTos, hoSo.tuNgay);
    const address = selectResidenceAddress(hoSo.caNhan.diaChis, hoSo.tuNgay);
    const missingFields: string[] = [];
    if (!hoSo.caNhan.hoTen) missingFields.push('hoTen');
    if (!hoSo.caNhan.ngaySinh) missingFields.push('ngaySinh');
    if (!hoSo.caNhan.gioiTinh) missingFields.push('gioiTinh');
    if (!selected.document) missingFields.push('primaryIdentityDocument');
    if (!address) missingFields.push('relevantAddress');
    if (!hoSo.khuTro.diaChiDayDu) missingFields.push('khuTroAddress');
    let soGiayTo: string | null = null;
    if (selected.document) {
      soGiayTo = this.identity.decrypt(selected.document.soGiayToMaHoa);
      await this.prisma.nhatKyTruyCapDuLieu.create({
        data: {
          taiKhoanId: userId,
          caNhanId: hoSo.caNhanId,
          loaiDuLieu: 'SO_GIAY_TO_CT01_PREPARATION',
          hanhDong: 'GIAI_MA_CHO_CT01',
        },
      });
    }
    return {
      tenDuLieu: 'Dữ liệu chuẩn bị CT01',
      isReady: missingFields.length === 0,
      missingFields,
      warnings: selected.ambiguous
        ? [
            'Có nhiều giấy tờ chính; đã chọn bản hiện hành mới nhất theo quy tắc xác định',
          ]
        : [],
      caNhan: {
        id: hoSo.caNhan.id,
        hoTen: hoSo.caNhan.hoTen,
        ngaySinh: hoSo.caNhan.ngaySinh,
        gioiTinh: hoSo.caNhan.gioiTinh,
        giayTo: selected.document
          ? {
              loaiGiayTo: selected.document.loaiGiayTo,
              soGiayTo,
              ngayCap: selected.document.ngayCap,
              noiCap: selected.document.noiCap,
            }
          : null,
        diaChi: address?.diaChi ?? null,
      },
      noiCuTru: {
        khuTro: {
          id: hoSo.khuTro.id,
          tenKhu: hoSo.khuTro.tenKhu,
          diaChiDayDu: hoSo.khuTro.diaChiDayDu,
        },
        phong: {
          id: hoSo.phong.id,
          maPhong: hoSo.phong.maPhong,
          tenPhong: hoSo.phong.tenPhong,
        },
        hopDongId: hoSo.hopDongId,
      },
      hoSo: {
        id: hoSo.id,
        maHoSo: hoSo.maHoSo,
        loaiHoSo: hoSo.loaiHoSo,
        tuNgay: hoSo.tuNgay,
        denNgay: hoSo.denNgay,
      },
    };
  }

  async createKhach(
    userId: string,
    khuTroId: string,
    dto: CreateKhachLuuTruDto,
  ) {
    await this.authorize(userId, khuTroId, PERMISSIONS.CU_TRU_TAO);
    const den = new Date(dto.thoiGianDen);
    const di = dto.thoiGianDiDuKien ? new Date(dto.thoiGianDiDuKien) : null;
    this.period(den, di);
    const ctx = await this.context(
      khuTroId,
      dto.phongId,
      undefined,
      undefined,
      den,
    );
    if (!(await this.relevantPerson(khuTroId, dto.caNhanId)))
      throw new ConflictException('Khách chưa có quan hệ hợp lệ với khu trọ');
    if (
      dto.nguoiDuocThamId &&
      !(await this.memberOfRoom(dto.nguoiDuocThamId, dto.phongId, den))
    )
      throw new ConflictException('Người được thăm không thuộc phòng này');
    const config = await this.prisma.cauHinhKhuTro.findFirst({
      where: {
        khuTroId,
        tuNgay: { lte: den },
        OR: [{ denNgay: null }, { denNgay: { gte: den } }],
      },
      orderBy: { tuNgay: 'desc' },
    });
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.khachLuuTru.create({
        data: {
          khuTroId,
          phongId: dto.phongId,
          caNhanId: dto.caNhanId,
          nguoiDuocThamId: dto.nguoiDuocThamId,
          thoiGianDen: den,
          thoiGianDiDuKien: di,
          lyDoLuuTru: dto.lyDoLuuTru,
          soNgayMienPhiApDung: config?.soNgayKhachMienPhi ?? 7,
          phuThuPhatSinh: BigInt(dto.phuThuPhatSinh ?? '0'),
          nguoiTaoId: userId,
        },
      });
      await this.audit(
        tx,
        userId,
        ctx.toChucId,
        khuTroId,
        'KHACH_LUU_TRU_TAO',
        'KHACH_LUU_TRU',
        row.id,
        {
          soNgayMienPhiApDung: row.soNgayMienPhiApDung,
          phuThuPhatSinh: row.phuThuPhatSinh.toString(),
        },
      );
      return row;
    });
  }
  async listKhach(userId: string, khuTroId: string, q: KhachQueryDto) {
    await this.authorize(userId, khuTroId, PERMISSIONS.CU_TRU_XEM);
    const where = { khuTroId, phongId: q.phongId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.khachLuuTru.findMany({
        where,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: { thoiGianDen: 'desc' },
      }),
      this.prisma.khachLuuTru.count({ where }),
    ]);
    return {
      items: items.map(this.guestView),
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit),
      },
    };
  }
  async getKhach(userId: string, id: string) {
    const row = await this.prisma.khachLuuTru.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Không tìm thấy khách lưu trú');
    await this.authorize(userId, row.khuTroId, PERMISSIONS.CU_TRU_XEM);
    return this.guestView(row);
  }
  async updateKhach(userId: string, id: string, dto: UpdateKhachLuuTruDto) {
    const old = await this.getKhach(userId, id);
    await this.authorize(userId, old.khuTroId, PERMISSIONS.CU_TRU_SUA);
    if (old.trangThaiLuuTru !== 'DANG_LUU_TRU')
      throw new ConflictException('Lượt lưu trú đã kết thúc');
    const expected = dto.thoiGianDiDuKien
      ? new Date(dto.thoiGianDiDuKien)
      : old.thoiGianDiDuKien;
    this.period(old.thoiGianDen, expected);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.khachLuuTru.update({
        where: { id },
        data: {
          thoiGianDiDuKien: expected,
          lyDoLuuTru: dto.lyDoLuuTru,
          ...(dto.phuThuPhatSinh !== undefined
            ? { phuThuPhatSinh: BigInt(dto.phuThuPhatSinh) }
            : {}),
        },
      });
      const khu = await tx.khuTro.findUniqueOrThrow({
        where: { id: row.khuTroId },
        select: { toChucId: true },
      });
      await this.audit(
        tx,
        userId,
        khu.toChucId,
        row.khuTroId,
        dto.phuThuPhatSinh !== undefined
          ? 'KHACH_LUU_TRU_SUA_PHU_THU'
          : 'KHACH_LUU_TRU_SUA',
        'KHACH_LUU_TRU',
        id,
        {
          thoiGianDiDuKien: row.thoiGianDiDuKien,
          phuThuPhatSinh: row.phuThuPhatSinh.toString(),
        },
      );
      return row;
    });
  }
  async depart(userId: string, id: string, dto: RoiDiDto) {
    const old = await this.getKhach(userId, id);
    await this.authorize(userId, old.khuTroId, PERMISSIONS.CU_TRU_SUA);
    if (old.trangThaiLuuTru !== 'DANG_LUU_TRU')
      throw new ConflictException('Khách không còn đang lưu trú');
    const end = new Date(dto.thoiGianDiThucTe);
    this.period(old.thoiGianDen, end);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.khachLuuTru.update({
        where: { id },
        data: { thoiGianDiThucTe: end, trangThaiLuuTru: 'DA_ROI_DI' },
      });
      const khu = await tx.khuTro.findUniqueOrThrow({
        where: { id: row.khuTroId },
        select: { toChucId: true },
      });
      await this.audit(
        tx,
        userId,
        khu.toChucId,
        row.khuTroId,
        'KHACH_LUU_TRU_ROI_DI',
        'KHACH_LUU_TRU',
        id,
        this.guestView(row),
      );
      return this.guestView(row);
    });
  }
  async cancelKhach(userId: string, id: string) {
    const old = await this.getKhach(userId, id);
    await this.authorize(userId, old.khuTroId, PERMISSIONS.CU_TRU_SUA);
    if (old.trangThaiLuuTru !== 'DANG_LUU_TRU')
      throw new ConflictException('Không thể hủy lượt lưu trú này');
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.khachLuuTru.update({
        where: { id },
        data: { trangThaiLuuTru: 'DA_HUY' },
      });
      const khu = await tx.khuTro.findUniqueOrThrow({
        where: { id: row.khuTroId },
        select: { toChucId: true },
      });
      await this.audit(
        tx,
        userId,
        khu.toChucId,
        row.khuTroId,
        'KHACH_LUU_TRU_HUY',
        'KHACH_LUU_TRU',
        id,
        { trangThaiLuuTru: row.trangThaiLuuTru },
      );
      return row;
    });
  }

  async createTamVang(
    userId: string,
    hopDongId: string,
    dto: CreateTamVangDto,
  ) {
    const hopDong = await this.prisma.hopDong.findFirst({
      where: { id: hopDongId, deletedAt: null },
      include: { khuTro: { select: { toChucId: true } } },
    });
    if (!hopDong) throw new NotFoundException('Không tìm thấy hợp đồng');
    await this.authorize(userId, hopDong.khuTroId, PERMISSIONS.CU_TRU_TAO);
    const start = parseDateOnly(dto.tuNgay),
      end = dto.denNgayDuKien ? parseDateOnly(dto.denNgayDuKien) : null;
    this.period(start, end);
    if (!(await this.memberOfHopDong(hopDongId, dto.caNhanId, start)))
      throw new ConflictException(
        'Cá nhân không thuộc hợp đồng trong thời gian tạm vắng',
      );
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${hopDongId}:${dto.caNhanId}`}))`;
      const overlap = await tx.tamVang.findFirst({
        where: {
          hopDongId,
          caNhanId: dto.caNhanId,
          trangThai: 'DANG_TAM_VANG',
          tuNgay: { lte: end ?? new Date('9999-12-31') },
          OR: [{ denNgayDuKien: null }, { denNgayDuKien: { gte: start } }],
        },
      });
      if (overlap) throw new ConflictException('Khoảng tạm vắng bị trùng');
      const row = await tx.tamVang.create({
        data: {
          hopDongId,
          caNhanId: dto.caNhanId,
          tuNgay: start,
          denNgayDuKien: end,
          lyDo: dto.lyDo,
          anhHuongTinhPhi: dto.anhHuongTinhPhi,
          nguoiTaoId: userId,
        },
      });
      await this.audit(
        tx,
        userId,
        hopDong.khuTro.toChucId,
        hopDong.khuTroId,
        'TAM_VANG_TAO',
        'TAM_VANG',
        row.id,
        { anhHuongTinhPhi: row.anhHuongTinhPhi },
      );
      return row;
    });
  }
  async listTamVang(userId: string, hopDongId: string) {
    const hop = await this.prisma.hopDong.findUnique({
      where: { id: hopDongId },
    });
    if (!hop) throw new NotFoundException('Không tìm thấy hợp đồng');
    await this.authorize(userId, hop.khuTroId, PERMISSIONS.CU_TRU_XEM);
    return this.prisma.tamVang.findMany({
      where: { hopDongId },
      orderBy: { tuNgay: 'desc' },
    });
  }
  async getTamVang(userId: string, id: string) {
    const row = await this.prisma.tamVang.findUnique({
      where: { id },
      include: { hopDong: { select: { khuTroId: true } } },
    });
    if (!row) throw new NotFoundException('Không tìm thấy tạm vắng');
    await this.authorize(userId, row.hopDong.khuTroId, PERMISSIONS.CU_TRU_XEM);
    return row;
  }
  async updateTamVang(userId: string, id: string, dto: UpdateTamVangDto) {
    const old = await this.getTamVang(userId, id);
    await this.authorize(userId, old.hopDong.khuTroId, PERMISSIONS.CU_TRU_SUA);
    if (old.trangThai !== 'DANG_TAM_VANG')
      throw new ConflictException('Tạm vắng đã kết thúc');
    const end = dto.denNgayDuKien
      ? parseDateOnly(dto.denNgayDuKien)
      : old.denNgayDuKien;
    this.period(old.tuNgay, end);
    return this.prisma.tamVang.update({
      where: { id },
      data: {
        denNgayDuKien: end,
        lyDo: dto.lyDo,
        anhHuongTinhPhi: dto.anhHuongTinhPhi,
      },
    });
  }
  async returnTamVang(userId: string, id: string, dto: QuayLaiDto) {
    const old = await this.getTamVang(userId, id);
    await this.authorize(userId, old.hopDong.khuTroId, PERMISSIONS.CU_TRU_SUA);
    if (old.trangThai !== 'DANG_TAM_VANG')
      throw new ConflictException('Tạm vắng không còn hiệu lực');
    const end = parseDateOnly(dto.denNgayThucTe);
    this.period(old.tuNgay, end);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.tamVang.update({
        where: { id },
        data: { denNgayThucTe: end, trangThai: 'DA_QUAY_LAI' },
      });
      const hop = await tx.hopDong.findUniqueOrThrow({
        where: { id: row.hopDongId },
        include: { khuTro: { select: { toChucId: true } } },
      });
      await this.audit(
        tx,
        userId,
        hop.khuTro.toChucId,
        hop.khuTroId,
        'TAM_VANG_QUAY_LAI',
        'TAM_VANG',
        id,
        { denNgayThucTe: row.denNgayThucTe, trangThai: row.trangThai },
      );
      return row;
    });
  }
  async cancelTamVang(userId: string, id: string) {
    const old = await this.getTamVang(userId, id);
    await this.authorize(userId, old.hopDong.khuTroId, PERMISSIONS.CU_TRU_SUA);
    if (old.trangThai !== 'DANG_TAM_VANG')
      throw new ConflictException('Không thể hủy tạm vắng');
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.tamVang.update({
        where: { id },
        data: { trangThai: 'DA_HUY' },
      });
      const hop = await tx.hopDong.findUniqueOrThrow({
        where: { id: row.hopDongId },
        include: { khuTro: { select: { toChucId: true } } },
      });
      await this.audit(
        tx,
        userId,
        hop.khuTro.toChucId,
        hop.khuTroId,
        'TAM_VANG_HUY',
        'TAM_VANG',
        id,
        { trangThai: row.trangThai },
      );
      return row;
    });
  }

  async exportData(userId: string, khuTroId: string, q: HoSoQueryDto) {
    await this.authorize(userId, khuTroId, PERMISSIONS.CU_TRU_XUAT_DU_LIEU);
    const where: Prisma.HoSoCuTruWhereInput = {
      khuTroId,
      loaiHoSo: q.loaiHoSo,
      trangThai: q.trangThai,
      phongId: q.phongId,
      tuNgay: {
        gte: q.from ? parseDateOnly(q.from) : undefined,
        lte: q.to ? parseDateOnly(q.to) : undefined,
      },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.hoSoCuTru.findMany({
        where,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: [{ tuNgay: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.hoSoCuTru.count({ where }),
    ]);
    return {
      tenDuLieu: 'Dữ liệu cư trú',
      includesPlaintextIdentity: false,
      items: items.map((row) => ({
        ...row,
        trangThaiHienTai: deriveHoSoStatus(row.trangThai, row.denNgay),
      })),
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit),
      },
    };
  }
  private guestView = <
    T extends {
      thoiGianDen: Date;
      thoiGianDiThucTe: Date | null;
      thoiGianDiDuKien: Date | null;
      soNgayMienPhiApDung: number;
    },
  >(
    row: T,
  ) => {
    const end = row.thoiGianDiThucTe ?? row.thoiGianDiDuKien;
    const soNgayLuuTru = end ? guestStayDays(row.thoiGianDen, end) : null;
    return {
      ...row,
      soNgayLuuTru,
      soNgayTinhPhi:
        soNgayLuuTru === null
          ? null
          : guestChargeableDays(soNgayLuuTru, row.soNgayMienPhiApDung),
    };
  };
  private tenantType(type: LoaiHoSoCuTru) {
    return (
      [
        LoaiHoSoCuTru.DANG_KY_TAM_TRU,
        LoaiHoSoCuTru.GIA_HAN_TAM_TRU,
        LoaiHoSoCuTru.DIEU_CHINH_TAM_TRU,
        LoaiHoSoCuTru.KET_THUC_TAM_TRU,
      ] as LoaiHoSoCuTru[]
    ).includes(type);
  }
  private period(start: Date, end: Date | null) {
    if (end && end < start)
      throw new ConflictException('Khoảng thời gian không hợp lệ');
  }
  private async authorize(
    userId: string,
    khuTroId: string,
    ...required: PermissionCode[]
  ) {
    if (
      !(await this.permissions.hasPermissions(
        userId,
        'KHU_TRO',
        khuTroId,
        required,
      ))
    )
      throw new ForbiddenException('Bạn không có quyền trên phạm vi này');
  }
  private async context(
    khuTroId: string,
    phongId: string,
    hopDongId: string | undefined,
    caNhanId: string | undefined,
    at: Date,
  ) {
    const khu = await this.prisma.khuTro.findFirst({
      where: { id: khuTroId, deletedAt: null },
      select: { toChucId: true },
    });
    if (!khu) throw new NotFoundException('Không tìm thấy khu trọ');
    const phong = await this.prisma.phong.findFirst({
      where: { id: phongId, khuTroId, deletedAt: null },
    });
    if (!phong) throw new ConflictException('Phòng không thuộc khu trọ');
    if (hopDongId) {
      const hop = await this.prisma.hopDong.findFirst({
        where: { id: hopDongId, khuTroId, phongId, deletedAt: null },
      });
      if (!hop)
        throw new ConflictException('Hợp đồng không thuộc khu trọ và phòng');
      if (caNhanId && !(await this.memberOfHopDong(hopDongId, caNhanId, at)))
        throw new ConflictException(
          'Cá nhân không thuộc hợp đồng trong thời gian hồ sơ',
        );
    } else if (caNhanId && !(await this.relevantPerson(khuTroId, caNhanId)))
      throw new ConflictException('Cá nhân không liên quan đến khu trọ');
    return khu;
  }
  private relevantPerson(khuTroId: string, caNhanId: string) {
    return this.prisma.caNhan
      .count({
        where: {
          id: caNhanId,
          deletedAt: null,
          OR: [
            {
              thanhVienHopDongs: {
                some: { hopDong: { khuTroId, deletedAt: null } },
              },
            },
            {
              nhatKyTruyCap: {
                some: {
                  loaiDuLieu: `KHU_TRO:${khuTroId}`,
                  hanhDong: 'CA_NHAN_TAO',
                },
              },
            },
            { khachLuuTrus: { some: { khuTroId } } },
          ],
        },
      })
      .then(Boolean);
  }
  private memberOfHopDong(hopDongId: string, caNhanId: string, at: Date) {
    return this.prisma.thanhVienHopDong
      .count({
        where: {
          hopDongId,
          caNhanId,
          trangThai: 'HOAT_DONG',
          ngayBatDauO: { lte: at },
          OR: [{ ngayKetThucO: null }, { ngayKetThucO: { gte: at } }],
        },
      })
      .then(Boolean);
  }
  private memberOfRoom(caNhanId: string, phongId: string, at: Date) {
    return this.prisma.thanhVienHopDong
      .count({
        where: {
          caNhanId,
          trangThai: 'HOAT_DONG',
          ngayBatDauO: { lte: at },
          OR: [{ ngayKetThucO: null }, { ngayKetThucO: { gte: at } }],
          hopDong: { phongId, deletedAt: null },
        },
      })
      .then(Boolean);
  }
  private audit(
    tx: Prisma.TransactionClient,
    taiKhoanId: string,
    toChucId: string,
    khuTroId: string,
    hanhDong: string,
    loaiDoiTuong: string,
    doiTuongId: string,
    data: object,
  ) {
    return tx.nhatKyHeThong.create({
      data: {
        taiKhoanId,
        toChucId,
        khuTroId,
        hanhDong,
        loaiDoiTuong,
        doiTuongId,
        duLieuSau: JSON.parse(
          JSON.stringify(data, (_k, v: unknown) =>
            typeof v === 'bigint' ? v.toString() : v,
          ),
        ) as Prisma.InputJsonValue,
      },
    });
  }
}
