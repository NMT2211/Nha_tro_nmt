import { Prisma } from '../../../generated/prisma/client';

export interface KetQuaTinhDichVu {
  soLuong: string;
  donGia: string;
  thanhTien: string;
  chiTiet: Record<string, string | boolean>;
}

const SCALE = 1000n;

export function decimalToScaled(value: string | Prisma.Decimal): bigint {
  const text = value.toString();
  if (!/^\d+(\.\d{1,3})?$/.test(text))
    throw new RangeError(
      'Số lượng phải là số không âm, tối đa 3 chữ số thập phân',
    );
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(3, '0'));
}

export function scaledToDecimal(value: bigint): string {
  const whole = value / SCALE;
  const fraction = (value % SCALE)
    .toString()
    .padStart(3, '0')
    .replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function multiplyDecimalMoney(
  quantity: string | Prisma.Decimal,
  unitPrice: bigint,
): bigint {
  return (decimalToScaled(quantity) * unitPrice) / SCALE;
}

export function tinhTheoSoLuong(input: {
  soLuong: string | Prisma.Decimal;
  donGia: bigint;
  soLuongBaoGom?: string | Prisma.Decimal | null;
  donGiaVuotMuc?: bigint | null;
  mucToiThieu?: string | Prisma.Decimal | null;
}): KetQuaTinhDichVu {
  const quantity = decimalToScaled(input.soLuong);
  const included = input.soLuongBaoGom
    ? decimalToScaled(input.soLuongBaoGom)
    : 0n;
  const billable = quantity > included ? quantity - included : 0n;
  const minimum = input.mucToiThieu ? decimalToScaled(input.mucToiThieu) : 0n;
  const normal = minimum > billable ? minimum : billable;
  let total: bigint;
  if (input.donGiaVuotMuc != null && minimum > 0n && normal > minimum) {
    total =
      (minimum * input.donGia + (normal - minimum) * input.donGiaVuotMuc) /
      SCALE;
  } else total = (normal * input.donGia) / SCALE;
  return {
    soLuong: scaledToDecimal(quantity),
    donGia: input.donGia.toString(),
    thanhTien: total.toString(),
    chiTiet: {
      soLuongTinhPhi: scaledToDecimal(normal),
      soLuongBaoGom: scaledToDecimal(included),
      apDungMucToiThieu: minimum > billable,
    },
  };
}

export function tinhCoDinh(donGia: bigint, soNgay = 30): KetQuaTinhDichVu {
  if (!Number.isInteger(soNgay) || soNgay < 0 || soNgay > 30)
    throw new RangeError('Số ngày tính phí phải từ 0 đến 30');
  const total = (donGia * BigInt(soNgay)) / 30n;
  return {
    soLuong: soNgay === 30 ? '1' : `${soNgay}/30`,
    donGia: donGia.toString(),
    thanhTien: total.toString(),
    chiTiet: { soNgay: soNgay.toString(), mauSoNgay: '30' },
  };
}

export function tinhSanLuongCongTo(
  chiSoCu: string | Prisma.Decimal,
  chiSoMoi: string | Prisma.Decimal,
  heSoNhan: string | Prisma.Decimal,
): Prisma.Decimal {
  const oldValue = new Prisma.Decimal(chiSoCu);
  const newValue = new Prisma.Decimal(chiSoMoi);
  if (newValue.lessThan(oldValue))
    throw new RangeError('Chỉ số mới không được nhỏ hơn chỉ số cũ');
  return newValue.minus(oldValue).times(new Prisma.Decimal(heSoNhan));
}
