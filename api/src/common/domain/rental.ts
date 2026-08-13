import {
  TrangThaiHopDong,
  TrangThaiTraPhong,
} from '../../../generated/prisma/client';

const DAY_MS = 86_400_000;

export const ACTIVE_HOP_DONG_STATUSES: TrangThaiHopDong[] = [
  TrangThaiHopDong.CHO_NHAN_PHONG,
  TrangThaiHopDong.DANG_HIEU_LUC,
  TrangThaiHopDong.CHO_TRA_PHONG,
];

export const HOP_DONG_TRANSITIONS: Readonly<
  Record<TrangThaiHopDong, readonly TrangThaiHopDong[]>
> = {
  NHAP: ['CHO_NHAN_PHONG', 'DA_HUY'],
  CHO_NHAN_PHONG: ['DANG_HIEU_LUC', 'DA_HUY'],
  DANG_HIEU_LUC: ['CHO_TRA_PHONG'],
  CHO_TRA_PHONG: ['DA_KET_THUC'],
  DA_KET_THUC: [],
  DA_HUY: [],
};

export function canTransitionHopDong(
  from: TrangThaiHopDong,
  to: TrangThaiHopDong,
): boolean {
  return HOP_DONG_TRANSITIONS[from].includes(to);
}

const TRA_PHONG_TRANSITIONS: Readonly<
  Record<TrangThaiTraPhong, readonly TrangThaiTraPhong[]>
> = {
  MOI_TAO: ['DA_XAC_NHAN', 'DA_HUY'],
  DA_XAC_NHAN: [
    'CHO_CHOT_DIEN_NUOC',
    'CHO_KIEM_TRA_PHONG',
    'CHO_QUYET_TOAN',
    'DA_HUY',
  ],
  CHO_CHOT_DIEN_NUOC: ['CHO_KIEM_TRA_PHONG', 'CHO_QUYET_TOAN', 'DA_HUY'],
  CHO_KIEM_TRA_PHONG: ['CHO_QUYET_TOAN', 'DA_HUY'],
  CHO_QUYET_TOAN: ['DA_HOAN_COC', 'HOAN_TAT', 'DA_HUY'],
  DA_HOAN_COC: ['HOAN_TAT'],
  HOAN_TAT: [],
  DA_HUY: [],
};

export function canTransitionTraPhong(
  from: TrangThaiTraPhong,
  to: TrangThaiTraPhong,
): boolean {
  return TRA_PHONG_TRANSITIONS[from].includes(to);
}

export function prorate30Days(monthlyAmount: bigint, days: number): bigint {
  if (monthlyAmount < 0n || !Number.isInteger(days) || days < 0)
    throw new RangeError('Số tiền và số ngày phải là số không âm');
  return (monthlyAmount * BigInt(days)) / 30n;
}

export function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new RangeError('Ngày phải có định dạng YYYY-MM-DD');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    throw new RangeError('Ngày không hợp lệ');
  return date;
}

export function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS);
}

export function requiresImmediateFirstRent(start: Date): boolean {
  return start.getUTCDate() < 10;
}
