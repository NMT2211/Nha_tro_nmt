/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import type { INestApplication } from '@nestjs/common';
import {
  LoaiDiaChi,
  LoaiGiaoDichCoc,
  LoaiGiayTo,
  LoaiKhoiNha,
  PhuongThucThanhToan,
  QuyTacTinhNgayLe,
  TrangThaiHopDong,
  TrangThaiPhong,
  TrangThaiTraPhong,
  VaiTroThanhVienHopDong,
  XuLyBaoTre,
} from '../generated/prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { bearer, registerAndLogin } from './helpers/auth.helper';
import { createE2eApp } from './helpers/e2e-app';
import { email, password, phone, runId } from './helpers/fixtures';

describe('Phase 3 runtime E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ownerToken: string;
  let toChucId: string;
  let khuTroId: string;
  let khoiNhaId: string;
  let tangId: string;
  let phongId: string;
  let pricePolicyId: string;
  let caNhanAId: string;
  let caNhanBId: string;
  let hopDongId: string;
  let checkoutId: string;

  const auth = () => bearer(ownerToken);
  const data = <T>(response: { body: unknown }): T =>
    (response.body as { data: T }).data;

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('Auth flow: register, login, me, refresh and logout', async () => {
    const credentials = {
      hoTen: 'Chủ trọ E2E',
      email: email('owner'),
      soDienThoai: phone(1),
      matKhau: password,
    };
    const tokens = await registerAndLogin(app, credentials);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(bearer(tokens.accessToken))
      .expect(200);
    const refreshed = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: tokens.refreshToken })
      .expect(200);
    const refreshedTokens = data<{ accessToken: string; refreshToken: string }>(
      refreshed,
    );
    ownerToken = refreshedTokens.accessToken;
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set(auth())
      .expect(200);
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: credentials.email, matKhau: credentials.matKhau })
      .expect(200);
    ownerToken = data<{ accessToken: string }>(login).accessToken;
  });

  it('KhuTro setup: creates ToChuc, KhuTro, KhoiNha, Tang, Phong and pricing', async () => {
    const toChuc = await request(app.getHttpServer())
      .post('/api/to-chuc')
      .set(auth())
      .send({ tenToChuc: `Tổ chức ${runId}` })
      .expect(201);
    toChucId = data<{ id: string }>(toChuc).id;
    const khuTro = await request(app.getHttpServer())
      .post('/api/khu-tro')
      .set(auth())
      .send({ toChucId, tenKhu: `Khu trọ ${runId}` })
      .expect(201);
    khuTroId = data<{ id: string }>(khuTro).id;
    await request(app.getHttpServer())
      .patch(`/api/khu-tro/${khuTroId}/cau-hinh`)
      .set(auth())
      .send({
        ngayThuTien: 8,
        soNgayBaoTraPhong: 7,
        xuLyBaoTre: XuLyBaoTre.MAT_TOAN_BO_COC,
      })
      .expect(200);
    const khoi = await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/khoi-nha`)
      .set(auth())
      .send({
        maKhoi: `K-${runId}`,
        tenKhoi: 'Khối E2E',
        loaiKhoi: LoaiKhoiNha.DAY_TRO,
      })
      .expect(201);
    khoiNhaId = data<{ id: string }>(khoi).id;
    const tang = await request(app.getHttpServer())
      .post(`/api/khoi-nha/${khoiNhaId}/tang`)
      .set(auth())
      .send({ maTang: `T-${runId}`, tenTang: 'Tầng E2E', soTang: 1 })
      .expect(201);
    tangId = data<{ id: string }>(tang).id;
    const phong = await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/phong`)
      .set(auth())
      .send({
        khoiNhaId,
        tangId,
        maPhong: `P-${runId}`,
        tenPhong: 'Phòng E2E',
        soNguoiToiDa: 2,
      })
      .expect(201);
    phongId = data<{ id: string }>(phong).id;
    const policy = await request(app.getHttpServer())
      .post(`/api/phong/${phongId}/chinh-sach-gia`)
      .set(auth())
      .send({
        giaCoBan: '3000001',
        soNguoiBaoGom: 1,
        giaThemMoiNguoi: '250001',
        soNguoiToiDa: 2,
        tuNgay: '2026-01-01',
      })
      .expect(201);
    pricePolicyId = data<{ id: string }>(policy).id;
  });

  it('CaNhan flow: creates people, address and emergency contact', async () => {
    const personA = await request(app.getHttpServer())
      .post('/api/ca-nhan')
      .set(auth())
      .send({ khuTroId, hoTen: 'Nguyễn E2E A', soDienThoai: phone(2) })
      .expect(201);
    caNhanAId = data<{ id: string }>(personA).id;
    await request(app.getHttpServer())
      .post(`/api/ca-nhan/${caNhanAId}/dia-chi`)
      .set(auth())
      .send({
        khuTroId,
        loaiDiaChi: LoaiDiaChi.NOI_O_HIEN_TAI,
        diaChiDayDu: '123 Đường E2E',
        laHienTai: true,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/ca-nhan/${caNhanAId}/lien-he-khan-cap`)
      .set(auth())
      .send({
        khuTroId,
        hoTen: 'Người liên hệ E2E',
        soDienThoai: phone(3),
        moiQuanHe: 'Anh trai',
      })
      .expect(201);
    const personB = await request(app.getHttpServer())
      .post('/api/ca-nhan')
      .set(auth())
      .send({ khuTroId, hoTen: 'Nguyễn E2E B', soDienThoai: phone(4) })
      .expect(201);
    caNhanBId = data<{ id: string }>(personB).id;
  });

  it('HopDong snapshot: preserves price and KhuTro config after later pricing changes', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/hop-dong')
      .set(auth())
      .send({
        phongId,
        maHopDong: `HD-${runId}`,
        ngayBatDau: '2026-09-01',
        tienCocThoaThuan: '3000001',
      })
      .expect(201);
    const hopDong = data<Record<string, unknown>>(response);
    hopDongId = hopDong.id as string;
    expect(hopDong).toMatchObject({
      giaThueThoaThuan: '3000001',
      soNguoiBaoGom: 1,
      giaThemMoiNguoi: '250001',
      soNguoiToiDa: 2,
      ngayThuTien: 8,
      quyTacTinhNgayLe: QuyTacTinhNgayLe.THEO_30_NGAY,
      soNgayBaoTruoc: 7,
      xuLyBaoTre: XuLyBaoTre.MAT_TOAN_BO_COC,
    });
    await request(app.getHttpServer())
      .patch(`/api/phong/${phongId}/chinh-sach-gia/${pricePolicyId}`)
      .set(auth())
      .send({
        giaCoBan: '4000001',
        soNguoiBaoGom: 2,
        giaThemMoiNguoi: '350001',
        soNguoiToiDa: 3,
        tuNgay: '2027-01-01',
      })
      .expect(200);
    const unchanged = await request(app.getHttpServer())
      .get(`/api/hop-dong/${hopDongId}`)
      .set(auth())
      .expect(200);
    expect(data<Record<string, unknown>>(unchanged)).toMatchObject({
      giaThueThoaThuan: '3000001',
      soNguoiBaoGom: 1,
      giaThemMoiNguoi: '250001',
      soNguoiToiDa: 2,
    });
  });

  it('Active contract conflict: rejects another active contract with HTTP 409', async () => {
    await prisma.hopDong.update({
      where: { id: hopDongId },
      data: { trangThai: TrangThaiHopDong.CHO_NHAN_PHONG },
    });
    const conflict = await request(app.getHttpServer())
      .post('/api/hop-dong')
      .set(auth())
      .send({
        phongId,
        maHopDong: `HD-CONFLICT-${runId}`,
        ngayBatDau: '2026-10-01',
      })
      .expect(409);
    expect(conflict.body.message).toContain(
      'Phòng đã có hợp đồng đang hoạt động',
    );
    await prisma.hopDong.update({
      where: { id: hopDongId },
      data: { trangThai: TrangThaiHopDong.NHAP },
    });
    await request(app.getHttpServer())
      .patch(`/api/hop-dong/${hopDongId}`)
      .set(auth())
      .send({ trangThai: TrangThaiHopDong.CHO_NHAN_PHONG })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/kich-hoat`)
      .set(auth())
      .send({})
      .expect(201);
  });

  it('Member duplicate and occupancy: rejects overlap and a third active member', async () => {
    const member = {
      vaiTro: VaiTroThanhVienHopDong.NGUOI_DAI_DIEN,
      laDaiDien: true,
      ngayBatDauO: '2026-09-01',
    };
    await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/thanh-vien`)
      .set(auth())
      .send({ ...member, caNhanId: caNhanAId })
      .expect(201);
    const duplicate = await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/thanh-vien`)
      .set(auth())
      .send({ ...member, caNhanId: caNhanAId })
      .expect(409);
    expect(duplicate.body.message).toContain('đã là thành viên');
    await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/thanh-vien`)
      .set(auth())
      .send({
        caNhanId: caNhanBId,
        vaiTro: VaiTroThanhVienHopDong.NGUOI_CUNG_O,
        ngayBatDauO: '2026-09-02',
      })
      .expect(201);
    const third = await request(app.getHttpServer())
      .post('/api/ca-nhan')
      .set(auth())
      .send({ khuTroId, hoTen: 'Nguyễn E2E C', soDienThoai: phone(5) })
      .expect(201);
    const overCapacity = await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/thanh-vien`)
      .set(auth())
      .send({
        caNhanId: data<{ id: string }>(third).id,
        vaiTro: VaiTroThanhVienHopDong.NGUOI_CUNG_O,
        ngayBatDauO: '2026-09-03',
      })
      .expect(409);
    expect(overCapacity.body.message).toContain('vượt quá giới hạn');
  });

  it('Deposit flow: serializes and calculates exact money values', async () => {
    const transaction = await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/tien-coc`)
      .set(auth())
      .send({
        loaiGiaoDich: LoaiGiaoDichCoc.THU_COC,
        soTien: '3000001',
        ngayGiaoDich: '2026-09-01',
        phuongThuc: PhuongThucThanhToan.CHUYEN_KHOAN,
      })
      .expect(201);
    expect(data<{ soTien: string }>(transaction).soTien).toBe('3000001');
    const summary = await request(app.getHttpServer())
      .get(`/api/hop-dong/${hopDongId}/tien-coc`)
      .set(auth())
      .expect(200);
    expect(
      data<{ summary: Record<string, string> }>(summary).summary,
    ).toMatchObject({
      agreed: '3000001',
      received: '3000001',
      remaining: '3000001',
    });
  });

  it('Checkout on-time: uses configured notice days without a late penalty', async () => {
    const phong = await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/phong`)
      .set(auth())
      .send({
        maPhong: `P-ONTIME-${runId}`,
        tenPhong: 'Phòng on-time',
        soNguoiToiDa: 2,
      })
      .expect(201);
    const onTimePhongId = data<{ id: string }>(phong).id;
    await request(app.getHttpServer())
      .post(`/api/phong/${onTimePhongId}/chinh-sach-gia`)
      .set(auth())
      .send({ giaCoBan: '2000000', tuNgay: '2026-01-01', soNguoiToiDa: 2 })
      .expect(201);
    const hop = await request(app.getHttpServer())
      .post('/api/hop-dong')
      .set(auth())
      .send({
        phongId: onTimePhongId,
        maHopDong: `HD-ONTIME-${runId}`,
        ngayBatDau: '2026-09-01',
      })
      .expect(201);
    const id = data<{ id: string }>(hop).id;
    await request(app.getHttpServer())
      .patch(`/api/hop-dong/${id}`)
      .set(auth())
      .send({ trangThai: TrangThaiHopDong.CHO_NHAN_PHONG })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/hop-dong/${id}/kich-hoat`)
      .set(auth())
      .send({})
      .expect(201);
    const checkout = await request(app.getHttpServer())
      .post(`/api/hop-dong/${id}/yeu-cau-tra-phong`)
      .set(auth())
      .send({ ngayBao: '2026-10-01', ngayDuKienTra: '2026-10-08' })
      .expect(201);
    expect(data<Record<string, unknown>>(checkout)).toMatchObject({
      soNgayBaoTruocThucTe: 7,
      coBaoTre: false,
      hinhThucXuLy: null,
      xuLyDeXuat: null,
    });
  });

  it('Checkout late notice and invalid transition: recommends default, rejects shortcut, then completes valid flow', async () => {
    const checkout = await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/yeu-cau-tra-phong`)
      .set(auth())
      .send({ ngayBao: '2026-10-01', ngayDuKienTra: '2026-10-05' })
      .expect(201);
    const value = data<Record<string, unknown>>(checkout);
    checkoutId = value.id as string;
    expect(value).toMatchObject({
      soNgayBaoTruocThucTe: 4,
      coBaoTre: true,
      hinhThucXuLy: XuLyBaoTre.MAT_TOAN_BO_COC,
      xuLyDeXuat: XuLyBaoTre.MAT_TOAN_BO_COC,
      soTienKhauTruCoc: '0',
    });
    const invalid = await request(app.getHttpServer())
      .patch(`/api/hop-dong/${hopDongId}/yeu-cau-tra-phong/${checkoutId}`)
      .set(auth())
      .send({ trangThai: TrangThaiTraPhong.HOAN_TAT })
      .expect(409);
    expect(invalid.body.message).toContain(
      'Không thể chuyển yêu cầu trả phòng',
    );
    for (const trangThai of [
      TrangThaiTraPhong.DA_XAC_NHAN,
      TrangThaiTraPhong.CHO_QUYET_TOAN,
      TrangThaiTraPhong.HOAN_TAT,
    ]) {
      await request(app.getHttpServer())
        .patch(`/api/hop-dong/${hopDongId}/yeu-cau-tra-phong/${checkoutId}`)
        .set(auth())
        .send({
          trangThai,
          ...(trangThai === TrangThaiTraPhong.HOAN_TAT
            ? { ngayTraThucTe: '2026-10-05' }
            : {}),
        })
        .expect(200);
    }
  });

  it('Room lifecycle: returns to DANG_TRONG and records meaningful history', async () => {
    const room = await request(app.getHttpServer())
      .get(`/api/phong/${phongId}`)
      .set(auth())
      .expect(200);
    expect(data<{ trangThai: TrangThaiPhong }>(room).trangThai).toBe(
      TrangThaiPhong.DANG_TRONG,
    );
    const history = await prisma.lichSuTrangThaiPhong.findMany({
      where: { phongId },
    });
    expect(history.map((row) => row.trangThaiMoi)).toEqual(
      expect.arrayContaining([
        TrangThaiPhong.CHO_NHAN_PHONG,
        TrangThaiPhong.DANG_O,
        TrangThaiPhong.SAP_TRA,
        TrangThaiPhong.DANG_TRONG,
      ]),
    );
  });

  it('Cross-KhuTro IDOR and CaNhan scope: unrelated account receives no data', async () => {
    const otherTokens = await registerAndLogin(app, {
      hoTen: 'Chủ trọ khác',
      email: email('other'),
      soDienThoai: phone(6),
      matKhau: password,
    });
    const otherAuth = bearer(otherTokens.accessToken);
    const otherOrg = await request(app.getHttpServer())
      .post('/api/to-chuc')
      .set(otherAuth)
      .send({ tenToChuc: `Tổ chức khác ${runId}` })
      .expect(201);
    const otherKhu = await request(app.getHttpServer())
      .post('/api/khu-tro')
      .set(otherAuth)
      .send({
        toChucId: data<{ id: string }>(otherOrg).id,
        tenKhu: `Khu khác ${runId}`,
      })
      .expect(201);
    const otherKhuId = data<{ id: string }>(otherKhu).id;
    await request(app.getHttpServer())
      .get(`/api/hop-dong/${hopDongId}`)
      .set(otherAuth)
      .expect(403);
    await request(app.getHttpServer())
      .get(`/api/hop-dong/${hopDongId}/tien-coc`)
      .set(otherAuth)
      .expect(403);
    await request(app.getHttpServer())
      .get(`/api/ca-nhan/${caNhanAId}?khuTroId=${otherKhuId}`)
      .set(otherAuth)
      .expect(404);
  });

  const identityTest = process.env.IDENTITY_DATA_KEY ? it : it.skip;
  identityTest(
    'Sensitive identity: encrypts storage and excludes internals from API list',
    async () => {
      const rawNumber = `079${Date.now()}`;
      const created = await request(app.getHttpServer())
        .post(`/api/ca-nhan/${caNhanAId}/giay-to`)
        .set(auth())
        .send({
          khuTroId,
          loaiGiayTo: LoaiGiayTo.CCCD,
          soGiayTo: rawNumber,
          laGiayToChinh: true,
        })
        .expect(201);
      const createdBody = data<Record<string, unknown>>(created);
      expect(JSON.stringify(created.body)).not.toContain(rawNumber);
      expect(createdBody).not.toHaveProperty('soGiayToMaHoa');
      expect(createdBody).not.toHaveProperty('soGiayToHash');
      const stored = await prisma.giayToTuyThan.findUniqueOrThrow({
        where: { id: createdBody.id as string },
      });
      expect(stored.soGiayToMaHoa).not.toBe(rawNumber);
      expect(stored.soGiayToHash).not.toBe(rawNumber);
      const list = await request(app.getHttpServer())
        .get(`/api/ca-nhan/${caNhanAId}/giay-to?khuTroId=${khuTroId}`)
        .set(auth())
        .expect(200);
      expect(JSON.stringify(list.body)).not.toContain(rawNumber);
      expect(JSON.stringify(list.body)).not.toContain(stored.soGiayToMaHoa);
      expect(JSON.stringify(list.body)).not.toContain(stored.soGiayToHash);
    },
  );
});
