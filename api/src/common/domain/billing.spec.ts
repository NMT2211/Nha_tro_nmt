import { Prisma } from '../../../generated/prisma/client';
import {
  multiplyDecimalMoney,
  tinhCoDinh,
  tinhSanLuongCongTo,
  tinhTheoSoLuong,
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
});
