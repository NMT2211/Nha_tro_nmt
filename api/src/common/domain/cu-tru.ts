import {
  LoaiDiaChi,
  TrangThaiHoSoCuTru,
} from '../../../generated/prisma/client';

export const HO_SO_TRANSITIONS: Readonly<
  Record<TrangThaiHoSoCuTru, readonly TrangThaiHoSoCuTru[]>
> = {
  CHUA_TAO: ['DA_TAO'],
  DA_TAO: ['CHO_GUI'],
  CHO_GUI: ['DA_GUI'],
  DA_GUI: ['DA_TIEP_NHAN'],
  DA_TIEP_NHAN: ['DA_DUYET', 'YEU_CAU_BO_SUNG', 'BI_TU_CHOI'],
  YEU_CAU_BO_SUNG: ['DA_TAO', 'CHO_GUI'],
  DA_DUYET: ['HET_HAN', 'DA_KET_THUC'],
  BI_TU_CHOI: [],
  HET_HAN: ['DA_KET_THUC'],
  DA_KET_THUC: [],
};

export function canTransitionHoSo(
  from: TrangThaiHoSoCuTru,
  to: TrangThaiHoSoCuTru,
) {
  return HO_SO_TRANSITIONS[from].includes(to);
}

export function deriveHoSoStatus(
  status: TrangThaiHoSoCuTru,
  denNgay: Date | null,
  at = new Date(),
) {
  if (!denNgay || ['BI_TU_CHOI', 'DA_KET_THUC'].includes(status)) return status;
  return denNgay <
    new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()))
    ? TrangThaiHoSoCuTru.HET_HAN
    : status;
}

export function guestStayDays(start: Date, end: Date) {
  if (end < start)
    throw new RangeError('Thời gian rời đi không được trước thời gian đến');
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
}

export function guestChargeableDays(stayDays: number, freeDays: number) {
  if (
    !Number.isInteger(stayDays) ||
    !Number.isInteger(freeDays) ||
    stayDays < 0 ||
    freeDays < 0
  )
    throw new RangeError('Số ngày không hợp lệ');
  return Math.max(0, stayDays - freeDays);
}

type AddressCandidate = {
  loaiDiaChi: LoaiDiaChi;
  laHienTai: boolean;
  tuNgay: Date | null;
  denNgay: Date | null;
  id: string;
};
const ADDRESS_PRIORITY: LoaiDiaChi[] = [
  LoaiDiaChi.NOI_O_HIEN_TAI,
  LoaiDiaChi.THUONG_TRU,
  LoaiDiaChi.TAM_TRU,
  LoaiDiaChi.QUE_QUAN,
];

export function selectResidenceAddress<T extends AddressCandidate>(
  rows: T[],
  at: Date,
): T | undefined {
  return [...rows]
    .filter(
      (r) => (!r.tuNgay || r.tuNgay <= at) && (!r.denNgay || r.denNgay >= at),
    )
    .sort(
      (a, b) =>
        Number(b.laHienTai) - Number(a.laHienTai) ||
        ADDRESS_PRIORITY.indexOf(a.loaiDiaChi) -
          ADDRESS_PRIORITY.indexOf(b.loaiDiaChi) ||
        (b.tuNgay?.getTime() ?? 0) - (a.tuNgay?.getTime() ?? 0) ||
        b.id.localeCompare(a.id),
    )[0];
}

type DocumentCandidate = {
  laGiayToChinh: boolean;
  ngayHetHan: Date | null;
  createdAt: Date;
  id: string;
};
export function selectPrimaryDocument<T extends DocumentCandidate>(
  rows: T[],
  at: Date,
): { document?: T; ambiguous: boolean } {
  const valid = rows.filter((r) => !r.ngayHetHan || r.ngayHetHan >= at);
  const primary = valid.filter((r) => r.laGiayToChinh);
  const pool = primary.length ? primary : valid;
  pool.sort(
    (a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id),
  );
  return { document: pool[0], ambiguous: primary.length > 1 };
}
