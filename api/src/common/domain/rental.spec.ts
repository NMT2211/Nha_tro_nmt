import { TrangThaiHopDong } from '../../../generated/prisma/client';
import {
  canTransitionHopDong,
  canTransitionTraPhong,
  daysBetween,
  parseDateOnly,
  prorate30Days,
  requiresImmediateFirstRent,
} from './rental';

describe('rental domain', () => {
  it('prorates money exactly with a fixed 30-day denominator', () => {
    expect(prorate30Days(3_000_000n, 10)).toBe(1_000_000n);
    expect(prorate30Days(1_000_001n, 1)).toBe(33_333n);
  });
  it('uses date-only UTC semantics across month boundaries', () => {
    const start = parseDateOnly('2026-02-28');
    const end = parseDateOnly('2026-03-02');
    expect(daysBetween(start, end)).toBe(2);
    expect(start.toISOString()).toBe('2026-02-28T00:00:00.000Z');
  });
  it('marks move-in before day 10 for immediate collection', () => {
    expect(requiresImmediateFirstRent(parseDateOnly('2026-01-09'))).toBe(true);
    expect(requiresImmediateFirstRent(parseDateOnly('2026-01-10'))).toBe(false);
  });
  it.each([
    ['NHAP', 'CHO_NHAN_PHONG', true],
    ['NHAP', 'DA_HUY', true],
    ['CHO_NHAN_PHONG', 'DANG_HIEU_LUC', true],
    ['DANG_HIEU_LUC', 'CHO_TRA_PHONG', true],
    ['CHO_TRA_PHONG', 'DA_KET_THUC', true],
    ['NHAP', 'DA_KET_THUC', false],
    ['DA_KET_THUC', 'DANG_HIEU_LUC', false],
    ['DA_HUY', 'CHO_NHAN_PHONG', false],
  ])('%s -> %s is %s', (from, to, expected) => {
    expect(
      canTransitionHopDong(from as TrangThaiHopDong, to as TrangThaiHopDong),
    ).toBe(expected);
  });
  it('enforces the checkout workflow', () => {
    expect(canTransitionTraPhong('MOI_TAO', 'DA_XAC_NHAN')).toBe(true);
    expect(canTransitionTraPhong('MOI_TAO', 'HOAN_TAT')).toBe(false);
    expect(canTransitionTraPhong('CHO_QUYET_TOAN', 'HOAN_TAT')).toBe(true);
  });
});
