/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { INestApplication } from '@nestjs/common';
import {
  LoaiHoaDon,
  LoaiKhoanHoaDon,
  PhuongThucThanhToan,
  VaiTroThanhVienHopDong,
} from '../generated/prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { bearer, registerAndLogin } from './helpers/auth.helper';
import { createE2eApp } from './helpers/e2e-app';
import { email, password, phone, runId } from './helpers/fixtures';

describe('Phase 5 billing E2E', () => {
  let app: INestApplication,
    prisma: PrismaService,
    token: string,
    otherToken: string,
    khuTroId: string,
    hopDongId: string,
    hoaDonId: string,
    publicToken: string,
    phieuThuId: string,
    phongId: string,
    otherKhuTroId: string,
    wifiId: string,
    wifiV1Id: string,
    dienMeterId: string,
    dienReadingId: string,
    nuocReadingId: string;
  let phatSinhDichVuId: string;
  let noEditToken: string, issuedEditToken: string;
  const auth = () => bearer(token),
    otherAuth = () => bearer(otherToken),
    data = <T>(r: { body: unknown }) => (r.body as { data: T }).data;
  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    token = (
      await registerAndLogin(app, {
        hoTen: 'Chủ trọ Phase 5',
        email: email('p5'),
        soDienThoai: phone(50),
        matKhau: password,
      })
    ).accessToken;
    otherToken = (
      await registerAndLogin(app, {
        hoTen: 'Người ngoài Phase 5',
        email: email('p5-other'),
        soDienThoai: phone(51),
        matKhau: password,
      })
    ).accessToken;
    const otherOrg = await request(app.getHttpServer())
      .post('/api/to-chuc')
      .set(otherAuth())
      .send({ tenToChuc: `Tổ chức ngoài P5 ${runId}` })
      .expect(201);
    const otherKhu = await request(app.getHttpServer())
      .post('/api/khu-tro')
      .set(otherAuth())
      .send({
        toChucId: data<{ id: string }>(otherOrg).id,
        tenKhu: `Khu ngoài P5 ${runId}`,
      })
      .expect(201);
    otherKhuTroId = data<{ id: string }>(otherKhu).id;
    const org = await request(app.getHttpServer())
      .post('/api/to-chuc')
      .set(auth())
      .send({ tenToChuc: `Tổ chức P5 ${runId}` })
      .expect(201);
    const khu = await request(app.getHttpServer())
      .post('/api/khu-tro')
      .set(auth())
      .send({
        toChucId: data<{ id: string }>(org).id,
        tenKhu: `Khu P5 ${runId}`,
      })
      .expect(201);
    khuTroId = data<{ id: string }>(khu).id;
    const scopedAccounts = await Promise.all(
      [
        ['p5-viewer', 'Nhân viên chỉ xem', 54],
        ['p5-editor', 'Nhân viên sửa hóa đơn', 55],
      ].map(async ([key, name, phoneIndex]) => {
        const accountEmail = email(String(key));
        const tokens = await registerAndLogin(app, {
          hoTen: String(name),
          email: accountEmail,
          soDienThoai: phone(Number(phoneIndex)),
          matKhau: password,
        });
        const account = await prisma.taiKhoan.findUniqueOrThrow({
          where: { email: accountEmail },
        });
        return { account, token: tokens.accessToken };
      }),
    );
    noEditToken = scopedAccounts[0].token;
    issuedEditToken = scopedAccounts[1].token;
    const toChucId = data<{ id: string }>(org).id;
    const [viewPermission, editPermission] = await Promise.all([
      prisma.quyen.findUniqueOrThrow({ where: { maQuyen: 'HOA_DON_XEM' } }),
      prisma.quyen.findUniqueOrThrow({
        where: { maQuyen: 'HOA_DON_SUA_DA_PHAT_HANH' },
      }),
    ]);
    for (const [index, fixture] of scopedAccounts.entries()) {
      const role = await prisma.vaiTro.create({
        data: {
          toChucId,
          maVaiTro: `P5_ROLE_${index}_${runId}`,
          tenVaiTro: `Vai trò P5 ${index}`,
          vaiTroQuyens: {
            create: [
              { quyenId: viewPermission.id },
              ...(index === 1 ? [{ quyenId: editPermission.id }] : []),
            ],
          },
        },
      });
      await prisma.thanhVienKhuTro.create({
        data: {
          khuTroId,
          taiKhoanId: fixture.account.id,
          vaiTroId: role.id,
        },
      });
    }
    await request(app.getHttpServer())
      .patch(`/api/khu-tro/${khuTroId}/cau-hinh`)
      .set(auth())
      .send({ hanThanhToanSauNgay: 5 })
      .expect(200);
    await prisma.cauHinhKhuTro.updateMany({
      where: { khuTroId },
      data: { tuNgay: new Date('2026-08-01T00:00:00.000Z') },
    });
    const phong = await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/phong`)
      .set(auth())
      .send({ maPhong: `P5-${runId}`, tenPhong: 'Phòng P5', soNguoiToiDa: 4 })
      .expect(201);
    phongId = data<{ id: string }>(phong).id;
    await request(app.getHttpServer())
      .post(`/api/phong/${phongId}/chinh-sach-gia`)
      .set(auth())
      .send({
        giaCoBan: '3000000',
        soNguoiBaoGom: 1,
        giaThemMoiNguoi: '300000',
        tuNgay: '2026-08-01',
      })
      .expect(201);
    const hop = await request(app.getHttpServer())
      .post('/api/hop-dong')
      .set(auth())
      .send({ phongId, maHopDong: `HD-P5-${runId}`, ngayBatDau: '2026-08-16' })
      .expect(201);
    hopDongId = data<{ id: string }>(hop).id;
    for (const [index, start] of [
      ['1', '2026-08-16'],
      ['2', '2026-08-21'],
    ]) {
      const person = await request(app.getHttpServer())
        .post('/api/ca-nhan')
        .set(auth())
        .send({
          khuTroId,
          hoTen: `Người ${index}`,
          soDienThoai: phone(51 + Number(index)),
        })
        .expect(201);
      await request(app.getHttpServer())
        .post(`/api/hop-dong/${hopDongId}/thanh-vien`)
        .set(auth())
        .send({
          caNhanId: data<{ id: string }>(person).id,
          vaiTro:
            index === '1'
              ? VaiTroThanhVienHopDong.NGUOI_DAI_DIEN
              : VaiTroThanhVienHopDong.NGUOI_CUNG_O,
          ngayBatDauO: start,
        })
        .expect(201);
    }
  }, 30_000);
  afterAll(async () => {
    if (app) await app.close();
  });
  it('previews read-only first-month rent and mid-period extra occupant exactly', async () => {
    const before = await prisma.hoaDon.count();
    const result = await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/hoa-don/preview`)
      .set(auth())
      .send({
        loaiHoaDon: LoaiHoaDon.DINH_KY,
        ngayBatDauKy: '2026-08-16',
        ngayKetThucKy: '2026-08-30',
        ngayLap: '2026-08-16',
      })
      .expect(201);
    const body = data<{
      tongTien: string;
      chiTiets: Array<{
        loaiKhoan: string;
        thanhTien: string;
        duLieuNguon: unknown;
      }>;
    }>(result);
    expect(
      body.chiTiets.find((x) => x.loaiKhoan === 'TIEN_PHONG')?.thanhTien,
    ).toBe('1500000');
    expect(
      body.chiTiets.find((x) => x.loaiKhoan === 'PHU_THU_NGUOI')?.thanhTien,
    ).toBe('100000');
    expect(body.tongTien).toBe('1600000');
    expect(body.chiTiets.every((x) => x.duLieuNguon)).toBe(true);
    expect(await prisma.hoaDon.count()).toBe(before);
  });
  it('builds electricity, metered water, per-person water, and fixed-service invoice sources exactly', async () => {
    const createService = async (
      code: string,
      loaiDichVu: string,
      donVi: string,
      policy: Record<string, unknown>,
      assignment: Record<string, unknown> = {},
    ) => {
      const service = await request(app.getHttpServer())
        .post(`/api/khu-tro/${khuTroId}/dich-vu`)
        .set(auth())
        .send({
          maDichVu: `${code}-${runId}`,
          tenDichVu: code,
          loaiDichVu,
          donVi,
        })
        .expect(201);
      const dichVuId = data<{ id: string }>(service).id;
      const price = await request(app.getHttpServer())
        .post(`/api/dich-vu/${dichVuId}/chinh-sach-gia`)
        .set(auth())
        .send({ ...policy, tuNgay: '2026-08-16' })
        .expect(201);
      const chinhSachGiaId = data<{ id: string }>(price).id;
      const assigned = await request(app.getHttpServer())
        .post(`/api/hop-dong/${hopDongId}/dich-vu`)
        .set(auth())
        .send({
          dichVuId,
          chinhSachGiaId,
          tuNgay: '2026-08-16',
          ...assignment,
        })
        .expect(201);
      return {
        dichVuId,
        chinhSachGiaId,
        dichVuHopDongId: data<{ id: string }>(assigned).id,
      };
    };
    const dien = await createService('Điện', 'DIEN', 'kWh', {
      kieuTinh: 'THEO_CHI_SO',
      donGia: '3500',
    });
    const nuoc = await createService('Nước công tơ', 'NUOC', 'm3', {
      kieuTinh: 'THEO_CHI_SO',
      donGia: '15000',
    });
    const nuocNguoi = await createService('Nước người', 'NUOC', 'người', {
      kieuTinh: 'THEO_NGUOI',
      donGia: '30000',
    });
    const wifi = await createService(
      'Wifi',
      'WIFI',
      'tháng',
      {
        kieuTinh: 'CO_DINH_PHONG',
        donGia: '100000',
        cauHinhBoSung: { prorate: true },
      },
      { denNgay: '2026-08-30' },
    );
    wifiId = wifi.dichVuId;
    wifiV1Id = wifi.chinhSachGiaId;
    const occurrence = await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/phat-sinh-dich-vu`)
      .set(auth())
      .send({
        dichVuId: wifiId,
        ngayPhatSinh: '2026-08-20',
        soLuong: '1',
        noiDung: 'Lắp đặt wifi',
      })
      .expect(201);
    phatSinhDichVuId = data<{ id: string }>(occurrence).id;
    const createReading = async (
      type: string,
      code: string,
      oldValue: string,
      newValue: string,
      multiplier: string,
    ) => {
      const meter = await request(app.getHttpServer())
        .post(`/api/khu-tro/${khuTroId}/cong-to`)
        .set(auth())
        .send({
          phongId,
          loaiCongTo: type,
          maCongTo: `${code}-${runId}`,
          donVi: type === 'DIEN' ? 'kWh' : 'm3',
          heSoNhan: multiplier,
        })
        .expect(201);
      const reading = await request(app.getHttpServer())
        .post(`/api/cong-to/${data<{ id: string }>(meter).id}/chi-so`)
        .set(auth())
        .send({
          tuNgay: '2026-08-16',
          denNgay: '2026-08-30',
          chiSoCu: oldValue,
          chiSoMoi: newValue,
          ngayGhi: '2026-08-20T08:00:00Z',
          trangThai: 'DA_CHOT',
        })
        .expect(201);
      if (type === 'DIEN') dienMeterId = data<{ id: string }>(meter).id;
      return data<{ id: string }>(reading).id;
    };
    dienReadingId = await createReading('DIEN', 'DIEN', '100', '110', '2');
    nuocReadingId = await createReading('NUOC', 'NUOC', '10', '15', '1');
    const preview = data<{
      tongTien: string;
      chiTiets: Array<{
        loaiKhoan: string;
        soLuong: string;
        donVi: string;
        donGia: string;
        thanhTien: string;
        duLieuNguon: Record<string, unknown>;
      }>;
    }>(
      await request(app.getHttpServer())
        .post(`/api/hop-dong/${hopDongId}/hoa-don/preview`)
        .set(auth())
        .send({
          loaiHoaDon: LoaiHoaDon.DINH_KY,
          ngayBatDauKy: '2026-08-16',
          ngayKetThucKy: '2026-08-30',
          ngayLap: '2026-08-16',
        })
        .expect(201),
    );
    const electricity = preview.chiTiets.find(
      (line) => line.loaiKhoan === 'TIEN_DIEN',
    );
    expect(electricity).toMatchObject({
      soLuong: '20',
      donVi: 'kWh',
      donGia: '3500',
      thanhTien: '70000',
    });
    expect(electricity?.duLieuNguon).toMatchObject({
      dichVuId: dien.dichVuId,
      dichVuHopDongId: dien.dichVuHopDongId,
      chinhSachGiaId: dien.chinhSachGiaId,
      chiSoCongToIds: [dienReadingId],
    });
    expect(
      preview.chiTiets.find(
        (line) =>
          line.loaiKhoan === 'TIEN_NUOC' &&
          line.duLieuNguon.dichVuId === nuoc.dichVuId,
      ),
    ).toMatchObject({
      soLuong: '5',
      donVi: 'm3',
      donGia: '15000',
      thanhTien: '75000',
      duLieuNguon: { chiSoCongToIds: [nuocReadingId] },
    });
    expect(
      preview.chiTiets.find(
        (line) =>
          line.loaiKhoan === 'TIEN_NUOC' &&
          line.duLieuNguon.dichVuId === nuocNguoi.dichVuId,
      ),
    ).toMatchObject({
      soLuong: '0.833',
      donVi: 'người',
      donGia: '30000',
      thanhTien: '24990',
      duLieuNguon: {
        dichVuHopDongId: nuocNguoi.dichVuHopDongId,
        chinhSachGiaId: nuocNguoi.chinhSachGiaId,
        chiSoCongToIds: [],
      },
    });
    expect(
      preview.chiTiets.find(
        (line) => line.duLieuNguon.dichVuId === wifi.dichVuId,
      ),
    ).toMatchObject({
      loaiKhoan: 'DICH_VU',
      donGia: '100000',
      thanhTien: '50000',
    });
    expect(
      preview.chiTiets.find((line) => line.loaiKhoan === 'PHAT_SINH')
        ?.duLieuNguon,
    ).toMatchObject({ phatSinhDichVuId });
    expect(preview.tongTien).toBe('1919990');
  });
  it('creates one atomic versioned invoice and rejects concurrent duplicate generation', async () => {
    const body = {
      loaiHoaDon: LoaiHoaDon.DINH_KY,
      ngayBatDauKy: '2026-08-16',
      ngayKetThucKy: '2026-08-30',
      ngayLap: '2026-08-16',
    };
    const settled = await Promise.allSettled([
      request(app.getHttpServer())
        .post(`/api/hop-dong/${hopDongId}/hoa-don`)
        .set(auth())
        .send(body),
      request(app.getHttpServer())
        .post(`/api/hop-dong/${hopDongId}/hoa-don`)
        .set(auth())
        .send(body),
    ]);
    const responses = settled
      .filter((x) => x.status === 'fulfilled')
      .map((x) => x.value);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    const invoice = responses.find((r) => r.status === 201);
    if (!invoice)
      throw new Error('Không tạo được hóa đơn trong kiểm thử cạnh tranh');
    hoaDonId = data<{ id: string }>(invoice).id;
    expect(await prisma.hoaDon.count({ where: { hopDongId } })).toBe(1);
    expect(await prisma.phienBanHoaDon.count({ where: { hoaDonId } })).toBe(1);
  });
  it('prevents source rebilling while the partial index permits non-periodic coexistence', async () => {
    const indexRows = await prisma.$queryRaw<
      Array<{ indexname: string; indexdef: string }>
    >`SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname IN ('uq_hoa_don_dinh_ky_hop_dong_ky', 'uq_chi_tiet_hoa_don_phat_sinh_dich_vu', 'uq_nguon_chi_so_hoa_don_chi_so_cong_to') ORDER BY indexname`;
    expect(indexRows).toHaveLength(3);
    expect(
      indexRows.find(
        (row) => row.indexname === 'uq_hoa_don_dinh_ky_hop_dong_ky',
      )?.indexdef,
    ).toContain("WHERE (loai_hoa_don = 'DINH_KY'");
    const createNonPeriodic = async (loaiHoaDon: LoaiHoaDon) =>
      request(app.getHttpServer())
        .post(`/api/hop-dong/${hopDongId}/hoa-don`)
        .set(auth())
        .send({
          loaiHoaDon,
          ngayBatDauKy: '2026-08-16',
          ngayKetThucKy: '2026-08-30',
          ngayLap: '2026-08-16',
        })
        .expect(201);
    const phatSinh = await createNonPeriodic(LoaiHoaDon.PHAT_SINH);
    const dieuChinh = await createNonPeriodic(LoaiHoaDon.DIEU_CHINH);
    const ids = [
      data<{ id: string }>(phatSinh).id,
      data<{ id: string }>(dieuChinh).id,
    ];
    expect(
      await prisma.chiTietHoaDon.count({
        where: {
          duLieuNguon: { path: ['phatSinhDichVuId'], equals: phatSinhDichVuId },
        },
      }),
    ).toBe(1);
    expect(
      await prisma.chiTietHoaDon.count({
        where: {
          hoaDonId: { in: ids },
          loaiKhoan: { in: ['TIEN_DIEN', 'TIEN_NUOC'] },
          NOT: { duLieuNguon: { path: ['chiSoCongToIds'], equals: [] } },
        },
      }),
    ).toBe(0);
    for (const id of ids)
      await request(app.getHttpServer())
        .post(`/api/hoa-don/${id}/huy`)
        .set(auth())
        .send({ lyDo: 'Kết thúc fixture non-periodic' })
        .expect(201);
  });
  it('prevents concurrent partially overlapping meter-reading sets per source ID', async () => {
    const owner = await prisma.taiKhoan.findUniqueOrThrow({
      where: { email: email('p5') },
    });
    const createReading = (
      tuNgay: string,
      denNgay: string,
      chiSoCu: number,
      chiSoMoi: number,
    ) =>
      prisma.chiSoCongTo.create({
        data: {
          congToId: dienMeterId,
          tuNgay: new Date(tuNgay),
          denNgay: new Date(denNgay),
          chiSoCu,
          chiSoMoi,
          sanLuongTieuThu: chiSoMoi - chiSoCu,
          ngayGhi: new Date(`${denNgay}T08:00:00Z`),
          nguoiGhiId: owner.id,
          trangThai: 'DA_CHOT',
        },
      });
    const createConcurrent = (
      loaiHoaDon: LoaiHoaDon,
      ngayBatDauKy: string,
      ngayKetThucKy: string,
    ) =>
      request(app.getHttpServer())
        .post(`/api/hop-dong/${hopDongId}/hoa-don`)
        .set(auth())
        .send({
          loaiHoaDon,
          ngayBatDauKy,
          ngayKetThucKy,
          ngayLap: ngayKetThucKy,
        });
    const assertRace = async (
      first: [LoaiHoaDon, string, string],
      second: [LoaiHoaDon, string, string],
      sharedReadingId: string,
    ) => {
      const responses = await Promise.all([
        createConcurrent(...first),
        createConcurrent(...second),
      ]);
      const winner = responses.find((response) => response.status === 201);
      if (!winner)
        throw new Error(
          'Không tạo được hóa đơn trong kiểm thử nguồn giao nhau',
        );
      await request(app.getHttpServer())
        .post(`/api/hoa-don/${data<{ id: string }>(winner).id}/huy`)
        .set(auth())
        .send({ lyDo: 'Kết thúc fixture nguồn chỉ số giao nhau' })
        .expect(201);
      expect(responses.map((response) => response.status).sort()).toEqual([
        201, 409,
      ]);
      expect(
        await prisma.nguonChiSoHoaDon.count({
          where: { chiSoCongToId: sharedReadingId },
        }),
      ).toBe(1);
    };

    const [reading1, reading2] = await Promise.all([
      createReading('2027-01-01', '2027-01-10', 200, 210),
      createReading('2027-01-11', '2027-01-20', 210, 220),
    ]);
    await assertRace(
      [LoaiHoaDon.DINH_KY, '2027-01-01', '2027-01-10'],
      [LoaiHoaDon.QUYET_TOAN_TRA_PHONG, '2027-01-01', '2027-01-20'],
      reading1.id,
    );
    expect(
      await prisma.nguonChiSoHoaDon.count({
        where: { chiSoCongToId: reading2.id },
      }),
    ).toBeLessThanOrEqual(1);

    const [reading3, reading4, reading5] = await Promise.all([
      createReading('2027-02-01', '2027-02-10', 220, 230),
      createReading('2027-02-11', '2027-02-20', 230, 240),
      createReading('2027-02-21', '2027-02-28', 240, 250),
    ]);
    await assertRace(
      [LoaiHoaDon.DINH_KY, '2027-02-01', '2027-02-20'],
      [LoaiHoaDon.PHAT_SINH, '2027-02-11', '2027-02-28'],
      reading4.id,
    );
    for (const reading of [reading3, reading5])
      expect(
        await prisma.nguonChiSoHoaDon.count({
          where: { chiSoCongToId: reading.id },
        }),
      ).toBeLessThanOrEqual(1);
  });
  it('keeps historical contract/service prices and immutable stored details across V2 pricing', async () => {
    const augustBefore = await prisma.hoaDon.findUniqueOrThrow({
      where: { id: hoaDonId },
      include: { chiTiets: true, phienBans: true },
    });
    const augustWifi = augustBefore.chiTiets.find(
      (line) =>
        (line.duLieuNguon as Record<string, unknown>)?.dichVuId === wifiId,
    );
    expect(augustWifi?.donGia).toBe(100000n);
    await prisma.chinhSachGiaPhong.updateMany({
      where: { phongId },
      data: { giaCoBan: 9_000_000n },
    });
    const v2 = await request(app.getHttpServer())
      .patch(`/api/dich-vu/${wifiId}/chinh-sach-gia/${wifiV1Id}`)
      .set(auth())
      .send({
        kieuTinh: 'CO_DINH_PHONG',
        donGia: '200000',
        tuNgay: '2026-09-01',
        cauHinhBoSung: { prorate: false },
      })
      .expect(200);
    const wifiV2Id = data<{ id: string }>(v2).id;
    await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/dich-vu`)
      .set(auth())
      .send({
        dichVuId: wifiId,
        chinhSachGiaId: wifiV2Id,
        tuNgay: '2026-09-01',
        denNgay: '2026-09-30',
      })
      .expect(201);
    const september = await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/hoa-don`)
      .set(auth())
      .send({
        loaiHoaDon: LoaiHoaDon.DINH_KY,
        ngayBatDauKy: '2026-09-01',
        ngayKetThucKy: '2026-09-30',
        ngayLap: '2026-09-01',
      })
      .expect(201);
    const septemberBody = data<{
      id: string;
      chiTiets: Array<{
        loaiKhoan: string;
        donGia: string;
        thanhTien: string;
        duLieuNguon: Record<string, unknown>;
      }>;
    }>(september);
    expect(
      septemberBody.chiTiets.find((line) => line.loaiKhoan === 'TIEN_PHONG'),
    ).toMatchObject({ donGia: '3000000', thanhTien: '3000000' });
    expect(
      septemberBody.chiTiets.find(
        (line) => line.duLieuNguon.chinhSachGiaId === wifiV2Id,
      ),
    ).toMatchObject({ donGia: '200000', thanhTien: '200000' });
    const augustAfter = await prisma.hoaDon.findUniqueOrThrow({
      where: { id: hoaDonId },
      include: { chiTiets: true, phienBans: true },
    });
    expect(
      augustAfter.chiTiets.find(
        (line) =>
          (line.duLieuNguon as Record<string, unknown>)?.dichVuId === wifiId,
      )?.donGia,
    ).toBe(100000n);
    expect(augustAfter.phienBans[0].duLieuHoaDon).toEqual(
      augustBefore.phienBans[0].duLieuHoaDon,
    );
    await request(app.getHttpServer())
      .post(`/api/hoa-don/${septemberBody.id}/huy`)
      .set(auth())
      .send({ lyDo: 'Kết thúc fixture giá lịch sử' })
      .expect(201);
  });
  it('creates conservative final-settlement metadata without mutating deposits or contract lifecycle', async () => {
    const owner = await prisma.taiKhoan.findUniqueOrThrow({
      where: { email: email('p5') },
    });
    await prisma.yeuCauTraPhong.create({
      data: {
        hopDongId,
        ngayBao: new Date('2026-10-01'),
        ngayDuKienTra: new Date('2026-10-15'),
        soTienKhauTruCoc: 250000n,
        trangThai: 'CHO_QUYET_TOAN',
        nguoiTaoId: owner.id,
      },
    });
    const contractBefore = await prisma.hopDong.findUniqueOrThrow({
      where: { id: hopDongId },
    });
    const depositCountBefore = await prisma.giaoDichTienCoc.count({
      where: { hopDongId },
    });
    const preview = data<{
      tongTien: string;
      chiTiets: Array<{
        loaiKhoan: string;
        duLieuNguon: Record<string, unknown>;
      }>;
      duLieuTinhToan: {
        quyetToanTraPhong: Record<string, unknown>;
      };
    }>(
      await request(app.getHttpServer())
        .post(`/api/hop-dong/${hopDongId}/hoa-don/preview`)
        .set(auth())
        .send({
          loaiHoaDon: LoaiHoaDon.QUYET_TOAN_TRA_PHONG,
          ngayBatDauKy: '2026-10-01',
          ngayKetThucKy: '2026-10-15',
          ngayLap: '2026-10-15',
        })
        .expect(201),
    );
    expect(preview.chiTiets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ loaiKhoan: 'TIEN_PHONG' }),
      ]),
    );
    expect(
      preview.chiTiets.some((line) => {
        const ids = line.duLieuNguon.chiSoCongToIds;
        return Array.isArray(ids) && ids.length > 0;
      }),
    ).toBe(false);
    expect(
      preview.chiTiets.some(
        (line) => line.duLieuNguon.phatSinhDichVuId === phatSinhDichVuId,
      ),
    ).toBe(false);
    expect(preview.duLieuTinhToan.quyetToanTraPhong).toMatchObject({
      coYeuCauTraPhong: true,
      trangThai: 'CHO_QUYET_TOAN',
      khauTruCocMetadataOnly: true,
      soTienKhauTruCoc: '250000',
    });
    const created = await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/hoa-don`)
      .set(auth())
      .send({
        loaiHoaDon: LoaiHoaDon.QUYET_TOAN_TRA_PHONG,
        ngayBatDauKy: '2026-10-01',
        ngayKetThucKy: '2026-10-15',
        ngayLap: '2026-10-15',
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/hoa-don/${data<{ id: string }>(created).id}/huy`)
      .set(auth())
      .send({ lyDo: 'Kết thúc fixture quyết toán' })
      .expect(201);
    expect(await prisma.giaoDichTienCoc.count({ where: { hopDongId } })).toBe(
      depositCountBefore,
    );
    expect(
      (await prisma.hopDong.findUniqueOrThrow({ where: { id: hopDongId } }))
        .trangThai,
    ).toBe(contractBefore.trangThai);
  });
  it('blocks cross-KhuTro internal reads and issues a hash-only public link', async () => {
    await request(app.getHttpServer())
      .get(`/api/hoa-don/${hoaDonId}`)
      .set(otherAuth())
      .expect(403);
    const issued = await request(app.getHttpServer())
      .post(`/api/hoa-don/${hoaDonId}/phat-hanh`)
      .set(auth())
      .send({})
      .expect(201);
    publicToken = data<{ publicToken: string }>(issued).publicToken;
    const stored = await prisma.lienKetTraCuu.findUniqueOrThrow({
      where: { hoaDonId },
    });
    expect(stored.tokenHash).not.toBe(publicToken);
    const publicResult = await request(app.getHttpServer())
      .get(`/api/public/hoa-don/${publicToken}`)
      .expect(200);
    const serialized = JSON.stringify(publicResult.body);
    for (const forbidden of [
      stored.tokenHash,
      'tokenHash',
      'nguoiLapId',
      'taiKhoanId',
      'permissions',
      'accessToken',
      'refreshToken',
      'soGiayToMaHoa',
      'soGiayToHash',
      'nhatKy',
    ])
      expect(serialized).not.toContain(forbidden);
  });
  it('enforces issued-edit RBAC and preserves immutable version 1 with the same public link', async () => {
    const linkBefore = await prisma.lienKetTraCuu.findUniqueOrThrow({
      where: { hoaDonId },
    });
    const versionOneBefore = await prisma.phienBanHoaDon.findUniqueOrThrow({
      where: { hoaDonId_soPhienBan: { hoaDonId, soPhienBan: 1 } },
    });
    const snapshotBefore = JSON.stringify(versionOneBefore.duLieuHoaDon);
    await request(app.getHttpServer())
      .patch(`/api/hoa-don/${hoaDonId}`)
      .set(bearer(noEditToken))
      .send({ ghiChu: 'Không được phép', lyDoThayDoi: 'Thử quyền' })
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/api/hoa-don/${hoaDonId}`)
      .set(bearer(issuedEditToken))
      .send({ ghiChu: 'Thiếu lý do' })
      .expect(409);
    await request(app.getHttpServer())
      .patch(`/api/hoa-don/${hoaDonId}`)
      .set(bearer(issuedEditToken))
      .send({ ghiChu: 'Đã đối soát', lyDoThayDoi: 'Đối soát hóa đơn' })
      .expect(200);
    const versionOneAfter = await prisma.phienBanHoaDon.findUniqueOrThrow({
      where: { hoaDonId_soPhienBan: { hoaDonId, soPhienBan: 1 } },
    });
    expect(JSON.stringify(versionOneAfter.duLieuHoaDon)).toBe(snapshotBefore);
    expect(versionOneAfter.tongTien).toBe(versionOneBefore.tongTien);
    const linkAfter = await prisma.lienKetTraCuu.findUniqueOrThrow({
      where: { hoaDonId },
    });
    expect(linkAfter.id).toBe(linkBefore.id);
    expect(linkAfter.tokenHash).toBe(linkBefore.tokenHash);
    expect(
      data<{ phienBanHienTai: number }>(
        await request(app.getHttpServer())
          .get(`/api/public/hoa-don/${publicToken}`)
          .expect(200),
      ).phienBanHienTai,
    ).toBe(2);
  });
  it('preserves the public link while an issued adjustment creates version 3', async () => {
    await request(app.getHttpServer())
      .post(`/api/hoa-don/${hoaDonId}/dieu-chinh`)
      .set(auth())
      .send({
        loaiKhoan: LoaiKhoanHoaDon.GIAM_TRU,
        soTien: '100000',
        lyDo: 'Ưu đãi',
      })
      .expect(201);
    const publicResult = data<{ phienBanHienTai: number; tongTien: string }>(
      await request(app.getHttpServer())
        .get(`/api/public/hoa-don/${publicToken}`)
        .expect(200),
    );
    expect(publicResult).toMatchObject({
      phienBanHienTai: 3,
      tongTien: '1819990',
    });
    expect(await prisma.lienKetTraCuu.count({ where: { hoaDonId } })).toBe(1);
    expect(await prisma.phienBanHoaDon.count({ where: { hoaDonId } })).toBe(3);
  });
  it('rejects expired public links with the same generic response', async () => {
    const link = await prisma.lienKetTraCuu.findUniqueOrThrow({
      where: { hoaDonId },
    });
    await prisma.lienKetTraCuu.update({
      where: { id: link.id },
      data: { hetHanLuc: new Date('2020-01-01') },
    });
    const expired = await request(app.getHttpServer())
      .get(`/api/public/hoa-don/${publicToken}`)
      .expect(404);
    const invalid = await request(app.getHttpServer())
      .get(`/api/public/hoa-don/${'x'.repeat(43)}`)
      .expect(404);
    const expiredBody = expired.body as { message: string };
    const invalidBody = invalid.body as { message: string };
    expect(expiredBody.message).toBe(invalidBody.message);
    await prisma.lienKetTraCuu.update({
      where: { id: link.id },
      data: { hetHanLuc: null },
    });
  });
  it('derives overdue on internal reads without overriding paid/cancelled priority', async () => {
    await prisma.hoaDon.update({
      where: { id: hoaDonId },
      data: { hanThanhToan: new Date('2020-01-01') },
    });
    expect(
      data<{ trangThai: string }>(
        await request(app.getHttpServer())
          .get(`/api/hoa-don/${hoaDonId}`)
          .set(auth())
          .expect(200),
      ).trangThai,
    ).toBe('QUA_HAN');
    await prisma.hoaDon.update({
      where: { id: hoaDonId },
      data: { hanThanhToan: new Date('2099-01-01') },
    });
  });
  it('keeps pending receipt ineffective, confirms partial payment, and cancels by recomputation', async () => {
    const debtBefore = data<{ tongConNo: string }>(
      await request(app.getHttpServer())
        .get(`/api/hop-dong/${hopDongId}/cong-no`)
        .set(auth())
        .expect(200),
    );
    const receipt = await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/phieu-thu`)
      .set(auth())
      .send({
        soTien: '1000000',
        phuongThuc: PhuongThucThanhToan.TIEN_MAT,
        ngayThanhToan: '2026-08-12',
        phanBos: [{ hoaDonId, soTienPhanBo: '1000000' }],
      })
      .expect(201);
    phieuThuId = data<{ id: string }>(receipt).id;
    expect(
      (await prisma.hoaDon.findUniqueOrThrow({ where: { id: hoaDonId } }))
        .tienDaThanhToanCache,
    ).toBe(0n);
    expect(
      data<{ tongConNo: string }>(
        await request(app.getHttpServer())
          .get(`/api/hop-dong/${hopDongId}/cong-no`)
          .set(auth())
          .expect(200),
      ).tongConNo,
    ).toBe(debtBefore.tongConNo);
    await request(app.getHttpServer())
      .post(`/api/phieu-thu/${phieuThuId}/xac-nhan`)
      .set(auth())
      .send({})
      .expect(201);
    let invoice = await prisma.hoaDon.findUniqueOrThrow({
      where: { id: hoaDonId },
    });
    expect(invoice.tienDaThanhToanCache).toBe(1000000n);
    expect(invoice.trangThai).toBe('THANH_TOAN_MOT_PHAN');
    await prisma.hoaDon.update({
      where: { id: hoaDonId },
      data: { hanThanhToan: new Date('2020-01-01') },
    });
    expect(
      data<{ trangThai: string }>(
        await request(app.getHttpServer())
          .get(`/api/hoa-don/${hoaDonId}`)
          .set(auth())
          .expect(200),
      ).trangThai,
    ).toBe('THANH_TOAN_MOT_PHAN');
    await request(app.getHttpServer())
      .post(`/api/phieu-thu/${phieuThuId}/huy`)
      .set(auth())
      .send({ lyDo: 'Thu nhầm' })
      .expect(201);
    invoice = await prisma.hoaDon.findUniqueOrThrow({
      where: { id: hoaDonId },
    });
    expect(invoice.tienDaThanhToanCache).toBe(0n);
    expect(invoice.trangThai).toBe('QUA_HAN');
    expect(await prisma.phanBoThanhToan.count({ where: { phieuThuId } })).toBe(
      1,
    );
    expect(
      await prisma.nhatKyHeThong.count({
        where: { doiTuongId: phieuThuId, hanhDong: 'PHIEU_THU_HUY' },
      }),
    ).toBe(1);
    expect(
      data<{ tongConNo: string }>(
        await request(app.getHttpServer())
          .get(`/api/hop-dong/${hopDongId}/cong-no`)
          .set(auth())
          .expect(200),
      ).tongConNo,
    ).toBe(debtBefore.tongConNo);
    await prisma.hoaDon.update({
      where: { id: hoaDonId },
      data: { hanThanhToan: new Date('2099-01-01') },
    });
  });
  it('blocks receipt IDOR across every receipt path', async () => {
    await request(app.getHttpServer())
      .get(`/api/phieu-thu/${phieuThuId}`)
      .set(otherAuth())
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/phieu-thu`)
      .set(otherAuth())
      .send({
        soTien: '1',
        phuongThuc: PhuongThucThanhToan.TIEN_MAT,
        ngayThanhToan: '2026-08-12',
        phanBos: [{ hoaDonId, soTienPhanBo: '1' }],
      })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/phieu-thu/${phieuThuId}/xac-nhan`)
      .set(otherAuth())
      .send({})
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/phieu-thu/${phieuThuId}/huy`)
      .set(otherAuth())
      .send({ lyDo: 'Không được phép' })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/khu-tro/${otherKhuTroId}/phieu-thu`)
      .set(otherAuth())
      .send({
        soTien: '1',
        phuongThuc: PhuongThucThanhToan.TIEN_MAT,
        ngayThanhToan: '2026-08-12',
        phanBos: [{ hoaDonId, soTienPhanBo: '1' }],
      })
      .expect(409);
  });
  it('validates allocation totals, zero/negative money, and draft invoices', async () => {
    const endpoint = `/api/khu-tro/${khuTroId}/phieu-thu`;
    const base = {
      phuongThuc: PhuongThucThanhToan.TIEN_MAT,
      ngayThanhToan: '2026-08-12',
    };
    await request(app.getHttpServer())
      .post(endpoint)
      .set(auth())
      .send({
        ...base,
        soTien: '100',
        phanBos: [{ hoaDonId, soTienPhanBo: '101' }],
      })
      .expect(409);
    await request(app.getHttpServer())
      .post(endpoint)
      .set(auth())
      .send({
        ...base,
        soTien: '100',
        phanBos: [{ hoaDonId, soTienPhanBo: '0' }],
      })
      .expect(409);
    await request(app.getHttpServer())
      .post(endpoint)
      .set(auth())
      .send({
        ...base,
        soTien: '100',
        phanBos: [{ hoaDonId, soTienPhanBo: '-1' }],
      })
      .expect(400);
    const draft = await request(app.getHttpServer())
      .post(`/api/hop-dong/${hopDongId}/hoa-don`)
      .set(auth())
      .send({
        loaiHoaDon: LoaiHoaDon.PHAT_SINH,
        ngayBatDauKy: '2026-09-01',
        ngayKetThucKy: '2026-09-30',
        ngayLap: '2026-09-01',
      })
      .expect(201);
    const draftId = data<{ id: string }>(draft).id;
    await request(app.getHttpServer())
      .post(endpoint)
      .set(auth())
      .send({
        ...base,
        soTien: '1',
        phanBos: [{ hoaDonId: draftId, soTienPhanBo: '1' }],
      })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/hoa-don/${draftId}/huy`)
      .set(auth())
      .send({ lyDo: 'Kết thúc fixture hóa đơn nháp' })
      .expect(201);
    await prisma.hoaDon.update({
      where: { id: draftId },
      data: { hanThanhToan: new Date('2020-01-01') },
    });
    expect(
      data<{ trangThai: string }>(
        await request(app.getHttpServer())
          .get(`/api/hoa-don/${draftId}`)
          .set(auth())
          .expect(200),
      ).trangThai,
    ).toBe('DA_HUY');
    await request(app.getHttpServer())
      .post(endpoint)
      .set(auth())
      .send({
        ...base,
        soTien: '1',
        phanBos: [{ hoaDonId: draftId, soTienPhanBo: '1' }],
      })
      .expect(409);
  });
  it('rejects allocation above outstanding and reports exact debt', async () => {
    const bad = await request(app.getHttpServer())
      .post(`/api/khu-tro/${khuTroId}/phieu-thu`)
      .set(auth())
      .send({
        soTien: '1819991',
        phuongThuc: PhuongThucThanhToan.TIEN_MAT,
        ngayThanhToan: '2026-08-12',
        phanBos: [{ hoaDonId, soTienPhanBo: '1819991' }],
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/phieu-thu/${data<{ id: string }>(bad).id}/xac-nhan`)
      .set(auth())
      .send({})
      .expect(409);
    const debt = data<{ tongConNo: string }>(
      await request(app.getHttpServer())
        .get(`/api/hop-dong/${hopDongId}/cong-no`)
        .set(auth())
        .expect(200),
    );
    expect(debt.tongConNo).toBe('1819990');
  });
  it('serializes competing confirmations so successful allocations cannot overpay', async () => {
    const create = async (suffix: string) =>
      request(app.getHttpServer())
        .post(`/api/khu-tro/${khuTroId}/phieu-thu`)
        .set(auth())
        .send({
          soTien: '1819990',
          phuongThuc: PhuongThucThanhToan.CHUYEN_KHOAN,
          maGiaoDich: `RACE-${suffix}-${runId}`,
          ngayThanhToan: '2026-08-13',
          phanBos: [{ hoaDonId, soTienPhanBo: '1819990' }],
        })
        .expect(201);
    const [a, b] = await Promise.all([create('A'), create('B')]);
    const confirmations = await Promise.all([
      request(app.getHttpServer())
        .post(`/api/phieu-thu/${data<{ id: string }>(a).id}/xac-nhan`)
        .set(auth())
        .send({}),
      request(app.getHttpServer())
        .post(`/api/phieu-thu/${data<{ id: string }>(b).id}/xac-nhan`)
        .set(auth())
        .send({}),
    ]);
    expect(confirmations.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
    const invoice = await prisma.hoaDon.findUniqueOrThrow({
      where: { id: hoaDonId },
    });
    expect(invoice.tienDaThanhToanCache).toBe(1819990n);
    expect(invoice.trangThai).toBe('DA_THANH_TOAN');
    const effective = await prisma.phanBoThanhToan.aggregate({
      _sum: { soTienPhanBo: true },
      where: { hoaDonId, phieuThu: { trangThai: 'THANH_CONG' } },
    });
    expect(effective._sum.soTienPhanBo).toBe(1819990n);
  });
  it('handles edit-after-payment, old-debt metadata, and exact two-receipt full payment', async () => {
    await prisma.thanhVienHopDong.updateMany({
      where: { hopDongId, laDaiDien: false },
      data: { ngayKetThucO: new Date('2026-08-30') },
    });
    const createIssued = async (month: string) => {
      const created = await request(app.getHttpServer())
        .post(`/api/hop-dong/${hopDongId}/hoa-don`)
        .set(auth())
        .send({
          loaiHoaDon: LoaiHoaDon.DINH_KY,
          ngayBatDauKy: `2026-${month}-01`,
          ngayKetThucKy: `2026-${month}-30`,
          ngayLap: `2026-${month}-01`,
        })
        .expect(201);
      const id = data<{ id: string; tongTien: string }>(created);
      expect(id.tongTien).toBe('3000000');
      await request(app.getHttpServer())
        .post(`/api/hoa-don/${id.id}/phat-hanh`)
        .set(auth())
        .send({})
        .expect(201);
      return id.id;
    };
    const createAndConfirm = async (invoiceId: string, amount: string) => {
      const receipt = await request(app.getHttpServer())
        .post(`/api/khu-tro/${khuTroId}/phieu-thu`)
        .set(auth())
        .send({
          soTien: amount,
          phuongThuc: PhuongThucThanhToan.TIEN_MAT,
          ngayThanhToan: '2026-11-02',
          phanBos: [{ hoaDonId: invoiceId, soTienPhanBo: amount }],
        })
        .expect(201);
      await request(app.getHttpServer())
        .post(`/api/phieu-thu/${data<{ id: string }>(receipt).id}/xac-nhan`)
        .set(auth())
        .send({})
        .expect(201);
    };
    const novemberId = await createIssued('11');
    await createAndConfirm(novemberId, '2000000');
    expect(
      await prisma.hoaDon.findUniqueOrThrow({ where: { id: novemberId } }),
    ).toMatchObject({
      tongTien: 3000000n,
      tienDaThanhToanCache: 2000000n,
      trangThai: 'THANH_TOAN_MOT_PHAN',
    });
    const decemberId = await createIssued('12');
    const decemberBefore = await prisma.hoaDon.findUniqueOrThrow({
      where: { id: decemberId },
      include: { chiTiets: true },
    });
    expect(decemberBefore.tongTien).toBe(3000000n);
    expect(
      decemberBefore.chiTiets.some((line) => line.loaiKhoan === 'CONG_NO_CU'),
    ).toBe(false);
    expect(decemberBefore.duLieuTinhToan).toMatchObject({
      congNoTruocKy: '1000000',
    });
    expect(
      data<{
        tongHoaDon: string;
        tongDaThanhToan: string;
        tongConNo: string;
      }>(
        await request(app.getHttpServer())
          .get(`/api/hop-dong/${hopDongId}/cong-no`)
          .set(auth())
          .expect(200),
      ),
    ).toMatchObject({
      tongHoaDon: '7819990',
      tongDaThanhToan: '3819990',
      tongConNo: '4000000',
    });
    await request(app.getHttpServer())
      .post(`/api/hoa-don/${novemberId}/dieu-chinh`)
      .set(auth())
      .send({
        loaiKhoan: LoaiKhoanHoaDon.PHAT_SINH,
        soTien: '1000000',
        lyDo: 'Tăng tổng lên bốn triệu',
      })
      .expect(201);
    expect(
      await prisma.hoaDon.findUniqueOrThrow({ where: { id: novemberId } }),
    ).toMatchObject({
      tongTien: 4000000n,
      tienDaThanhToanCache: 2000000n,
      trangThai: 'THANH_TOAN_MOT_PHAN',
    });
    await request(app.getHttpServer())
      .post(`/api/hoa-don/${novemberId}/dieu-chinh`)
      .set(auth())
      .send({
        loaiKhoan: LoaiKhoanHoaDon.GIAM_TRU,
        soTien: '2000000',
        lyDo: 'Giảm tổng đúng bằng số đã trả',
      })
      .expect(201);
    expect(
      await prisma.hoaDon.findUniqueOrThrow({ where: { id: novemberId } }),
    ).toMatchObject({
      tongTien: 2000000n,
      tienDaThanhToanCache: 2000000n,
      trangThai: 'DA_THANH_TOAN',
    });
    await request(app.getHttpServer())
      .post(`/api/hoa-don/${novemberId}/dieu-chinh`)
      .set(auth())
      .send({
        loaiKhoan: LoaiKhoanHoaDon.GIAM_TRU,
        soTien: '500000',
        lyDo: 'Không được thấp hơn tiền đã trả',
      })
      .expect(409);
    await createAndConfirm(decemberId, '1000000');
    expect(
      await prisma.hoaDon.findUniqueOrThrow({ where: { id: decemberId } }),
    ).toMatchObject({
      tienDaThanhToanCache: 1000000n,
      trangThai: 'THANH_TOAN_MOT_PHAN',
    });
    await createAndConfirm(decemberId, '2000000');
    expect(
      await prisma.hoaDon.findUniqueOrThrow({ where: { id: decemberId } }),
    ).toMatchObject({
      tienDaThanhToanCache: 3000000n,
      trangThai: 'DA_THANH_TOAN',
    });
    await prisma.hoaDon.update({
      where: { id: decemberId },
      data: { hanThanhToan: new Date('2020-01-01') },
    });
    expect(
      data<{ trangThai: string }>(
        await request(app.getHttpServer())
          .get(`/api/hoa-don/${decemberId}`)
          .set(auth())
          .expect(200),
      ).trangThai,
    ).toBe('DA_THANH_TOAN');
    const debt = data<{
      tongHoaDon: string;
      tongDaThanhToan: string;
      tongConNo: string;
    }>(
      await request(app.getHttpServer())
        .get(`/api/hop-dong/${hopDongId}/cong-no`)
        .set(auth())
        .expect(200),
    );
    expect(debt.tongConNo).toBe('0');
    expect(debt.tongHoaDon).toBe(debt.tongDaThanhToan);
  });
  it('locks the public link without deletion or token rotation', async () => {
    const before = await prisma.lienKetTraCuu.findUniqueOrThrow({
      where: { hoaDonId },
    });
    await request(app.getHttpServer())
      .post(`/api/hoa-don/${hoaDonId}/lien-ket/khoa`)
      .set(auth())
      .send({})
      .expect(201);
    const after = await prisma.lienKetTraCuu.findUniqueOrThrow({
      where: { hoaDonId },
    });
    expect(after.id).toBe(before.id);
    expect(after.tokenHash).toBe(before.tokenHash);
    expect(after.trangThai).toBe('DA_KHOA');
    await request(app.getHttpServer())
      .get(`/api/public/hoa-don/${publicToken}`)
      .expect(404);
    expect(
      await prisma.nhatKyHeThong.count({
        where: { doiTuongId: hoaDonId, hanhDong: 'LIEN_KET_HOA_DON_KHOA' },
      }),
    ).toBe(1);
  });
});
