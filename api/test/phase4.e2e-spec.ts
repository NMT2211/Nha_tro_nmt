/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { INestApplication } from '@nestjs/common';
import {
  KieuTinhDichVu,
  LoaiDichVu,
  LoaiCongTo,
  TrangThaiChiSo,
  VaiTroThanhVienHopDong,
} from '../generated/prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { bearer, registerAndLogin } from './helpers/auth.helper';
import { createE2eApp } from './helpers/e2e-app';
import { email, password, phone, runId } from './helpers/fixtures';

describe('Phase 4 runtime E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let otherToken: string;
  let khuTroId: string;
  let otherKhuTroId: string;
  let phongId: string;
  let otherPhongId: string;
  let hopDongId: string;
  let fixedDichVuId: string;
  let fixedV1Id: string;
  let fixedV2Id: string;
  let personDichVuId: string;
  let personPolicyId: string;
  let meterId: string;
  let adjustmentMeterId: string;
  let firstReadingId: string;
  const auth = () => bearer(token);
  const otherAuth = () => bearer(otherToken);
  const data = <T>(response: { body: unknown }): T =>
    (response.body as { data: T }).data;

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    token = (
      await registerAndLogin(app, {
        hoTen: 'Chủ trọ Phase 4',
        email: email('p4-owner'),
        soDienThoai: phone(20),
        matKhau: password,
      })
    ).accessToken;
    otherToken = (
      await registerAndLogin(app, {
        hoTen: 'Chủ trọ Phase 4 khác',
        email: email('p4-other'),
        soDienThoai: phone(21),
        matKhau: password,
      })
    ).accessToken;
    const createScope = async (
      authorization: ReturnType<typeof bearer>,
      suffix: string,
    ) => {
      const org = await request(app.getHttpServer())
        .post('/api/to-chuc')
        .set(authorization)
        .send({ tenToChuc: `Tổ chức ${suffix} ${runId}` })
        .expect(201);
      const khu = await request(app.getHttpServer())
        .post('/api/khu-tro')
        .set(authorization)
        .send({
          toChucId: data<{ id: string }>(org).id,
          tenKhu: `Khu ${suffix} ${runId}`,
        })
        .expect(201);
      const khuId = data<{ id: string }>(khu).id;
      const phong = await request(app.getHttpServer())
        .post(`/api/khu-tro/${khuId}/phong`)
        .set(authorization)
        .send({
          maPhong: `P-${suffix}-${runId}`,
          tenPhong: `Phòng ${suffix}`,
          soNguoiToiDa: 3,
        })
        .expect(201);
      return { khuTroId: khuId, phongId: data<{ id: string }>(phong).id };
    };
    ({ khuTroId, phongId } = await createScope(auth(), 'A'));
    ({ khuTroId: otherKhuTroId, phongId: otherPhongId } = await createScope(
      otherAuth(),
      'B',
    ));
    await request(app.getHttpServer())
      .patch(`/api/khu-tro/${khuTroId}/cau-hinh`)
      .set(auth())
      .send({ ngayChotChiSoTu: 5, ngayChotChiSoDen: 10 })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/phong/${phongId}/chinh-sach-gia`)
      .set(auth())
      .send({ giaCoBan: '3000000', soNguoiToiDa: 3, tuNgay: '2026-09-01' })
      .expect(201);
    const hop = await request(app.getHttpServer())
      .post('/api/hop-dong')
      .set(auth())
      .send({ phongId, maHopDong: `HD-P4-${runId}`, ngayBatDau: '2026-09-01' })
      .expect(201);
    hopDongId = data<{ id: string }>(hop).id;
    const personA = await request(app.getHttpServer())
      .post('/api/ca-nhan')
      .set(auth())
      .send({ khuTroId, hoTen: 'Thành viên đủ kỳ', soDienThoai: phone(22) })
      .expect(201);
    const personB = await request(app.getHttpServer())
      .post('/api/ca-nhan')
      .set(auth())
      .send({ khuTroId, hoTen: 'Thành viên mười ngày', soDienThoai: phone(23) })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/thanh-vien`)
      .set(auth())
      .send({
        caNhanId: data<{ id: string }>(personA).id,
        vaiTro: VaiTroThanhVienHopDong.NGUOI_DAI_DIEN,
        ngayBatDauO: '2026-09-01',
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/thanh-vien`)
      .set(auth())
      .send({
        caNhanId: data<{ id: string }>(personB).id,
        vaiTro: VaiTroThanhVienHopDong.NGUOI_CUNG_O,
        ngayBatDauO: '2026-09-21',
        ngayKetThucO: '2026-09-30',
      })
      .expect(201);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('creates DichVu and rejects duplicate maDichVu in one KhuTro', async () => {
    const body = {
      maDichVu: `FIXED-${runId}`,
      tenDichVu: 'Internet',
      loaiDichVu: LoaiDichVu.WIFI,
      donVi: 'phòng',
    };
    const created = await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/dich-vu`)
      .set(auth())
      .send(body)
      .expect(201);
    fixedDichVuId = data<{ id: string }>(created).id;
    await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/dich-vu`)
      .set(auth())
      .send(body)
      .expect(409);
  });

  it('versions service pricing, rejects overlap, and keeps identical PATCH idempotent', async () => {
    const v1 = {
      kieuTinh: KieuTinhDichVu.CO_DINH_PHONG,
      donGia: '100001',
      tuNgay: '2026-09-01',
    };
    const created = await request(app.getHttpServer())
      .post(`/api/dich-vu/${fixedDichVuId}/chinh-sach-gia`)
      .set(auth())
      .send(v1)
      .expect(201);
    fixedV1Id = data<{ id: string }>(created).id;
    await request(app.getHttpServer())
      .post(`/api/dich-vu/${fixedDichVuId}/chinh-sach-gia`)
      .set(auth())
      .send({ ...v1, tuNgay: '2026-09-15' })
      .expect(409);
    const identical = await request(app.getHttpServer())
      .patch(`/api/dich-vu/${fixedDichVuId}/chinh-sach-gia/${fixedV1Id}`)
      .set(auth())
      .send(v1)
      .expect(200);
    expect(data<{ id: string }>(identical).id).toBe(fixedV1Id);
    await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/dich-vu`)
      .set(auth())
      .send({
        dichVuId: fixedDichVuId,
        chinhSachGiaId: fixedV1Id,
        tuNgay: '2026-09-01',
        denNgay: '2026-09-30',
      })
      .expect(201);
    const changed = await request(app.getHttpServer())
      .patch(`/api/dich-vu/${fixedDichVuId}/chinh-sach-gia/${fixedV1Id}`)
      .set(auth())
      .send({ ...v1, donGia: '200003', tuNgay: '2026-10-01' })
      .expect(200);
    fixedV2Id = data<{ id: string }>(changed).id;
    expect(fixedV2Id).not.toBe(fixedV1Id);
    const rows = data<
      Array<{ id: string; donGia: string; denNgay: string | null }>
    >(
      await request(app.getHttpServer())
        .get(`/api/dich-vu/${fixedDichVuId}/chinh-sach-gia`)
        .set(auth())
        .expect(200),
    );
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: fixedV1Id, donGia: '100001' }),
        expect.objectContaining({ id: fixedV2Id, donGia: '200003' }),
      ]),
    );
    await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/dich-vu`)
      .set(auth())
      .send({
        dichVuId: fixedDichVuId,
        chinhSachGiaId: fixedV2Id,
        tuNgay: '2026-10-01',
      })
      .expect(201);
  });

  it('rejects cross-KhuTro service assignment', async () => {
    const foreign = await request(app.getHttpServer())
      .post(`/api/khu-tro/${otherKhuTroId}/dich-vu`)
      .set(otherAuth())
      .send({
        maDichVu: `FOREIGN-${runId}`,
        tenDichVu: 'Dịch vụ khác',
        loaiDichVu: LoaiDichVu.KHAC,
        donVi: 'lần',
      })
      .expect(201);
    const foreignId = data<{ id: string }>(foreign).id;
    const price = await request(app.getHttpServer())
      .post(`/api/dich-vu/${foreignId}/chinh-sach-gia`)
      .set(otherAuth())
      .send({
        kieuTinh: KieuTinhDichVu.THEO_LAN,
        donGia: '1',
        tuNgay: '2026-09-01',
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/dich-vu`)
      .set(auth())
      .send({
        dichVuId: foreignId,
        chinhSachGiaId: data<{ id: string }>(price).id,
        tuNgay: '2026-09-01',
      })
      .expect(409);
  });

  it('creates CongTo and rejects a Phong from another KhuTro', async () => {
    const created = await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/cong-to`)
      .set(auth())
      .send({
        phongId,
        loaiCongTo: LoaiCongTo.DIEN,
        maCongTo: `CT-${runId}`,
        donVi: 'kWh',
        heSoNhan: '2.5',
      })
      .expect(201);
    meterId = data<{ id: string }>(created).id;
    await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/cong-to`)
      .set(auth())
      .send({
        phongId: otherPhongId,
        loaiCongTo: LoaiCongTo.NUOC,
        maCongTo: `BAD-${runId}`,
        donVi: 'm3',
        heSoNhan: '1',
      })
      .expect(409);
  });

  it('records exact readings, multiplier, window warnings, continuity and conflicts', async () => {
    const firstBody = {
      tuNgay: '2026-09-01',
      denNgay: '2026-09-30',
      chiSoCu: '100.000',
      chiSoMoi: '112.400',
      ngayGhi: '2026-01-08T08:00:00Z',
      trangThai: TrangThaiChiSo.DA_CHOT,
    };
    const first = await request(app.getHttpServer())
      .post(`/api/cong-to/${meterId}/chi-so`)
      .set(auth())
      .send(firstBody)
      .expect(201);
    firstReadingId = data<{
      id: string;
      sanLuongTieuThu: string;
      canhBaoNgoaiKhungGhi: boolean;
    }>(first).id;
    expect(
      data<{ sanLuongTieuThu: string; canhBaoNgoaiKhungGhi: boolean }>(first),
    ).toMatchObject({ sanLuongTieuThu: '31', canhBaoNgoaiKhungGhi: false });
    await request(app.getHttpServer())
      .post(`/api/cong-to/${meterId}/chi-so`)
      .set(auth())
      .send(firstBody)
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/cong-to/${meterId}/chi-so`)
      .set(auth())
      .send({
        ...firstBody,
        tuNgay: '2026-10-01',
        denNgay: '2026-10-31',
        chiSoCu: '111',
        chiSoMoi: '120',
      })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/cong-to/${meterId}/chi-so`)
      .set(auth())
      .send({
        ...firstBody,
        tuNgay: '2026-10-01',
        denNgay: '2026-10-31',
        chiSoCu: '112.4',
        chiSoMoi: '100',
      })
      .expect(409);
    const next = await request(app.getHttpServer())
      .post(`/api/cong-to/${meterId}/chi-so`)
      .set(auth())
      .send({
        ...firstBody,
        tuNgay: '2026-10-01',
        denNgay: '2026-10-31',
        chiSoCu: '112.4',
        chiSoMoi: '120',
        ngayGhi: '2026-10-15T08:00:00Z',
      })
      .expect(201);
    expect(
      data<{ sanLuongTieuThu: string; canhBaoNgoaiKhungGhi: boolean }>(next),
    ).toMatchObject({ sanLuongTieuThu: '19', canhBaoNgoaiKhungGhi: true });
  });

  it('adjusts a reading transactionally and preserves before/after history and audit', async () => {
    const meter = await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/cong-to`)
      .set(auth())
      .send({
        phongId,
        loaiCongTo: LoaiCongTo.NUOC,
        maCongTo: `ADJ-${runId}`,
        donVi: 'm3',
        heSoNhan: '1',
      })
      .expect(201);
    adjustmentMeterId = data<{ id: string }>(meter).id;
    const reading = await request(app.getHttpServer())
      .post(`/api/cong-to/${adjustmentMeterId}/chi-so`)
      .set(auth())
      .send({
        tuNgay: '2026-09-01',
        denNgay: '2026-09-30',
        chiSoCu: '100',
        chiSoMoi: '150',
        ngayGhi: '2026-01-08T08:00:00Z',
        trangThai: TrangThaiChiSo.DA_CHOT,
      })
      .expect(201);
    const id = data<{ id: string }>(reading).id;
    const adjusted = await request(app.getHttpServer())
      .post(`/api/cong-to/${adjustmentMeterId}/chi-so/${id}/dieu-chinh`)
      .set(auth())
      .send({ chiSoCu: '100', chiSoMoi: '155', lyDo: 'Đối soát ảnh công tơ' })
      .expect(201);
    expect(
      data<{ chiSoCongTo: { chiSoMoi: string; sanLuongTieuThu: string } }>(
        adjusted,
      ).chiSoCongTo,
    ).toMatchObject({ chiSoMoi: '155', sanLuongTieuThu: '55' });
    const history = await prisma.dieuChinhChiSo.findMany({
      where: { chiSoCongToId: id },
    });
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ lyDo: 'Đối soát ảnh công tơ' });
    expect(history[0].chiSoCuTruoc.toString()).toBe('100');
    expect(history[0].chiSoMoiTruoc.toString()).toBe('150');
    expect(history[0].chiSoCuSau.toString()).toBe('100');
    expect(history[0].chiSoMoiSau.toString()).toBe('155');
    expect(
      await prisma.nhatKyHeThong.count({
        where: { doiTuongId: id, hanhDong: 'CHI_SO_CONG_TO_DIEU_CHINH' },
      }),
    ).toBe(1);
  });

  it('calculates per-person water from active occupancy without a meter', async () => {
    const service = await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/dich-vu`)
      .set(auth())
      .send({
        maDichVu: `WATER-${runId}`,
        tenDichVu: 'Nước theo người',
        loaiDichVu: LoaiDichVu.NUOC,
        donVi: 'người',
      })
      .expect(201);
    personDichVuId = data<{ id: string }>(service).id;
    const policy = await request(app.getHttpServer())
      .post(`/api/dich-vu/${personDichVuId}/chinh-sach-gia`)
      .set(auth())
      .send({
        kieuTinh: KieuTinhDichVu.THEO_NGUOI,
        donGia: '30000',
        tuNgay: '2026-09-01',
      })
      .expect(201);
    personPolicyId = data<{ id: string }>(policy).id;
    await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/dich-vu`)
      .set(auth())
      .send({
        dichVuId: personDichVuId,
        chinhSachGiaId: personPolicyId,
        tuNgay: '2026-09-01',
      })
      .expect(201);
    const preview = data<{
      dichVus: Array<{ dichVuId: string; soLuong: string; thanhTien: string }>;
    }>(
      await request(app.getHttpServer())
        .post(`/api/hop-dong/${hopDongId}/dich-vu/tinh-thu`)
        .set(auth())
        .send({ tuNgay: '2026-09-01', denNgay: '2026-09-30' })
        .expect(201),
    );
    expect(
      preview.dichVus.find((row) => row.dichVuId === personDichVuId),
    ).toMatchObject({ soLuong: '1.333', thanhTien: '39990' });
    expect(
      await prisma.congTo.count({
        where: {
          khuTroId,
          loaiCongTo: LoaiCongTo.NUOC,
          maCongTo: { not: `ADJ-${runId}` },
        },
      }),
    ).toBe(0);
  });

  it('keeps PhatSinhDichVu server-authoritative and exact for large values', async () => {
    const service = await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/dich-vu`)
      .set(auth())
      .send({
        maDichVu: `LARGE-${runId}`,
        tenDichVu: 'Số lượng lớn',
        loaiDichVu: LoaiDichVu.KHAC,
        donVi: 'đơn vị',
      })
      .expect(201);
    const id = data<{ id: string }>(service).id;
    await request(app.getHttpServer())
      .post(`/api/dich-vu/${id}/chinh-sach-gia`)
      .set(auth())
      .send({
        kieuTinh: KieuTinhDichVu.THEO_SO_LUONG,
        donGia: '987654321',
        tuNgay: '2026-09-01',
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/phat-sinh-dich-vu`)
      .set(auth())
      .send({
        dichVuId: id,
        ngayPhatSinh: '2026-09-15',
        soLuong: '123456.789',
        thanhTien: '1',
      })
      .expect(400);
    const created = await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/phat-sinh-dich-vu`)
      .set(auth())
      .send({ dichVuId: id, ngayPhatSinh: '2026-09-15', soLuong: '123456.789' })
      .expect(201);
    const expected = ((123456789n * 987654321n) / 1000n).toString();
    expect(data<{ donGia: string; thanhTien: string }>(created)).toMatchObject({
      donGia: '987654321',
      thanhTien: expected,
    });
  });

  it('previews historical V1/V2 exactly, idempotently, and without writes', async () => {
    const before = await prisma.nhatKyHeThong.count();
    const oldResult = await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/dich-vu/tinh-thu`)
      .set(auth())
      .send({ tuNgay: '2026-09-01', denNgay: '2026-09-30' })
      .expect(201);
    const repeated = await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/dich-vu/tinh-thu`)
      .set(auth())
      .send({ tuNgay: '2026-09-01', denNgay: '2026-09-30' })
      .expect(201);
    expect(repeated.body).toEqual(oldResult.body);
    const oldFixed = data<{
      dichVus: Array<{
        dichVuId: string;
        chinhSachGiaId: string;
        thanhTien: string;
      }>;
    }>(oldResult).dichVus.find((row) => row.dichVuId === fixedDichVuId);
    expect(oldFixed).toMatchObject({
      chinhSachGiaId: fixedV1Id,
      thanhTien: '100001',
    });
    const later = data<{
      dichVus: Array<{
        dichVuId: string;
        chinhSachGiaId: string;
        thanhTien: string;
      }>;
    }>(
      await request(app.getHttpServer())
        .post(`/api/hop-dong/${hopDongId}/dich-vu/tinh-thu`)
        .set(auth())
        .send({ tuNgay: '2026-10-01', denNgay: '2026-10-31' })
        .expect(201),
    );
    expect(
      later.dichVus.find((row) => row.dichVuId === fixedDichVuId),
    ).toMatchObject({ chinhSachGiaId: fixedV2Id, thanhTien: '200003' });
    expect(await prisma.nhatKyHeThong.count()).toBe(before);
    expect(
      (
        await prisma.dichVuHopDong.findFirstOrThrow({
          where: { hopDongId, chinhSachGiaId: fixedV1Id },
        })
      ).chinhSachGiaId,
    ).toBe(fixedV1Id);
  });

  it('blocks an unrelated account from every Phase 4 resource path', async () => {
    await request(app.getHttpServer())
      .get(`/api/dich-vu/${fixedDichVuId}`)
      .set(otherAuth())
      .expect(403);
    await request(app.getHttpServer())
      .get(`/api/cong-to/${meterId}`)
      .set(otherAuth())
      .expect(403);
    await request(app.getHttpServer())
      .get(`/api/cong-to/${meterId}/chi-so/${firstReadingId}`)
      .set(otherAuth())
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/dich-vu/tinh-thu`)
      .set(otherAuth())
      .send({ tuNgay: '2026-09-01', denNgay: '2026-09-30' })
      .expect(403);
  });
});
