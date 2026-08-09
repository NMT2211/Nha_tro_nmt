-- This is an empty migration.CREATE UNIQUE INDEX "uq_hop_dong_phong_dang_hoat_dong"
CREATE UNIQUE INDEX "uq_hop_dong_phong_dang_hoat_dong"
ON "hop_dong" ("phong_id")
WHERE "trang_thai" IN (
    'CHO_NHAN_PHONG',
    'DANG_HIEU_LUC',
    'CHO_TRA_PHONG'
);