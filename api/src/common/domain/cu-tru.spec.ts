import { LoaiDiaChi } from '../../../generated/prisma/client';
import {
  canTransitionHoSo,
  deriveHoSoStatus,
  guestChargeableDays,
  guestStayDays,
  selectPrimaryDocument,
  selectResidenceAddress,
} from './cu-tru';
describe('cu-tru domain', () => {
  it('enforces HoSo lifecycle', () => {
    expect(canTransitionHoSo('CHUA_TAO', 'DA_TAO')).toBe(true);
    expect(canTransitionHoSo('CHUA_TAO', 'DA_DUYET')).toBe(false);
  });
  it('derives expiry without overriding terminal status', () => {
    const past = new Date('2020-01-01Z');
    expect(deriveHoSoStatus('DA_DUYET', past, new Date('2020-01-02Z'))).toBe(
      'HET_HAN',
    );
    expect(deriveHoSoStatus('DA_KET_THUC', past)).toBe('DA_KET_THUC');
  });
  it('calculates guest days and threshold', () => {
    expect(
      guestStayDays(
        new Date('2026-01-01T12:00Z'),
        new Date('2026-01-08T12:01Z'),
      ),
    ).toBe(8);
    expect(guestChargeableDays(8, 7)).toBe(1);
    expect(guestChargeableDays(2, 7)).toBe(0);
  });
  it('selects current address deterministically', () => {
    const rows = [
      {
        id: 'a',
        loaiDiaChi: LoaiDiaChi.THUONG_TRU,
        laHienTai: true,
        tuNgay: null,
        denNgay: null,
      },
      {
        id: 'b',
        loaiDiaChi: LoaiDiaChi.NOI_O_HIEN_TAI,
        laHienTai: true,
        tuNgay: null,
        denNgay: null,
      },
    ];
    expect(selectResidenceAddress(rows, new Date())?.id).toBe('b');
  });
  it('excludes historical/future addresses outside the applicable period', () => {
    const at = new Date('2026-06-01Z');
    const rows = [
      {
        id: 'past',
        loaiDiaChi: LoaiDiaChi.NOI_O_HIEN_TAI,
        laHienTai: true,
        tuNgay: new Date('2025-01-01Z'),
        denNgay: new Date('2025-12-31Z'),
      },
      {
        id: 'current',
        loaiDiaChi: LoaiDiaChi.THUONG_TRU,
        laHienTai: false,
        tuNgay: new Date('2026-01-01Z'),
        denNgay: null,
      },
    ];
    expect(selectResidenceAddress(rows, at)?.id).toBe('current');
  });
  it('selects latest primary document and reports ambiguity', () => {
    const rows = [
      {
        id: 'a',
        laGiayToChinh: true,
        ngayHetHan: null,
        createdAt: new Date('2025-01-01'),
      },
      {
        id: 'b',
        laGiayToChinh: true,
        ngayHetHan: null,
        createdAt: new Date('2026-01-01'),
      },
    ];
    expect(selectPrimaryDocument(rows, new Date())).toMatchObject({
      document: { id: 'b' },
      ambiguous: true,
    });
  });
  it('selects the latest valid non-primary document deterministically', () => {
    const rows = [
      {
        id: 'old',
        laGiayToChinh: false,
        ngayHetHan: null,
        createdAt: new Date('2025-01-01'),
      },
      {
        id: 'new',
        laGiayToChinh: false,
        ngayHetHan: null,
        createdAt: new Date('2026-01-01'),
      },
    ];
    expect(selectPrimaryDocument(rows, new Date('2026-02-01'))).toMatchObject({
      document: { id: 'new' },
      ambiguous: false,
    });
  });
});
