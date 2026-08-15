import { Prisma } from '../../../generated/prisma/client';
import {
  multiplyDecimalMoney,
  kiemTraPhanBo,
  kiemTraTongSauDieuChinh,
  tinhCoDinh,
  tinhSanLuongCongTo,
  tinhTheoSoLuong,
  tongTienHoaDon,
  trangThaiTheoThanhToan,
  tinhCongNo,
} from './billing';

describe('billing exact calculations', () => {
  it('multiplies Decimal and BigInt without floating point', () => {
    expect(multiplyDecimalMoney('9007199254740.123', 9007199254740993n)).toBe(
      81129638414598863446835889962n,
    );
  });
  it('calculates fixed fee and 30-day proration', () => {
    expect(tinhCoDinh(300001n, 15).thanhTien).toBe('150000');
  });
  it('applies included quantity and minimum', () => {
    expect(
      tinhTheoSoLuong({
        soLuong: '2.5',
        donGia: 1000n,
        soLuongBaoGom: '1',
        mucToiThieu: '2',
      }).thanhTien,
    ).toBe('2000');
  });
  it('applies an over-limit unit price', () => {
    expect(
      tinhTheoSoLuong({
        soLuong: '5',
        donGia: 1000n,
        mucToiThieu: '2',
        donGiaVuotMuc: 2000n,
      }).thanhTien,
    ).toBe('8000');
  });
  it('calculates meter multiplier exactly', () => {
    expect(tinhSanLuongCongTo('100.125', '150.375', '1.5').toString()).toBe(
      new Prisma.Decimal('75.375').toString(),
    );
  });
  it('centralizes exact totals and rejects a negative final total', () => {
    expect(
      tongTienHoaDon([{ thanhTien: 3_000_000n }, { thanhTien: -50_000n }]),
    ).toBe(2_950_000n);
    expect(() => tongTienHoaDon([{ thanhTien: -1n }])).toThrow();
  });
  it.each([
    [0n, 'CHO_THANH_TOAN'],
    [1_000_000n, 'THANH_TOAN_MOT_PHAN'],
    [3_000_000n, 'DA_THANH_TOAN'],
  ])('derives payment status for %s', (daThanhToan, expected) => {
    expect(
      trangThaiTheoThanhToan({
        tongTien: 3_000_000n,
        daThanhToan,
        hanThanhToan: new Date('2099-01-01'),
        now: new Date('2026-01-01'),
      }),
    ).toBe(expected);
  });
  it('derives overdue without changing paid invoices', () => {
    expect(
      trangThaiTheoThanhToan({
        tongTien: 1n,
        daThanhToan: 0n,
        hanThanhToan: new Date('2026-01-01'),
        now: new Date('2026-01-02'),
      }),
    ).toBe('QUA_HAN');
    expect(() =>
      trangThaiTheoThanhToan({
        tongTien: 1n,
        daThanhToan: 2n,
        hanThanhToan: new Date('2026-01-01'),
      }),
    ).toThrow();
  });
  it('prioritizes partial-payment state over overdue while preserving debt', () => {
    expect(
      trangThaiTheoThanhToan({
        tongTien: 3_000_000n,
        daThanhToan: 1_000_000n,
        hanThanhToan: new Date('2026-01-01'),
        now: new Date('2026-01-02'),
      }),
    ).toBe('THANH_TOAN_MOT_PHAN');
  });
  it('accepts edited total equal to paid and rejects a lower total', () => {
    expect(() => kiemTraTongSauDieuChinh(2_000_000n, 2_000_000n)).not.toThrow();
    expect(() => kiemTraTongSauDieuChinh(1_999_999n, 2_000_000n)).toThrow();
  });
  it('summarizes debt exactly', () => {
    expect(
      tinhCongNo([
        { tongTien: 3_000_000n, daThanhToan: 1_000_000n },
        { tongTien: 2_000_000n, daThanhToan: 0n },
      ]),
    ).toEqual({
      tongHoaDon: 5_000_000n,
      tongDaThanhToan: 1_000_000n,
      tongConNo: 4_000_000n,
    });
  });
  it('validates exact receipt allocation and rejects zero, excess, or unassigned money', () => {
    expect(() =>
      kiemTraPhanBo({
        soTienPhieuThu: 3n,
        phanBos: [{ soTien: 3n, conNo: 3n }],
      }),
    ).not.toThrow();
    expect(() =>
      kiemTraPhanBo({
        soTienPhieuThu: 3n,
        phanBos: [{ soTien: 0n, conNo: 3n }],
      }),
    ).toThrow();
    expect(() =>
      kiemTraPhanBo({
        soTienPhieuThu: 4n,
        phanBos: [{ soTien: 4n, conNo: 3n }],
      }),
    ).toThrow();
    expect(() =>
      kiemTraPhanBo({
        soTienPhieuThu: 4n,
        phanBos: [{ soTien: 3n, conNo: 3n }],
      }),
    ).toThrow();
  });
});
