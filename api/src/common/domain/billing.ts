import { Prisma } from '../../../generated/prisma/client';
import { TrangThaiHoaDon } from '../../../generated/prisma/client';

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

export function tongTienHoaDon(
  lines: readonly { thanhTien: bigint }[],
): bigint {
  const total = lines.reduce((sum, line) => sum + line.thanhTien, 0n);
  if (total < 0n) throw new RangeError('Tổng hóa đơn không được âm');
  return total;
}

export function trangThaiTheoThanhToan(input: {
  tongTien: bigint;
  daThanhToan: bigint;
  hanThanhToan: Date;
  now?: Date;
}): TrangThaiHoaDon {
  if (input.daThanhToan < 0n || input.daThanhToan > input.tongTien)
    throw new RangeError('Số tiền đã thanh toán không hợp lệ');
  if (input.daThanhToan >= input.tongTien) return TrangThaiHoaDon.DA_THANH_TOAN;
  if (input.daThanhToan > 0n) return TrangThaiHoaDon.THANH_TOAN_MOT_PHAN;
  const now = input.now ?? new Date();
  return input.hanThanhToan <
    new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    )
    ? TrangThaiHoaDon.QUA_HAN
    : TrangThaiHoaDon.CHO_THANH_TOAN;
}

export function tinhCongNo(
  invoices: readonly { tongTien: bigint; daThanhToan: bigint }[],
) {
  const tongHoaDon = invoices.reduce((sum, row) => sum + row.tongTien, 0n);
  const tongDaThanhToan = invoices.reduce(
    (sum, row) => sum + row.daThanhToan,
    0n,
  );
  if (tongDaThanhToan > tongHoaDon)
    throw new RangeError('Số tiền đã thanh toán vượt quá tổng hóa đơn');
  return {
    tongHoaDon,
    tongDaThanhToan,
    tongConNo: tongHoaDon - tongDaThanhToan,
  };
}

export function kiemTraPhanBo(input: {
  soTienPhieuThu: bigint;
  phanBos: readonly { soTien: bigint; conNo: bigint }[];
}): void {
  if (input.soTienPhieuThu <= 0n || input.phanBos.length === 0)
    throw new RangeError('Phiếu thu và phân bổ phải lớn hơn 0');
  let total = 0n;
  for (const row of input.phanBos) {
    if (row.soTien <= 0n)
      throw new RangeError('Số tiền phân bổ phải lớn hơn 0');
    if (row.soTien > row.conNo)
      throw new RangeError('Số tiền phân bổ vượt quá công nợ');
    total += row.soTien;
  }
  if (total !== input.soTienPhieuThu)
    throw new RangeError('Tổng phân bổ phải bằng số tiền phiếu thu');
}

export function kiemTraTongSauDieuChinh(
  tongTienMoi: bigint,
  daThanhToan: bigint,
): void {
  if (tongTienMoi < 0n) throw new RangeError('Tổng hóa đơn không được âm');
  if (tongTienMoi < daThanhToan)
    throw new RangeError(
      'Không thể giảm tổng hóa đơn thấp hơn số tiền đã thanh toán',
    );
}
