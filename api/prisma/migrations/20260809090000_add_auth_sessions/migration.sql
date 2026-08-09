CREATE TABLE "phien_dang_nhap" (
    "id" UUID NOT NULL,
    "tai_khoan_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "replaced_by_session_id" UUID,
    "dia_chi_ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    CONSTRAINT "phien_dang_nhap_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "phien_dang_nhap_tai_khoan_id_revoked_at_idx"
ON "phien_dang_nhap"("tai_khoan_id", "revoked_at");

CREATE INDEX "phien_dang_nhap_expires_at_idx"
ON "phien_dang_nhap"("expires_at");

ALTER TABLE "phien_dang_nhap"
ADD CONSTRAINT "phien_dang_nhap_tai_khoan_id_fkey"
FOREIGN KEY ("tai_khoan_id") REFERENCES "tai_khoan"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
