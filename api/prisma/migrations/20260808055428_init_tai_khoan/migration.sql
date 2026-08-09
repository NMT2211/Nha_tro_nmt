-- CreateTable
CREATE TABLE "tai_khoan" (
    "id" UUID NOT NULL,
    "ho_ten" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "so_dien_thoai" TEXT,
    "mat_khau_hash" TEXT NOT NULL,
    "avatar_url" TEXT,
    "trang_thai" TEXT NOT NULL DEFAULT 'HOAT_DONG',
    "lan_dang_nhap_cuoi" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tai_khoan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tai_khoan_email_key" ON "tai_khoan"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tai_khoan_so_dien_thoai_key" ON "tai_khoan"("so_dien_thoai");
