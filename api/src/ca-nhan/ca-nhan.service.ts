import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client';
import { PermissionService } from '../authorization/permission.service';
import { PERMISSIONS } from '../common/constants/permissions';
import { parseDateOnly } from '../common/domain/rental';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityDataService } from '../common/security/identity-data.service';
import type {
  CaNhanQueryDto,
  CreateCaNhanDto,
  CreateDiaChiDto,
  CreateGiayToDto,
  CreateLienHeKhanCapDto,
  UpdateCaNhanDto,
  UpdateDiaChiDto,
  UpdateGiayToDto,
  UpdateLienHeKhanCapDto,
} from './dto/ca-nhan.dto';

@Injectable()
export class CaNhanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionService,
    private readonly identityData: IdentityDataService,
  ) {}

  async create(userId: string, dto: CreateCaNhanDto) {
    await this.authorize(userId, dto.khuTroId, PERMISSIONS.NGUOI_THUE_TAO);
    const khu = await this.khu(dto.khuTroId);
    const { khuTroId, ngaySinh, ...data } = dto;
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.caNhan.create({
        data: {
          ...data,
          maCaNhan: `CN-${randomBytes(6).toString('hex').toUpperCase()}`,
          ngaySinh: ngaySinh ? parseDateOnly(ngaySinh) : undefined,
        },
      });
      await this.auditTx(
        tx,
        userId,
        khu.toChucId,
        khuTroId,
        'CA_NHAN_TAO',
        'CA_NHAN',
        row.id,
        {
          maCaNhan: row.maCaNhan,
          hoTen: row.hoTen,
        },
      );
      return row;
    });
  }

  async list(userId: string, query: CaNhanQueryDto) {
    await this.authorize(userId, query.khuTroId, PERMISSIONS.NGUOI_THUE_XEM);
    const relevance = this.relevance(query.khuTroId);
    const where: Prisma.CaNhanWhereInput = {
      deletedAt: null,
      AND: [
        relevance,
        query.search
          ? {
              OR: [
                { hoTen: { contains: query.search, mode: 'insensitive' } },
                { soDienThoai: { contains: query.search } },
                { email: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.caNhan.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.caNhan.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async get(userId: string, khuTroId: string, id: string) {
    await this.authorize(userId, khuTroId, PERMISSIONS.NGUOI_THUE_XEM);
    const row = await this.prisma.caNhan.findFirst({
      where: { id, deletedAt: null, ...this.relevance(khuTroId) },
    });
    if (!row) throw new NotFoundException('Không tìm thấy cá nhân');
    return row;
  }

  async update(userId: string, id: string, dto: UpdateCaNhanDto) {
    if (!dto.khuTroId) throw new ConflictException('Thiếu khuTroId');
    await this.authorize(userId, dto.khuTroId, PERMISSIONS.NGUOI_THUE_SUA);
    const before = await this.get(userId, dto.khuTroId, id);
    const khu = await this.khu(dto.khuTroId);
    const { khuTroId, ngaySinh, ...data } = dto;
    const row = await this.prisma.caNhan.update({
      where: { id },
      data: {
        ...data,
        ...(ngaySinh ? { ngaySinh: parseDateOnly(ngaySinh) } : {}),
      },
    });
    await this.audit(
      userId,
      khu.toChucId,
      khuTroId,
      'CA_NHAN_SUA',
      'CA_NHAN',
      id,
      this.publicCaNhan(row),
      this.publicCaNhan(before),
    );
    return row;
  }

  async listGiayTo(userId: string, khuTroId: string, caNhanId: string) {
    await this.get(userId, khuTroId, caNhanId);
    await this.authorize(userId, khuTroId, PERMISSIONS.CCCD_XEM);
    const rows = await this.prisma.giayToTuyThan.findMany({
      where: { caNhanId, deletedAt: null },
      select: {
        id: true,
        caNhanId: true,
        loaiGiayTo: true,
        ngayCap: true,
        noiCap: true,
        ngayHetHan: true,
        laGiayToChinh: true,
        anhMatTruocId: true,
        anhMatSauId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({ ...row, soGiayTo: '[ĐÃ MÃ HÓA]' }));
  }

  async createGiayTo(userId: string, caNhanId: string, dto: CreateGiayToDto) {
    await this.get(userId, dto.khuTroId, caNhanId);
    await this.authorize(userId, dto.khuTroId, PERMISSIONS.NGUOI_THUE_SUA);
    const khu = await this.khu(dto.khuTroId);
    const { khuTroId, soGiayTo, ngayCap, ngayHetHan, ...data } = dto;
    const secure = this.identityData.protect(soGiayTo);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const row = await tx.giayToTuyThan.create({
          data: {
            caNhanId,
            ...data,
            ...secure,
            ngayCap: ngayCap ? parseDateOnly(ngayCap) : undefined,
            ngayHetHan: ngayHetHan ? parseDateOnly(ngayHetHan) : undefined,
          },
        });
        await this.auditTx(
          tx,
          userId,
          khu.toChucId,
          khuTroId,
          'GIAY_TO_TAO',
          'GIAY_TO_TUY_THAN',
          row.id,
          {
            caNhanId,
            loaiGiayTo: row.loaiGiayTo,
            laGiayToChinh: row.laGiayToChinh,
          },
        );
        return {
          ...row,
          soGiayToMaHoa: undefined,
          soGiayToHash: undefined,
          soGiayTo: '[ĐÃ MÃ HÓA]',
        };
      });
    } catch (error) {
      this.uniqueDocument(error);
    }
  }

  async updateGiayTo(
    userId: string,
    caNhanId: string,
    id: string,
    dto: UpdateGiayToDto,
  ) {
    if (!dto.khuTroId) throw new ConflictException('Thiếu khuTroId');
    await this.get(userId, dto.khuTroId, caNhanId);
    await this.authorize(userId, dto.khuTroId, PERMISSIONS.NGUOI_THUE_SUA);
    const old = await this.prisma.giayToTuyThan.findFirst({
      where: { id, caNhanId, deletedAt: null },
    });
    if (!old) throw new NotFoundException('Không tìm thấy giấy tờ tùy thân');
    const khu = await this.khu(dto.khuTroId);
    const { khuTroId, soGiayTo, ngayCap, ngayHetHan, ...data } = dto;
    try {
      const row = await this.prisma.giayToTuyThan.update({
        where: { id },
        data: {
          ...data,
          ...(soGiayTo ? this.identityData.protect(soGiayTo) : {}),
          ...(ngayCap ? { ngayCap: parseDateOnly(ngayCap) } : {}),
          ...(ngayHetHan ? { ngayHetHan: parseDateOnly(ngayHetHan) } : {}),
        },
      });
      await this.audit(
        userId,
        khu.toChucId,
        khuTroId,
        'GIAY_TO_SUA',
        'GIAY_TO_TUY_THAN',
        id,
        { caNhanId, loaiGiayTo: row.loaiGiayTo },
        { caNhanId, loaiGiayTo: old.loaiGiayTo },
      );
      return {
        ...row,
        soGiayToMaHoa: undefined,
        soGiayToHash: undefined,
        soGiayTo: '[ĐÃ MÃ HÓA]',
      };
    } catch (error) {
      this.uniqueDocument(error);
    }
  }

  async listDiaChi(userId: string, khuTroId: string, caNhanId: string) {
    await this.get(userId, khuTroId, caNhanId);
    return this.prisma.caNhanDiaChi.findMany({
      where: { caNhanId },
      include: { diaChi: true },
      orderBy: { tuNgay: 'desc' },
    });
  }
  async createDiaChi(userId: string, caNhanId: string, dto: CreateDiaChiDto) {
    await this.get(userId, dto.khuTroId, caNhanId);
    await this.authorize(userId, dto.khuTroId, PERMISSIONS.NGUOI_THUE_SUA);
    this.validatePeriod(dto.tuNgay, dto.denNgay);
    const khu = await this.khu(dto.khuTroId);
    const { khuTroId, loaiDiaChi, tuNgay, denNgay, laHienTai, ...address } =
      dto;
    return this.prisma.$transaction(async (tx) => {
      const diaChi = await tx.diaChi.create({ data: address });
      const row = await tx.caNhanDiaChi.create({
        data: {
          caNhanId,
          diaChiId: diaChi.id,
          loaiDiaChi,
          tuNgay: tuNgay ? parseDateOnly(tuNgay) : undefined,
          denNgay: denNgay ? parseDateOnly(denNgay) : undefined,
          laHienTai,
        },
      });
      await this.auditTx(
        tx,
        userId,
        khu.toChucId,
        khuTroId,
        'DIA_CHI_TAO',
        'CA_NHAN_DIA_CHI',
        row.id,
        { caNhanId, loaiDiaChi },
      );
      return { ...row, diaChi };
    });
  }
  async updateDiaChi(
    userId: string,
    caNhanId: string,
    id: string,
    dto: UpdateDiaChiDto,
  ) {
    if (!dto.khuTroId) throw new ConflictException('Thiếu khuTroId');
    await this.get(userId, dto.khuTroId, caNhanId);
    await this.authorize(userId, dto.khuTroId, PERMISSIONS.NGUOI_THUE_SUA);
    const relation = await this.prisma.caNhanDiaChi.findFirst({
      where: { id, caNhanId },
    });
    if (!relation)
      throw new NotFoundException('Không tìm thấy địa chỉ của cá nhân');
    this.validatePeriod(dto.tuNgay, dto.denNgay);
    const khu = await this.khu(dto.khuTroId);
    const { khuTroId, loaiDiaChi, tuNgay, denNgay, laHienTai, ...address } =
      dto;
    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(address).length)
        await tx.diaChi.update({
          where: { id: relation.diaChiId },
          data: address,
        });
      const row = await tx.caNhanDiaChi.update({
        where: { id },
        data: {
          loaiDiaChi,
          ...(tuNgay ? { tuNgay: parseDateOnly(tuNgay) } : {}),
          ...(denNgay ? { denNgay: parseDateOnly(denNgay) } : {}),
          laHienTai,
        },
      });
      await this.auditTx(
        tx,
        userId,
        khu.toChucId,
        khuTroId,
        'DIA_CHI_SUA',
        'CA_NHAN_DIA_CHI',
        id,
        { caNhanId, loaiDiaChi: row.loaiDiaChi },
      );
      return row;
    });
  }

  async listLienHe(userId: string, khuTroId: string, caNhanId: string) {
    await this.get(userId, khuTroId, caNhanId);
    return this.prisma.lienHeKhanCap.findMany({ where: { caNhanId } });
  }
  async createLienHe(
    userId: string,
    caNhanId: string,
    dto: CreateLienHeKhanCapDto,
  ) {
    await this.get(userId, dto.khuTroId, caNhanId);
    await this.authorize(userId, dto.khuTroId, PERMISSIONS.NGUOI_THUE_SUA);
    const khu = await this.khu(dto.khuTroId);
    const { khuTroId, ...data } = dto;
    const row = await this.prisma.lienHeKhanCap.create({
      data: { caNhanId, ...data },
    });
    await this.audit(
      userId,
      khu.toChucId,
      khuTroId,
      'LIEN_HE_KHAN_CAP_TAO',
      'LIEN_HE_KHAN_CAP',
      row.id,
      { caNhanId, hoTen: row.hoTen },
    );
    return row;
  }
  async updateLienHe(
    userId: string,
    caNhanId: string,
    id: string,
    dto: UpdateLienHeKhanCapDto,
  ) {
    if (!dto.khuTroId) throw new ConflictException('Thiếu khuTroId');
    await this.get(userId, dto.khuTroId, caNhanId);
    await this.authorize(userId, dto.khuTroId, PERMISSIONS.NGUOI_THUE_SUA);
    const old = await this.prisma.lienHeKhanCap.findFirst({
      where: { id, caNhanId },
    });
    if (!old) throw new NotFoundException('Không tìm thấy liên hệ khẩn cấp');
    const khu = await this.khu(dto.khuTroId);
    const { khuTroId, ...data } = dto;
    const row = await this.prisma.lienHeKhanCap.update({ where: { id }, data });
    await this.audit(
      userId,
      khu.toChucId,
      khuTroId,
      'LIEN_HE_KHAN_CAP_SUA',
      'LIEN_HE_KHAN_CAP',
      id,
      { caNhanId, hoTen: row.hoTen },
      { caNhanId, hoTen: old.hoTen },
    );
    return row;
  }

  private relevance(khuTroId: string): Prisma.CaNhanWhereInput {
    return {
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
        { hoSoCuTrus: { some: { khuTroId } } },
        { khachLuuTrus: { some: { khuTroId } } },
        { nguoiDuocTham: { some: { khuTroId } } },
      ],
    };
  }
  private async authorize(
    userId: string,
    khuTroId: string,
    permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS],
  ) {
    if (
      !(await this.permissions.hasPermissions(userId, 'KHU_TRO', khuTroId, [
        permission,
      ]))
    )
      throw new ForbiddenException('Bạn không có quyền truy cập cá nhân này');
  }
  private async khu(id: string) {
    const row = await this.prisma.khuTro.findFirst({
      where: { id, deletedAt: null },
      select: { toChucId: true },
    });
    if (!row) throw new NotFoundException('Không tìm thấy khu trọ');
    return row;
  }
  private validatePeriod(start?: string, end?: string) {
    if (start && end && parseDateOnly(end) < parseDateOnly(start))
      throw new ConflictException('Khoảng thời gian địa chỉ không hợp lệ');
  }
  private publicCaNhan(row: {
    maCaNhan: string;
    hoTen: string;
    ngaySinh: Date | null;
    gioiTinh: string | null;
    soDienThoai: string | null;
    email: string | null;
    ngheNghiep: string | null;
    noiLamViec: string | null;
    ghiChu: string | null;
  }) {
    return row;
  }
  private uniqueDocument(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new ConflictException('Giấy tờ tùy thân đã tồn tại');
    throw error;
  }
  private audit(
    userId: string,
    toChucId: string,
    khuTroId: string,
    action: string,
    type: string,
    id: string,
    after: object,
    before?: object,
  ) {
    return this.prisma.$transaction(async (tx) =>
      this.auditTx(
        tx,
        userId,
        toChucId,
        khuTroId,
        action,
        type,
        id,
        after,
        before,
      ),
    );
  }
  private async auditTx(
    tx: Prisma.TransactionClient,
    userId: string,
    toChucId: string,
    khuTroId: string,
    action: string,
    type: string,
    id: string,
    after: object,
    before?: object,
  ) {
    await tx.nhatKyHeThong.create({
      data: {
        taiKhoanId: userId,
        toChucId,
        khuTroId,
        hanhDong: action,
        loaiDoiTuong: type,
        doiTuongId: id,
        duLieuSau: this.json(after),
        ...(before ? { duLieuTruoc: this.json(before) } : {}),
      },
    });
    if (type === 'CA_NHAN' && action === 'CA_NHAN_TAO')
      await tx.nhatKyTruyCapDuLieu.create({
        data: {
          taiKhoanId: userId,
          caNhanId: id,
          loaiDuLieu: `KHU_TRO:${khuTroId}`,
          hanhDong: 'CA_NHAN_TAO',
        },
      });
  }
  private json(value: object): Prisma.InputJsonValue {
    return JSON.parse(
      JSON.stringify(value, (_key, item: unknown) =>
        typeof item === 'bigint' ? item.toString() : item,
      ),
    ) as Prisma.InputJsonValue;
  }
}
