-- A periodic invoice has exactly one collectible record for a contract and period.
-- Other invoice types intentionally remain repeatable.
CREATE UNIQUE INDEX "uq_hoa_don_dinh_ky_hop_dong_ky"
ON "hoa_don" ("hop_dong_id", "ngay_bat_dau_ky", "ngay_ket_thuc_ky")
WHERE "loai_hoa_don" = 'DINH_KY';

-- A stored service occurrence may be consumed by at most one invoice detail.
CREATE UNIQUE INDEX "uq_chi_tiet_hoa_don_phat_sinh_dich_vu"
ON "chi_tiet_hoa_don" (("du_lieu_nguon" ->> 'phatSinhDichVuId'))
WHERE "du_lieu_nguon" ->> 'phatSinhDichVuId' IS NOT NULL;

-- Normalize meter-reading consumption so uniqueness applies to each source ID,
-- including when two invoice details contain only partially overlapping sets.
CREATE TABLE "nguon_chi_so_hoa_don" (
  "chi_tiet_hoa_don_id" UUID NOT NULL,
  "chi_so_cong_to_id" UUID NOT NULL,

  CONSTRAINT "nguon_chi_so_hoa_don_pkey"
    PRIMARY KEY ("chi_tiet_hoa_don_id", "chi_so_cong_to_id"),
  CONSTRAINT "nguon_chi_so_hoa_don_chi_tiet_hoa_don_id_fkey"
    FOREIGN KEY ("chi_tiet_hoa_don_id") REFERENCES "chi_tiet_hoa_don"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "nguon_chi_so_hoa_don_chi_so_cong_to_id_fkey"
    FOREIGN KEY ("chi_so_cong_to_id") REFERENCES "chi_so_cong_to"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "nguon_chi_so_hoa_don" (
  "chi_tiet_hoa_don_id",
  "chi_so_cong_to_id"
)
SELECT DISTINCT
  "chi_tiet_hoa_don"."id",
  "chi_so_id"."value"::UUID
FROM "chi_tiet_hoa_don"
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE
    WHEN jsonb_typeof(
      "chi_tiet_hoa_don"."du_lieu_nguon" -> 'chiSoCongToIds'
    ) = 'array'
    THEN "chi_tiet_hoa_don"."du_lieu_nguon" -> 'chiSoCongToIds'
    ELSE '[]'::JSONB
  END
) AS "chi_so_id"("value");

CREATE UNIQUE INDEX "uq_nguon_chi_so_hoa_don_chi_so_cong_to"
ON "nguon_chi_so_hoa_don" ("chi_so_cong_to_id");

CREATE INDEX "nguon_chi_so_hoa_don_chi_tiet_hoa_don_id_idx"
ON "nguon_chi_so_hoa_don" ("chi_tiet_hoa_don_id");
