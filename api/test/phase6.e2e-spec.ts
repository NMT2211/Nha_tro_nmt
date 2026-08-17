/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { bearer, registerAndLogin } from './helpers/auth.helper';
import { createE2eApp } from './helpers/e2e-app';
import { email, password, runId } from './helpers/fixtures';

describe('Phase 6 residence runtime E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let khuTroId: string;
  let phongId: string;
  let hopDongId: string;
  let caNhanId: string;
  let hoSoId: string;
  let otherToken: string;
  let otherKhuTroId: string;
  let otherPhongId: string;
  let unrelatedCaNhanId: string;
  let exportOnlyToken: string;
  let cccdOnlyToken: string;
  const data = <T>(response: { body: unknown }): T =>
    (response.body as { data: T }).data;
  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    token = (
      await registerAndLogin(app, {
        hoTen: 'Chủ trọ P6',
        email: email('owner-p6'),
        matKhau: password,
      })
    ).accessToken;
    const auth = () => bearer(token);
    const toChuc = await request(app.getHttpServer())
      .post('/api/to-chuc')
      .set(auth())
      .send({ tenToChuc: `Tổ chức P6 ${runId}` })
      .expect(201);
    const khu = await request(app.getHttpServer())
      .post('/api/khu-tro')
      .set(auth())
      .send({
        toChucId: data<{ id: string }>(toChuc).id,
        tenKhu: `Khu trọ P6 ${runId}`,
        diaChiDayDu: '1 Đường thử nghiệm',
      })
      .expect(201);
    khuTroId = data<{ id: string }>(khu).id;
    const phong = await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/phong`)
      .set(auth())
      .send({ maPhong: `P6-${runId}`, tenPhong: 'Phòng P6' })
      .expect(201);
    phongId = data<{ id: string }>(phong).id;
    await request(app.getHttpServer())
      .post(`/api/phong/${phongId}/chinh-sach-gia`)
      .set(auth())
      .send({ giaCoBan: '3000000', tuNgay: '2026-01-01' })
      .expect(201);
    const person = await request(app.getHttpServer())
      .post('/api/ca-nhan')
      .set(auth())
      .send({
        khuTroId,
        hoTen: 'Nguyễn P6',
        ngaySinh: '1990-01-01',
        gioiTinh: 'NAM',
      })
      .expect(201);
    caNhanId = data<{ id: string }>(person).id;
    await request(app.getHttpServer())
      .post(`/api/ca-nhan/${caNhanId}/dia-chi`)
      .set(auth())
      .send({
        khuTroId,
        loaiDiaChi: 'NOI_O_HIEN_TAI',
        diaChiDayDu: '2 Đường hiện tại',
        laHienTai: true,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/ca-nhan/${caNhanId}/giay-to`)
      .set(auth())
      .send({
        khuTroId,
        loaiGiayTo: 'CCCD',
        soGiayTo: `P6${Date.now()}`,
        laGiayToChinh: true,
      })
      .expect(201);
    const hop = await prisma.hopDong.create({
      data: {
        khuTroId,
        phongId,
        maHopDong: `HD-P6-${runId}`,
        ngayBatDau: new Date('2026-01-01Z'),
        giaThueThoaThuan: 3000000n,
      },
    });
    hopDongId = hop.id;
    await prisma.thanhVienHopDong.create({
      data: {
        hopDongId,
        caNhanId,
        vaiTro: 'NGUOI_DAI_DIEN',
        laDaiDien: true,
        ngayBatDauO: new Date('2026-01-01Z'),
      },
    });
    otherToken = (
      await registerAndLogin(app, {
        hoTen: 'Chủ trọ khác P6',
        email: email('owner-p6-other'),
        matKhau: password,
      })
    ).accessToken;
    const otherOrg = await request(app.getHttpServer())
      .post('/api/to-chuc')
      .set(bearer(otherToken))
      .send({ tenToChuc: `Tổ chức khác P6 ${runId}` })
      .expect(201);
    const otherKhu = await request(app.getHttpServer())
      .post('/api/khu-tro')
      .set(bearer(otherToken))
      .send({
        toChucId: data<{ id: string }>(otherOrg).id,
        tenKhu: `Khu khác P6 ${runId}`,
      })
      .expect(201);
    otherKhuTroId = data<{ id: string }>(otherKhu).id;
    const otherPhong = await request(app.getHttpServer())
      .post(`/api/khu-tro/${otherKhuTroId}/phong`)
      .set(bearer(otherToken))
      .send({ maPhong: `PX-${runId}`, tenPhong: 'Phòng khác' })
      .expect(201);
    otherPhongId = data<{ id: string }>(otherPhong).id;
    const unrelated = await request(app.getHttpServer())
      .post('/api/ca-nhan')
      .set(bearer(otherToken))
      .send({ khuTroId: otherKhuTroId, hoTen: 'Người không liên quan P6' })
      .expect(201);
    unrelatedCaNhanId = data<{ id: string }>(unrelated).id;
    const toChucId = data<{ id: string }>(toChuc).id;
    const makeRestricted = async (
      label: string,
      permission: 'CU_TRU_XUAT_DU_LIEU' | 'CCCD_XEM',
    ) => {
      const accountEmail = email(label);
      const restricted = await registerAndLogin(app, {
        hoTen: label,
        email: accountEmail,
        matKhau: password,
      });
      const account = await prisma.taiKhoan.findUniqueOrThrow({
        where: { email: accountEmail.toLowerCase() },
      });
      const quyen = await prisma.quyen.findUniqueOrThrow({
        where: { maQuyen: permission },
      });
      const role = await prisma.vaiTro.create({
        data: {
          toChucId,
          maVaiTro: `${label}-${runId}`,
          tenVaiTro: label,
          vaiTroQuyens: { create: { quyenId: quyen.id } },
        },
      });
      await prisma.thanhVienKhuTro.create({
        data: { khuTroId, taiKhoanId: account.id, vaiTroId: role.id },
      });
      return restricted.accessToken;
    };
    exportOnlyToken = await makeRestricted(
      'P6_EXPORT_ONLY',
      'CU_TRU_XUAT_DU_LIEU',
    );
    cccdOnlyToken = await makeRestricted('P6_CCCD_ONLY', 'CCCD_XEM');
  });
  afterAll(async () => app?.close());
  it('HoSo: validates KhuTro/Phong/HopDong/CaNhan scope, list/detail, IDOR, and shortcut rejection', async () => {
    await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/ho-so-cu-tru`)
      .set(bearer(token))
      .send({
        phongId: otherPhongId,
        hopDongId,
        caNhanId,
        loaiHoSo: 'DANG_KY_TAM_TRU',
        tuNgay: '2026-01-01',
      })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/khu-tro/${otherKhuTroId}/ho-so-cu-tru`)
      .set(bearer(otherToken))
      .send({
        phongId: otherPhongId,
        hopDongId,
        caNhanId: unrelatedCaNhanId,
        loaiHoSo: 'DANG_KY_TAM_TRU',
        tuNgay: '2026-01-01',
      })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/ho-so-cu-tru`)
      .set(bearer(token))
      .send({
        phongId,
        hopDongId,
        caNhanId: unrelatedCaNhanId,
        loaiHoSo: 'DANG_KY_TAM_TRU',
        tuNgay: '2026-01-01',
      })
      .expect(409);
    const created = await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/ho-so-cu-tru`)
      .set(bearer(token))
      .send({
        phongId,
        hopDongId,
        caNhanId,
        loaiHoSo: 'DANG_KY_TAM_TRU',
        tuNgay: '2026-01-01',
      })
      .expect(201);
    hoSoId = data<{ id: string }>(created).id;
    const list = await request(app.getHttpServer())
      .get(
        `/api/khu-tro/${khuTroId}/ho-so-cu-tru?loaiHoSo=DANG_KY_TAM_TRU&phongId=${phongId}`,
      )
      .set(bearer(token))
      .expect(200);
    expect(
      data<{ items: Array<{ id: string }> }>(list).items.some(
        (item) => item.id === hoSoId,
      ),
    ).toBe(true);
    await request(app.getHttpServer())
      .get(`/api/ho-so-cu-tru/${hoSoId}`)
      .set(bearer(token))
      .expect(200);
    await request(app.getHttpServer())
      .get(`/api/ho-so-cu-tru/${hoSoId}`)
      .set(bearer(otherToken))
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/ho-so-cu-tru/${hoSoId}/duyet`)
      .set(bearer(token))
      .send({})
      .expect(409);
  });
  it('HoSo: writes exact transactional append-only history and restricts post-submission edits', async () => {
    const beforeFailed = await prisma.lichSuHoSoCuTru.count({
      where: { hoSoCuTruId: hoSoId },
    });
    await request(app.getHttpServer())
      .post(`/api/ho-so-cu-tru/${hoSoId}/duyet`)
      .set(bearer(token))
      .send({})
      .expect(409);
    expect(
      await prisma.lichSuHoSoCuTru.count({ where: { hoSoCuTruId: hoSoId } }),
    ).toBe(beforeFailed);
    for (const action of [
      'hoan-thien',
      'cho-gui',
      'danh-dau-da-gui',
      'tiep-nhan',
      'duyet',
    ])
      await request(app.getHttpServer())
        .post(`/api/ho-so-cu-tru/${hoSoId}/${action}`)
        .set(bearer(token))
        .send({})
        .expect(201);
    const history = await request(app.getHttpServer())
      .get(`/api/ho-so-cu-tru/${hoSoId}/lich-su`)
      .set(bearer(token))
      .expect(200);
    expect(data<unknown[]>(history)).toHaveLength(6);
    const rows = await prisma.lichSuHoSoCuTru.findMany({
      where: { hoSoCuTruId: hoSoId },
      orderBy: { createdAt: 'asc' },
    });
    const actor = await prisma.taiKhoan.findUniqueOrThrow({
      where: { email: email('owner-p6') },
    });
    expect(rows[1]).toMatchObject({
      trangThaiCu: 'CHUA_TAO',
      trangThaiMoi: 'DA_TAO',
      nguoiThucHienId: actor.id,
    });
    expect(
      (await prisma.hoSoCuTru.findUniqueOrThrow({ where: { id: hoSoId } }))
        .trangThai,
    ).toBe('DA_DUYET');
    await request(app.getHttpServer())
      .patch(`/api/ho-so-cu-tru/${hoSoId}`)
      .set(bearer(token))
      .send({ ghiChu: 'Không được sửa' })
      .expect(409);
  });
  it('Identity/CT01: keeps normal API masked, enforces both permissions, audits access, and leaks no plaintext into audit', async () => {
    const masked = await request(app.getHttpServer())
      .get(`/api/ca-nhan/${caNhanId}/giay-to?khuTroId=${khuTroId}`)
      .set(bearer(token))
      .expect(200);
    expect(data<Array<{ soGiayTo: string }>>(masked)[0].soGiayTo).toBe(
      '[ĐÃ MÃ HÓA]',
    );
    await request(app.getHttpServer())
      .get(`/api/ho-so-cu-tru/${hoSoId}/ct01-data`)
      .set(bearer(exportOnlyToken))
      .expect(403);
    await request(app.getHttpServer())
      .get(`/api/ho-so-cu-tru/${hoSoId}/ct01-data`)
      .set(bearer(cccdOnlyToken))
      .expect(403);
    await request(app.getHttpServer())
      .get(`/api/ho-so-cu-tru/${hoSoId}/ct01-data`)
      .set(bearer(otherToken))
      .expect(403);
    const response = await request(app.getHttpServer())
      .get(`/api/ho-so-cu-tru/${hoSoId}/ct01-data`)
      .set(bearer(token))
      .expect(200);
    expect(data<{ tenDuLieu: string }>(response).tenDuLieu).toBe(
      'Dữ liệu chuẩn bị CT01',
    );
    expect(data<{ isReady: boolean }>(response).isReady).toBe(true);
    const actor = await prisma.taiKhoan.findUniqueOrThrow({
      where: { email: email('owner-p6') },
    });
    const access = await prisma.nhatKyTruyCapDuLieu.findFirstOrThrow({
      where: { caNhanId, taiKhoanId: actor.id, hanhDong: 'GIAI_MA_CHO_CT01' },
    });
    expect(access.loaiDuLieu).toBe('SO_GIAY_TO_CT01_PREPARATION');
    const plaintext = data<{ caNhan: { giayTo: { soGiayTo: string } } }>(
      response,
    ).caNhan.giayTo.soGiayTo;
    const systemAudits = await prisma.nhatKyHeThong.findMany({
      where: { khuTroId },
    });
    expect(JSON.stringify([...systemAudits, access])).not.toContain(plaintext);
  });
  it('CT01 readiness: reports missing primary document/address without invented placeholders', async () => {
    const makePerson = async (label: string) =>
      data<{ id: string }>(
        await request(app.getHttpServer())
          .post('/api/ca-nhan')
          .set(bearer(token))
          .send({
            khuTroId,
            hoTen: label,
            ngaySinh: '1991-01-01',
            gioiTinh: 'NU',
          })
          .expect(201),
      ).id;
    const noDoc = await makePerson('Thiếu giấy tờ P6');
    await prisma.thanhVienHopDong.create({
      data: {
        hopDongId,
        caNhanId: noDoc,
        vaiTro: 'NGUOI_CUNG_O',
        ngayBatDauO: new Date('2026-01-01Z'),
      },
    });
    await request(app.getHttpServer())
      .post(`/api/ca-nhan/${noDoc}/dia-chi`)
      .set(bearer(token))
      .send({
        khuTroId,
        loaiDiaChi: 'THUONG_TRU',
        diaChiDayDu: 'Địa chỉ có thật',
      })
      .expect(201);
    const noDocHs = data<{ id: string }>(
      await request(app.getHttpServer())
        .post(`/api/khu-tro/${khuTroId}/ho-so-cu-tru`)
        .set(bearer(token))
        .send({
          phongId,
          hopDongId,
          caNhanId: noDoc,
          loaiHoSo: 'DANG_KY_TAM_TRU',
          tuNgay: '2026-01-01',
        })
        .expect(201),
    ).id;
    const noDocPayload = data<{ isReady: boolean; missingFields: string[] }>(
      await request(app.getHttpServer())
        .get(`/api/ho-so-cu-tru/${noDocHs}/ct01-data`)
        .set(bearer(token))
        .expect(200),
    );
    expect(noDocPayload.isReady).toBe(false);
    expect(noDocPayload.missingFields).toContain('primaryIdentityDocument');
    const noAddress = await makePerson('Thiếu địa chỉ P6');
    await prisma.thanhVienHopDong.create({
      data: {
        hopDongId,
        caNhanId: noAddress,
        vaiTro: 'NGUOI_CUNG_O',
        ngayBatDauO: new Date('2026-01-01Z'),
      },
    });
    await request(app.getHttpServer())
      .post(`/api/ca-nhan/${noAddress}/giay-to`)
      .set(bearer(token))
      .send({
        khuTroId,
        loaiGiayTo: 'CCCD',
        soGiayTo: `NA${Date.now()}`,
        laGiayToChinh: true,
      })
      .expect(201);
    const noAddressHs = data<{ id: string }>(
      await request(app.getHttpServer())
        .post(`/api/khu-tro/${khuTroId}/ho-so-cu-tru`)
        .set(bearer(token))
        .send({
          phongId,
          hopDongId,
          caNhanId: noAddress,
          loaiHoSo: 'DANG_KY_TAM_TRU',
          tuNgay: '2026-01-01',
        })
        .expect(201),
    ).id;
    const noAddressPayload = data<{
      isReady: boolean;
      missingFields: string[];
    }>(
      await request(app.getHttpServer())
        .get(`/api/ho-so-cu-tru/${noAddressHs}/ct01-data`)
        .set(bearer(token))
        .expect(200),
    );
    expect(noAddressPayload.isReady).toBe(false);
    expect(noAddressPayload.missingFields).toContain('relevantAddress');
  });
  it('Export: stays KhuTro-scoped, bounded/filterable, and excludes plaintext/ciphertext/hash', async () => {
    const response = await request(app.getHttpServer())
      .get(
        `/api/khu-tro/${khuTroId}/cu-tru/export?limit=1&loaiHoSo=DANG_KY_TAM_TRU`,
      )
      .set(bearer(exportOnlyToken))
      .expect(200);
    const payload = data<{
      includesPlaintextIdentity: boolean;
      items: Array<{ khuTroId: string }>;
    }>(response);
    expect(payload.includesPlaintextIdentity).toBe(false);
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].khuTroId).toBe(khuTroId);
    expect(JSON.stringify(payload)).not.toMatch(
      /soGiayTo|soGiayToMaHoa|soGiayToHash/,
    );
    await request(app.getHttpServer())
      .get(`/api/khu-tro/${khuTroId}/cu-tru/export`)
      .set(bearer(otherToken))
      .expect(403);
  });
  it('KhachLuuTru: validates scope/dates, snapshots free days, calculates exact duration, audits cancel, and enforces IDOR/relevance', async () => {
    await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/khach-luu-tru`)
      .set(bearer(token))
      .send({
        phongId: otherPhongId,
        caNhanId,
        thoiGianDen: '2026-02-01T00:00:00Z',
      })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/khach-luu-tru`)
      .set(bearer(token))
      .send({
        phongId,
        caNhanId,
        thoiGianDen: '2026-02-02T00:00:00Z',
        thoiGianDiDuKien: '2026-02-01T00:00:00Z',
      })
      .expect(409);
    const guest = await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/khach-luu-tru`)
      .set(bearer(token))
      .send({
        phongId,
        caNhanId,
        thoiGianDen: '2026-02-01T00:00:00.000Z',
        thoiGianDiDuKien: '2026-02-09T00:00:01.000Z',
      })
      .expect(201);
    const id = data<{ id: string }>(guest).id;
    const snapshot = (
      await prisma.khachLuuTru.findUniqueOrThrow({ where: { id } })
    ).soNgayMienPhiApDung;
    await request(app.getHttpServer())
      .patch(`/api/khu-tro/${khuTroId}/cau-hinh`)
      .set(bearer(token))
      .send({ soNgayKhachMienPhi: snapshot + 3 })
      .expect(200);
    expect(
      (await prisma.khachLuuTru.findUniqueOrThrow({ where: { id } }))
        .soNgayMienPhiApDung,
    ).toBe(snapshot);
    await request(app.getHttpServer())
      .get(`/api/khach-luu-tru/${id}`)
      .set(bearer(otherToken))
      .expect(403);
    const departed = await request(app.getHttpServer())
      .post(`/api/khach-luu-tru/${id}/roi-di`)
      .set(bearer(token))
      .send({ thoiGianDiThucTe: '2026-02-09T00:00:01.000Z' })
      .expect(201);
    expect(data<{ soNgayLuuTru: number }>(departed).soNgayLuuTru).toBe(9);
    expect(data<{ soNgayTinhPhi: number }>(departed).soNgayTinhPhi).toBe(
      Math.max(0, 9 - snapshot),
    );
    expect(data<{ phuThuPhatSinh: string }>(departed).phuThuPhatSinh).toBe('0');
    const cancel = await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/khach-luu-tru`)
      .set(bearer(token))
      .send({ phongId, caNhanId, thoiGianDen: '2026-04-01T00:00:00Z' })
      .expect(201);
    const cancelId = data<{ id: string }>(cancel).id;
    await request(app.getHttpServer())
      .post(`/api/khach-luu-tru/${cancelId}/huy`)
      .set(bearer(token))
      .expect(201);
    expect(
      await prisma.nhatKyHeThong.count({
        where: { doiTuongId: cancelId, hanhDong: 'KHACH_LUU_TRU_HUY' },
      }),
    ).toBe(1);
    await request(app.getHttpServer())
      .get(`/api/ca-nhan/${caNhanId}?khuTroId=${otherKhuTroId}`)
      .set(bearer(otherToken))
      .expect(404);
  });
  it('TamVang: validates membership/dates, overlap, return/cancel, repeated return, and IDOR', async () => {
    await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/tam-vang`)
      .set(bearer(token))
      .send({ caNhanId: unrelatedCaNhanId, tuNgay: '2026-03-01' })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/tam-vang`)
      .set(bearer(token))
      .send({ caNhanId, tuNgay: '2026-03-05', denNgayDuKien: '2026-03-01' })
      .expect(409);
    const created = await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/tam-vang`)
      .set(bearer(token))
      .send({ caNhanId, tuNgay: '2026-03-01', denNgayDuKien: '2026-03-05' })
      .expect(201);
    const id = data<{ id: string }>(created).id;
    await request(app.getHttpServer())
      .get(`/api/tam-vang/${id}`)
      .set(bearer(otherToken))
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/tam-vang`)
      .set(bearer(token))
      .send({ caNhanId, tuNgay: '2026-03-03' })
      .expect(409);
    const returned = await request(app.getHttpServer())
      .post(`/api/tam-vang/${id}/quay-lai`)
      .set(bearer(token))
      .send({ denNgayThucTe: '2026-03-04' })
      .expect(201);
    expect(data<{ trangThai: string }>(returned).trangThai).toBe('DA_QUAY_LAI');
    expect(
      data<{ denNgayThucTe: string }>(returned).denNgayThucTe.slice(0, 10),
    ).toBe('2026-03-04');
    await request(app.getHttpServer())
      .post(`/api/tam-vang/${id}/quay-lai`)
      .set(bearer(token))
      .send({ denNgayThucTe: '2026-03-04' })
      .expect(409);
    const cancellable = await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/tam-vang`)
      .set(bearer(token))
      .send({ caNhanId, tuNgay: '2026-04-01' })
      .expect(201);
    const cancelId = data<{ id: string }>(cancellable).id;
    await request(app.getHttpServer())
      .post(`/api/tam-vang/${cancelId}/huy`)
      .set(bearer(token))
      .expect(201);
    expect(
      (await prisma.tamVang.findUniqueOrThrow({ where: { id: cancelId } }))
        .trangThai,
    ).toBe('DA_HUY');
  });
  it('TamVang concurrency: serializes overlapping creates so exactly one active row persists', async () => {
    const path = `/api/hop-dong/${hopDongId}/tam-vang`;
    const first = {
      caNhanId,
      tuNgay: '2026-05-01',
      denNgayDuKien: '2026-05-10',
    };
    const second = {
      caNhanId,
      tuNgay: '2026-05-05',
      denNgayDuKien: '2026-05-12',
    };
    const results = await Promise.all([
      request(app.getHttpServer()).post(path).set(bearer(token)).send(first),
      request(app.getHttpServer()).post(path).set(bearer(token)).send(second),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(
      await prisma.tamVang.count({
        where: {
          hopDongId,
          caNhanId,
          trangThai: 'DANG_TAM_VANG',
          tuNgay: { lte: new Date('2026-05-12Z') },
          OR: [
            { denNgayDuKien: null },
            { denNgayDuKien: { gte: new Date('2026-05-01Z') } },
          ],
        },
      }),
    ).toBe(1);
  });
});
