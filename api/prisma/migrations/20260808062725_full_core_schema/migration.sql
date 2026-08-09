/*
  Warnings:

  - The `trang_thai` column on the `tai_khoan` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TrangThaiTaiKhoan" AS ENUM ('HOAT_DONG', 'TAM_KHOA', 'BI_KHOA');

-- CreateEnum
CREATE TYPE "TrangThaiChung" AS ENUM ('HOAT_DONG', 'TAM_DUNG', 'NGUNG_HOAT_DONG');

-- CreateEnum
CREATE TYPE "LoaiKhoiNha" AS ENUM ('DAY_TRO', 'TOA_NHA', 'BLOCK', 'KHU_VUC');

-- CreateEnum
CREATE TYPE "TrangThaiPhong" AS ENUM ('DANG_TRONG', 'DA_DAT_COC', 'CHO_NHAN_PHONG', 'DANG_O', 'SAP_TRA', 'DANG_SUA_CHUA', 'TAM_KHOA', 'NGUNG_KINH_DOANH');

-- CreateEnum
CREATE TYPE "GioiTinh" AS ENUM ('NAM', 'NU', 'KHAC', 'KHONG_XAC_DINH');

-- CreateEnum
CREATE TYPE "LoaiGiayTo" AS ENUM ('CCCD', 'CMND', 'GIAY_KHAI_SINH', 'GIAY_TO_KHAC');

-- CreateEnum
CREATE TYPE "LoaiDiaChi" AS ENUM ('THUONG_TRU', 'TAM_TRU', 'QUE_QUAN', 'NOI_O_HIEN_TAI');

-- CreateEnum
CREATE TYPE "TrangThaiHopDong" AS ENUM ('NHAP', 'CHO_NHAN_PHONG', 'DANG_HIEU_LUC', 'CHO_TRA_PHONG', 'DA_KET_THUC', 'DA_HUY');

-- CreateEnum
CREATE TYPE "VaiTroThanhVienHopDong" AS ENUM ('NGUOI_DAI_DIEN', 'NGUOI_DUNG_TEN', 'NGUOI_CUNG_O', 'TRE_EM', 'NGUOI_O_NHO');

-- CreateEnum
CREATE TYPE "QuyTacTinhNgayLe" AS ENUM ('THEO_30_NGAY');

-- CreateEnum
CREATE TYPE "XuLyBaoTre" AS ENUM ('MAT_TOAN_BO_COC', 'KHAU_TRU_THEO_TY_LE', 'KHAU_TRU_SO_TIEN', 'PHAT_THEO_NGAY', 'XU_LY_THU_CONG', 'KHONG_PHAT');

-- CreateEnum
CREATE TYPE "TrangThaiTraPhong" AS ENUM ('MOI_TAO', 'DA_XAC_NHAN', 'CHO_CHOT_DIEN_NUOC', 'CHO_KIEM_TRA_PHONG', 'CHO_QUYET_TOAN', 'DA_HOAN_COC', 'HOAN_TAT', 'DA_HUY');

-- CreateEnum
CREATE TYPE "LoaiGiaoDichCoc" AS ENUM ('THU_COC', 'BO_SUNG_COC', 'HOAN_COC', 'KHAU_TRU_COC', 'CHUYEN_COC', 'DIEU_CHINH_COC');

-- CreateEnum
CREATE TYPE "PhuongThucThanhToan" AS ENUM ('TIEN_MAT', 'CHUYEN_KHOAN', 'VIETQR', 'CONG_THANH_TOAN', 'KHAU_TRU_COC', 'KHAC');

-- CreateEnum
CREATE TYPE "LoaiDichVu" AS ENUM ('DIEN', 'NUOC', 'WIFI', 'RAC', 'GIU_XE', 'MAY_GIAT', 'PHI_QUAN_LY', 'KHAC');

-- CreateEnum
CREATE TYPE "KieuTinhDichVu" AS ENUM ('THEO_CHI_SO', 'THEO_NGUOI', 'CO_DINH_PHONG', 'THEO_SO_LUONG', 'THEO_NGAY', 'THEO_LAN', 'NHAP_TAY', 'MIEN_PHI');

-- CreateEnum
CREATE TYPE "LoaiCongTo" AS ENUM ('DIEN', 'NUOC');

-- CreateEnum
CREATE TYPE "NguonChiSo" AS ENUM ('NHAP_TAY', 'IMPORT_EXCEL', 'ANH_CHUP', 'OCR', 'API_IOT');

-- CreateEnum
CREATE TYPE "TrangThaiChiSo" AS ENUM ('NHAP', 'DA_CHOT', 'DA_DIEU_CHINH', 'DA_HUY');

-- CreateEnum
CREATE TYPE "LoaiHoaDon" AS ENUM ('DAU_VAO', 'DINH_KY', 'PHAT_SINH', 'DIEU_CHINH', 'QUYET_TOAN_TRA_PHONG');

-- CreateEnum
CREATE TYPE "TrangThaiHoaDon" AS ENUM ('NHAP', 'DA_PHAT_HANH', 'CHO_THANH_TOAN', 'THANH_TOAN_MOT_PHAN', 'DA_THANH_TOAN', 'QUA_HAN', 'DA_HUY', 'DA_DIEU_CHINH');

-- CreateEnum
CREATE TYPE "LoaiKhoanHoaDon" AS ENUM ('TIEN_PHONG', 'TIEN_DIEN', 'TIEN_NUOC', 'DICH_VU', 'PHU_THU_NGUOI', 'PHU_THU_KHACH', 'GIAM_TRU', 'CONG_NO_CU', 'PHAT_SINH', 'KHAU_TRU_COC');

-- CreateEnum
CREATE TYPE "ThoiDiemTinh" AS ENUM ('TRA_TRUOC', 'TRA_SAU');

-- CreateEnum
CREATE TYPE "TrangThaiPhieuThu" AS ENUM ('CHO_XAC_NHAN', 'THANH_CONG', 'DA_HUY');

-- CreateEnum
CREATE TYPE "TrangThaiLienKet" AS ENUM ('HOAT_DONG', 'HET_HAN', 'DA_KHOA');

-- CreateEnum
CREATE TYPE "LoaiHoSoCuTru" AS ENUM ('DANG_KY_TAM_TRU', 'GIA_HAN_TAM_TRU', 'DIEU_CHINH_TAM_TRU', 'KET_THUC_TAM_TRU', 'THONG_BAO_LUU_TRU', 'THONG_BAO_TAM_VANG');

-- CreateEnum
CREATE TYPE "TrangThaiHoSoCuTru" AS ENUM ('CHUA_TAO', 'DA_TAO', 'CHO_GUI', 'DA_GUI', 'DA_TIEP_NHAN', 'YEU_CAU_BO_SUNG', 'DA_DUYET', 'BI_TU_CHOI', 'HET_HAN', 'DA_KET_THUC');

-- CreateEnum
CREATE TYPE "TrangThaiKhachLuuTru" AS ENUM ('DANG_LUU_TRU', 'DA_ROI_DI', 'DA_HUY');

-- CreateEnum
CREATE TYPE "TrangThaiTamVang" AS ENUM ('DANG_TAM_VANG', 'DA_QUAY_LAI', 'DA_HUY');

-- AlterTable
ALTER TABLE "tai_khoan" DROP COLUMN "trang_thai",
ADD COLUMN     "trang_thai" "TrangThaiTaiKhoan" NOT NULL DEFAULT 'HOAT_DONG';

-- CreateTable
CREATE TABLE "to_chuc" (
    "id" UUID NOT NULL,
    "ma_to_chuc" TEXT NOT NULL,
    "ten_to_chuc" TEXT NOT NULL,
    "email" TEXT,
    "so_dien_thoai" TEXT,
    "trang_thai" "TrangThaiChung" NOT NULL DEFAULT 'HOAT_DONG',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "to_chuc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vai_tro" (
    "id" UUID NOT NULL,
    "to_chuc_id" UUID,
    "ma_vai_tro" TEXT NOT NULL,
    "ten_vai_tro" TEXT NOT NULL,
    "la_mac_dinh" BOOLEAN NOT NULL DEFAULT false,
    "la_he_thong" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vai_tro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quyen" (
    "id" UUID NOT NULL,
    "ma_quyen" TEXT NOT NULL,
    "ten_quyen" TEXT NOT NULL,
    "nhom_quyen" TEXT NOT NULL,

    CONSTRAINT "quyen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vai_tro_quyen" (
    "vai_tro_id" UUID NOT NULL,
    "quyen_id" UUID NOT NULL,

    CONSTRAINT "vai_tro_quyen_pkey" PRIMARY KEY ("vai_tro_id","quyen_id")
);

-- CreateTable
CREATE TABLE "thanh_vien_to_chuc" (
    "id" UUID NOT NULL,
    "to_chuc_id" UUID NOT NULL,
    "tai_khoan_id" UUID NOT NULL,
    "vai_tro_id" UUID NOT NULL,
    "nguoi_moi_id" UUID,
    "trang_thai" "TrangThaiChung" NOT NULL DEFAULT 'HOAT_DONG',
    "ngay_tham_gia" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thanh_vien_to_chuc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khu_tro" (
    "id" UUID NOT NULL,
    "to_chuc_id" UUID NOT NULL,
    "ma_khu" TEXT NOT NULL,
    "ten_khu" TEXT NOT NULL,
    "so_dien_thoai" TEXT,
    "email" TEXT,
    "dia_chi_day_du" TEXT,
    "ma_tinh_thanh" TEXT,
    "ma_quan_huyen" TEXT,
    "ma_phuong_xa" TEXT,
    "trang_thai" "TrangThaiChung" NOT NULL DEFAULT 'HOAT_DONG',
    "ghi_chu" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "khu_tro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khu_tro_chu_so_huu" (
    "id" UUID NOT NULL,
    "khu_tro_id" UUID NOT NULL,
    "tai_khoan_id" UUID NOT NULL,
    "la_chu_so_huu_chinh" BOOLEAN NOT NULL DEFAULT false,
    "ty_le_so_huu" DECIMAL(5,2),
    "tu_ngay" DATE NOT NULL,
    "den_ngay" DATE,
    "trang_thai" "TrangThaiChung" NOT NULL DEFAULT 'HOAT_DONG',

    CONSTRAINT "khu_tro_chu_so_huu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thanh_vien_khu_tro" (
    "id" UUID NOT NULL,
    "khu_tro_id" UUID NOT NULL,
    "tai_khoan_id" UUID NOT NULL,
    "vai_tro_id" UUID NOT NULL,
    "nguoi_moi_id" UUID,
    "duoc_moi_thanh_vien" BOOLEAN NOT NULL DEFAULT false,
    "trang_thai" "TrangThaiChung" NOT NULL DEFAULT 'HOAT_DONG',
    "ngay_tham_gia" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thanh_vien_khu_tro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cau_hinh_khu_tro" (
    "id" UUID NOT NULL,
    "khu_tro_id" UUID NOT NULL,
    "ngay_chot_chi_so_tu" INTEGER NOT NULL DEFAULT 5,
    "ngay_chot_chi_so_den" INTEGER NOT NULL DEFAULT 10,
    "ngay_thu_tien" INTEGER NOT NULL DEFAULT 10,
    "han_thanh_toan_sau_ngay" INTEGER NOT NULL DEFAULT 0,
    "quy_tac_tinh_ngay_le" "QuyTacTinhNgayLe" NOT NULL DEFAULT 'THEO_30_NGAY',
    "so_ngay_bao_tra_phong" INTEGER NOT NULL DEFAULT 7,
    "xu_ly_bao_tre" "XuLyBaoTre" NOT NULL DEFAULT 'MAT_TOAN_BO_COC',
    "tien_phong_tra_truoc" BOOLEAN NOT NULL DEFAULT true,
    "dien_nuoc_tra_sau" BOOLEAN NOT NULL DEFAULT true,
    "so_ngay_khach_mien_phi" INTEGER NOT NULL DEFAULT 7,
    "cho_phep_thanh_toan_mot_phan" BOOLEAN NOT NULL DEFAULT true,
    "giu_link_khi_sua_hoa_don" BOOLEAN NOT NULL DEFAULT true,
    "tu_ngay" DATE NOT NULL,
    "den_ngay" DATE,

    CONSTRAINT "cau_hinh_khu_tro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khoi_nha" (
    "id" UUID NOT NULL,
    "khu_tro_id" UUID NOT NULL,
    "ma_khoi" TEXT NOT NULL,
    "ten_khoi" TEXT NOT NULL,
    "loai_khoi" "LoaiKhoiNha" NOT NULL,
    "thu_tu" INTEGER NOT NULL DEFAULT 0,
    "trang_thai" "TrangThaiChung" NOT NULL DEFAULT 'HOAT_DONG',
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "khoi_nha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tang" (
    "id" UUID NOT NULL,
    "khoi_nha_id" UUID NOT NULL,
    "ma_tang" TEXT NOT NULL,
    "ten_tang" TEXT NOT NULL,
    "so_tang" INTEGER NOT NULL,
    "thu_tu" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phong" (
    "id" UUID NOT NULL,
    "khu_tro_id" UUID NOT NULL,
    "khoi_nha_id" UUID,
    "tang_id" UUID,
    "ma_phong" TEXT NOT NULL,
    "ten_phong" TEXT NOT NULL,
    "dien_tich" DECIMAL(10,2),
    "so_nguoi_toi_da" INTEGER,
    "trang_thai" "TrangThaiPhong" NOT NULL DEFAULT 'DANG_TRONG',
    "ghi_chu" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "phong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lich_su_trang_thai_phong" (
    "id" UUID NOT NULL,
    "phong_id" UUID NOT NULL,
    "trang_thai_cu" "TrangThaiPhong",
    "trang_thai_moi" "TrangThaiPhong" NOT NULL,
    "ly_do" TEXT,
    "nguoi_thuc_hien_id" UUID NOT NULL,
    "tu_thoi_diem" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "den_thoi_diem" TIMESTAMP(3),

    CONSTRAINT "lich_su_trang_thai_phong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chinh_sach_gia_phong" (
    "id" UUID NOT NULL,
    "phong_id" UUID NOT NULL,
    "gia_co_ban" BIGINT NOT NULL,
    "so_nguoi_bao_gom" INTEGER NOT NULL DEFAULT 1,
    "gia_them_moi_nguoi" BIGINT NOT NULL DEFAULT 0,
    "so_nguoi_toi_da" INTEGER,
    "tu_ngay" DATE NOT NULL,
    "den_ngay" DATE,
    "trang_thai" "TrangThaiChung" NOT NULL DEFAULT 'HOAT_DONG',
    "ghi_chu" TEXT,

    CONSTRAINT "chinh_sach_gia_phong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ca_nhan" (
    "id" UUID NOT NULL,
    "ma_ca_nhan" TEXT NOT NULL,
    "ho_ten" TEXT NOT NULL,
    "ngay_sinh" DATE,
    "gioi_tinh" "GioiTinh",
    "so_dien_thoai" TEXT,
    "email" TEXT,
    "nghe_nghiep" TEXT,
    "noi_lam_viec" TEXT,
    "ghi_chu" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ca_nhan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "giay_to_tuy_than" (
    "id" UUID NOT NULL,
    "ca_nhan_id" UUID NOT NULL,
    "loai_giay_to" "LoaiGiayTo" NOT NULL,
    "so_giay_to_ma_hoa" TEXT NOT NULL,
    "so_giay_to_hash" TEXT NOT NULL,
    "ngay_cap" DATE,
    "noi_cap" TEXT,
    "ngay_het_han" DATE,
    "la_giay_to_chinh" BOOLEAN NOT NULL DEFAULT false,
    "anh_mat_truoc_id" UUID,
    "anh_mat_sau_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "giay_to_tuy_than_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dia_chi" (
    "id" UUID NOT NULL,
    "dia_chi_chi_tiet" TEXT,
    "ma_tinh_thanh" TEXT,
    "ten_tinh_thanh" TEXT,
    "ma_quan_huyen" TEXT,
    "ten_quan_huyen" TEXT,
    "ma_phuong_xa" TEXT,
    "ten_phuong_xa" TEXT,
    "dia_chi_day_du" TEXT,
    "dia_chi_cu" TEXT,
    "dia_chi_chuyen_doi" TEXT,

    CONSTRAINT "dia_chi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ca_nhan_dia_chi" (
    "id" UUID NOT NULL,
    "ca_nhan_id" UUID NOT NULL,
    "dia_chi_id" UUID NOT NULL,
    "loai_dia_chi" "LoaiDiaChi" NOT NULL,
    "tu_ngay" DATE,
    "den_ngay" DATE,
    "la_hien_tai" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ca_nhan_dia_chi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lien_he_khan_cap" (
    "id" UUID NOT NULL,
    "ca_nhan_id" UUID NOT NULL,
    "ho_ten" TEXT NOT NULL,
    "so_dien_thoai" TEXT NOT NULL,
    "moi_quan_he" TEXT NOT NULL,
    "ghi_chu" TEXT,

    CONSTRAINT "lien_he_khan_cap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hop_dong" (
    "id" UUID NOT NULL,
    "khu_tro_id" UUID NOT NULL,
    "phong_id" UUID NOT NULL,
    "ma_hop_dong" TEXT NOT NULL,
    "ngay_ky" DATE,
    "ngay_bat_dau" DATE NOT NULL,
    "ngay_ket_thuc" DATE,
    "gia_thue_thoa_thuan" BIGINT NOT NULL,
    "so_nguoi_bao_gom" INTEGER NOT NULL DEFAULT 1,
    "gia_them_moi_nguoi" BIGINT NOT NULL DEFAULT 0,
    "tien_coc_thoa_thuan" BIGINT NOT NULL DEFAULT 0,
    "ngay_thu_tien" INTEGER NOT NULL DEFAULT 10,
    "quy_tac_tinh_ngay_le" "QuyTacTinhNgayLe" NOT NULL DEFAULT 'THEO_30_NGAY',
    "so_ngay_bao_truoc" INTEGER NOT NULL DEFAULT 7,
    "xu_ly_bao_tre" "XuLyBaoTre" NOT NULL DEFAULT 'MAT_TOAN_BO_COC',
    "trang_thai" "TrangThaiHopDong" NOT NULL DEFAULT 'NHAP',
    "phien_ban" INTEGER NOT NULL DEFAULT 1,
    "ghi_chu" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hop_dong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thanh_vien_hop_dong" (
    "id" UUID NOT NULL,
    "hop_dong_id" UUID NOT NULL,
    "ca_nhan_id" UUID NOT NULL,
    "vai_tro" "VaiTroThanhVienHopDong" NOT NULL,
    "la_dai_dien" BOOLEAN NOT NULL DEFAULT false,
    "ngay_bat_dau_o" DATE NOT NULL,
    "ngay_ket_thuc_o" DATE,
    "trang_thai" "TrangThaiChung" NOT NULL DEFAULT 'HOAT_DONG',
    "ghi_chu" TEXT,

    CONSTRAINT "thanh_vien_hop_dong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phu_luc_hop_dong" (
    "id" UUID NOT NULL,
    "hop_dong_id" UUID NOT NULL,
    "ma_phu_luc" TEXT NOT NULL,
    "loai_phu_luc" TEXT NOT NULL,
    "ngay_hieu_luc" DATE NOT NULL,
    "noi_dung_truoc" JSONB,
    "noi_dung_sau" JSONB,
    "nguoi_tao_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phu_luc_hop_dong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yeu_cau_tra_phong" (
    "id" UUID NOT NULL,
    "hop_dong_id" UUID NOT NULL,
    "ngay_bao" DATE NOT NULL,
    "ngay_du_kien_tra" DATE NOT NULL,
    "ngay_tra_thuc_te" DATE,
    "so_ngay_bao_truoc_thuc_te" INTEGER,
    "co_bao_tre" BOOLEAN NOT NULL DEFAULT false,
    "hinh_thuc_xu_ly" "XuLyBaoTre",
    "so_tien_khau_tru_coc" BIGINT NOT NULL DEFAULT 0,
    "ly_do" TEXT,
    "trang_thai" "TrangThaiTraPhong" NOT NULL DEFAULT 'MOI_TAO',
    "nguoi_tao_id" UUID NOT NULL,
    "nguoi_xac_nhan_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yeu_cau_tra_phong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "giao_dich_tien_coc" (
    "id" UUID NOT NULL,
    "hop_dong_id" UUID NOT NULL,
    "loai_giao_dich" "LoaiGiaoDichCoc" NOT NULL,
    "so_tien" BIGINT NOT NULL,
    "ngay_giao_dich" DATE NOT NULL,
    "phuong_thuc" "PhuongThucThanhToan" NOT NULL,
    "ma_giao_dich" TEXT,
    "noi_dung" TEXT,
    "nguoi_thuc_hien_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "giao_dich_tien_coc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dich_vu" (
    "id" UUID NOT NULL,
    "khu_tro_id" UUID NOT NULL,
    "ma_dich_vu" TEXT NOT NULL,
    "ten_dich_vu" TEXT NOT NULL,
    "loai_dich_vu" "LoaiDichVu" NOT NULL,
    "don_vi" TEXT NOT NULL,
    "trang_thai" "TrangThaiChung" NOT NULL DEFAULT 'HOAT_DONG',
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "dich_vu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chinh_sach_gia_dich_vu" (
    "id" UUID NOT NULL,
    "dich_vu_id" UUID NOT NULL,
    "kieu_tinh" "KieuTinhDichVu" NOT NULL,
    "don_gia" BIGINT NOT NULL DEFAULT 0,
    "don_gia_vuot_muc" BIGINT,
    "muc_toi_thieu" DECIMAL(12,3),
    "so_luong_bao_gom" DECIMAL(12,3),
    "tu_ngay" DATE NOT NULL,
    "den_ngay" DATE,
    "trang_thai" "TrangThaiChung" NOT NULL DEFAULT 'HOAT_DONG',
    "cau_hinh_bo_sung" JSONB,

    CONSTRAINT "chinh_sach_gia_dich_vu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dich_vu_hop_dong" (
    "id" UUID NOT NULL,
    "hop_dong_id" UUID NOT NULL,
    "dich_vu_id" UUID NOT NULL,
    "chinh_sach_gia_id" UUID NOT NULL,
    "tu_ngay" DATE NOT NULL,
    "den_ngay" DATE,
    "so_luong_mac_dinh" DECIMAL(12,3),
    "trang_thai" "TrangThaiChung" NOT NULL DEFAULT 'HOAT_DONG',

    CONSTRAINT "dich_vu_hop_dong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phat_sinh_dich_vu" (
    "id" UUID NOT NULL,
    "hop_dong_id" UUID NOT NULL,
    "dich_vu_id" UUID NOT NULL,
    "ngay_phat_sinh" DATE NOT NULL,
    "so_luong" DECIMAL(12,3) NOT NULL,
    "don_gia" BIGINT NOT NULL,
    "thanh_tien" BIGINT NOT NULL,
    "noi_dung" TEXT,

    CONSTRAINT "phat_sinh_dich_vu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cong_to" (
    "id" UUID NOT NULL,
    "khu_tro_id" UUID NOT NULL,
    "phong_id" UUID,
    "loai_cong_to" "LoaiCongTo" NOT NULL,
    "ma_cong_to" TEXT NOT NULL,
    "so_serial" TEXT,
    "don_vi" TEXT NOT NULL,
    "he_so_nhan" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "ngay_lap_dat" DATE,
    "trang_thai" "TrangThaiChung" NOT NULL DEFAULT 'HOAT_DONG',
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cong_to_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chi_so_cong_to" (
    "id" UUID NOT NULL,
    "cong_to_id" UUID NOT NULL,
    "tu_ngay" DATE NOT NULL,
    "den_ngay" DATE NOT NULL,
    "chi_so_cu" DECIMAL(18,3) NOT NULL,
    "chi_so_moi" DECIMAL(18,3) NOT NULL,
    "san_luong_tieu_thu" DECIMAL(18,3) NOT NULL,
    "ngay_ghi" TIMESTAMP(3) NOT NULL,
    "nguon_du_lieu" "NguonChiSo" NOT NULL DEFAULT 'NHAP_TAY',
    "anh_cong_to_id" UUID,
    "nguoi_ghi_id" UUID NOT NULL,
    "trang_thai" "TrangThaiChiSo" NOT NULL DEFAULT 'NHAP',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chi_so_cong_to_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dieu_chinh_chi_so" (
    "id" UUID NOT NULL,
    "chi_so_cong_to_id" UUID NOT NULL,
    "chi_so_cu_truoc" DECIMAL(18,3) NOT NULL,
    "chi_so_moi_truoc" DECIMAL(18,3) NOT NULL,
    "chi_so_cu_sau" DECIMAL(18,3) NOT NULL,
    "chi_so_moi_sau" DECIMAL(18,3) NOT NULL,
    "ly_do" TEXT NOT NULL,
    "nguoi_thuc_hien_id" UUID NOT NULL,
    "nguoi_duyet_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dieu_chinh_chi_so_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hoa_don" (
    "id" UUID NOT NULL,
    "khu_tro_id" UUID NOT NULL,
    "phong_id" UUID NOT NULL,
    "hop_dong_id" UUID NOT NULL,
    "ma_hoa_don" TEXT NOT NULL,
    "loai_hoa_don" "LoaiHoaDon" NOT NULL,
    "ky_hoa_don" TEXT NOT NULL,
    "ngay_bat_dau_ky" DATE NOT NULL,
    "ngay_ket_thuc_ky" DATE NOT NULL,
    "ngay_lap" DATE NOT NULL,
    "han_thanh_toan" DATE NOT NULL,
    "tong_tien" BIGINT NOT NULL DEFAULT 0,
    "tien_da_thanh_toan_cache" BIGINT NOT NULL DEFAULT 0,
    "trang_thai" "TrangThaiHoaDon" NOT NULL DEFAULT 'NHAP',
    "phien_ban_hien_tai" INTEGER NOT NULL DEFAULT 1,
    "du_lieu_tinh_toan" JSONB,
    "ghi_chu" TEXT,
    "nguoi_lap_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hoa_don_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chi_tiet_hoa_don" (
    "id" UUID NOT NULL,
    "hoa_don_id" UUID NOT NULL,
    "loai_khoan" "LoaiKhoanHoaDon" NOT NULL,
    "ten_khoan" TEXT NOT NULL,
    "thoi_diem_tinh" "ThoiDiemTinh" NOT NULL,
    "so_luong" DECIMAL(18,3) NOT NULL,
    "don_vi" TEXT NOT NULL,
    "don_gia" BIGINT NOT NULL,
    "thanh_tien" BIGINT NOT NULL,
    "tu_ngay" DATE,
    "den_ngay" DATE,
    "du_lieu_nguon" JSONB,
    "thu_tu" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "chi_tiet_hoa_don_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phien_ban_hoa_don" (
    "id" UUID NOT NULL,
    "hoa_don_id" UUID NOT NULL,
    "so_phien_ban" INTEGER NOT NULL,
    "du_lieu_hoa_don" JSONB NOT NULL,
    "tong_tien" BIGINT NOT NULL,
    "ly_do_thay_doi" TEXT NOT NULL,
    "nguoi_thuc_hien_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phien_ban_hoa_don_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phieu_thu" (
    "id" UUID NOT NULL,
    "khu_tro_id" UUID NOT NULL,
    "ca_nhan_nguoi_nop_id" UUID,
    "ma_phieu_thu" TEXT NOT NULL,
    "so_tien" BIGINT NOT NULL,
    "phuong_thuc" "PhuongThucThanhToan" NOT NULL,
    "ma_giao_dich" TEXT,
    "ngay_thanh_toan" DATE NOT NULL,
    "trang_thai" "TrangThaiPhieuThu" NOT NULL DEFAULT 'CHO_XAC_NHAN',
    "noi_dung" TEXT,
    "nguoi_tao_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phieu_thu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phan_bo_thanh_toan" (
    "id" UUID NOT NULL,
    "phieu_thu_id" UUID NOT NULL,
    "hoa_don_id" UUID NOT NULL,
    "so_tien_phan_bo" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phan_bo_thanh_toan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lien_ket_tra_cuu" (
    "id" UUID NOT NULL,
    "hoa_don_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "het_han_luc" TIMESTAMP(3),
    "so_lan_truy_cap" INTEGER NOT NULL DEFAULT 0,
    "trang_thai" "TrangThaiLienKet" NOT NULL DEFAULT 'HOAT_DONG',
    "lan_truy_cap_cuoi" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lien_ket_tra_cuu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ho_so_cu_tru" (
    "id" UUID NOT NULL,
    "khu_tro_id" UUID NOT NULL,
    "phong_id" UUID NOT NULL,
    "hop_dong_id" UUID,
    "ca_nhan_id" UUID NOT NULL,
    "loai_ho_so" "LoaiHoSoCuTru" NOT NULL,
    "ma_ho_so" TEXT,
    "tu_ngay" DATE NOT NULL,
    "den_ngay" DATE,
    "trang_thai" "TrangThaiHoSoCuTru" NOT NULL DEFAULT 'CHUA_TAO',
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_gui" TIMESTAMP(3),
    "ngay_tiep_nhan" TIMESTAMP(3),
    "ghi_chu" TEXT,
    "nguoi_tao_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ho_so_cu_tru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lich_su_ho_so_cu_tru" (
    "id" UUID NOT NULL,
    "ho_so_cu_tru_id" UUID NOT NULL,
    "hanh_dong" TEXT NOT NULL,
    "trang_thai_cu" "TrangThaiHoSoCuTru",
    "trang_thai_moi" "TrangThaiHoSoCuTru" NOT NULL,
    "noi_dung" TEXT,
    "nguoi_thuc_hien_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lich_su_ho_so_cu_tru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khach_luu_tru" (
    "id" UUID NOT NULL,
    "khu_tro_id" UUID NOT NULL,
    "phong_id" UUID NOT NULL,
    "ca_nhan_id" UUID NOT NULL,
    "nguoi_duoc_tham_id" UUID,
    "thoi_gian_den" TIMESTAMP(3) NOT NULL,
    "thoi_gian_di_du_kien" TIMESTAMP(3),
    "thoi_gian_di_thuc_te" TIMESTAMP(3),
    "ly_do_luu_tru" TEXT,
    "so_ngay_mien_phi_ap_dung" INTEGER NOT NULL DEFAULT 7,
    "phu_thu_phat_sinh" BIGINT NOT NULL DEFAULT 0,
    "trang_thai_luu_tru" "TrangThaiKhachLuuTru" NOT NULL DEFAULT 'DANG_LUU_TRU',
    "trang_thai_thong_bao" "TrangThaiHoSoCuTru",
    "nguoi_tao_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "khach_luu_tru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tam_vang" (
    "id" UUID NOT NULL,
    "hop_dong_id" UUID NOT NULL,
    "ca_nhan_id" UUID NOT NULL,
    "tu_ngay" DATE NOT NULL,
    "den_ngay_du_kien" DATE,
    "den_ngay_thuc_te" DATE,
    "ly_do" TEXT,
    "anh_huong_tinh_phi" BOOLEAN NOT NULL DEFAULT false,
    "trang_thai" "TrangThaiTamVang" NOT NULL DEFAULT 'DANG_TAM_VANG',
    "nguoi_tao_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tam_vang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tep_tin" (
    "id" UUID NOT NULL,
    "to_chuc_id" UUID NOT NULL,
    "ten_goc" TEXT NOT NULL,
    "duong_dan" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "dung_luong" BIGINT NOT NULL,
    "checksum" TEXT,
    "la_ma_hoa" BOOLEAN NOT NULL DEFAULT false,
    "nguoi_tai_len_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tep_tin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nhat_ky_he_thong" (
    "id" UUID NOT NULL,
    "to_chuc_id" UUID NOT NULL,
    "khu_tro_id" UUID,
    "tai_khoan_id" UUID NOT NULL,
    "hanh_dong" TEXT NOT NULL,
    "loai_doi_tuong" TEXT NOT NULL,
    "doi_tuong_id" UUID,
    "du_lieu_truoc" JSONB,
    "du_lieu_sau" JSONB,
    "ly_do" TEXT,
    "dia_chi_ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nhat_ky_he_thong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nhat_ky_truy_cap_du_lieu" (
    "id" UUID NOT NULL,
    "tai_khoan_id" UUID NOT NULL,
    "ca_nhan_id" UUID NOT NULL,
    "loai_du_lieu" TEXT NOT NULL,
    "hanh_dong" TEXT NOT NULL,
    "dia_chi_ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nhat_ky_truy_cap_du_lieu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "to_chuc_ma_to_chuc_key" ON "to_chuc"("ma_to_chuc");

-- CreateIndex
CREATE INDEX "vai_tro_to_chuc_id_idx" ON "vai_tro"("to_chuc_id");

-- CreateIndex
CREATE UNIQUE INDEX "vai_tro_to_chuc_id_ma_vai_tro_key" ON "vai_tro"("to_chuc_id", "ma_vai_tro");

-- CreateIndex
CREATE UNIQUE INDEX "quyen_ma_quyen_key" ON "quyen"("ma_quyen");

-- CreateIndex
CREATE INDEX "thanh_vien_to_chuc_tai_khoan_id_idx" ON "thanh_vien_to_chuc"("tai_khoan_id");

-- CreateIndex
CREATE INDEX "thanh_vien_to_chuc_vai_tro_id_idx" ON "thanh_vien_to_chuc"("vai_tro_id");

-- CreateIndex
CREATE UNIQUE INDEX "thanh_vien_to_chuc_to_chuc_id_tai_khoan_id_key" ON "thanh_vien_to_chuc"("to_chuc_id", "tai_khoan_id");

-- CreateIndex
CREATE INDEX "khu_tro_to_chuc_id_idx" ON "khu_tro"("to_chuc_id");

-- CreateIndex
CREATE UNIQUE INDEX "khu_tro_to_chuc_id_ma_khu_key" ON "khu_tro"("to_chuc_id", "ma_khu");

-- CreateIndex
CREATE INDEX "khu_tro_chu_so_huu_khu_tro_id_idx" ON "khu_tro_chu_so_huu"("khu_tro_id");

-- CreateIndex
CREATE INDEX "khu_tro_chu_so_huu_tai_khoan_id_idx" ON "khu_tro_chu_so_huu"("tai_khoan_id");

-- CreateIndex
CREATE INDEX "thanh_vien_khu_tro_tai_khoan_id_idx" ON "thanh_vien_khu_tro"("tai_khoan_id");

-- CreateIndex
CREATE UNIQUE INDEX "thanh_vien_khu_tro_khu_tro_id_tai_khoan_id_key" ON "thanh_vien_khu_tro"("khu_tro_id", "tai_khoan_id");

-- CreateIndex
CREATE INDEX "cau_hinh_khu_tro_khu_tro_id_tu_ngay_idx" ON "cau_hinh_khu_tro"("khu_tro_id", "tu_ngay");

-- CreateIndex
CREATE UNIQUE INDEX "khoi_nha_khu_tro_id_ma_khoi_key" ON "khoi_nha"("khu_tro_id", "ma_khoi");

-- CreateIndex
CREATE UNIQUE INDEX "tang_khoi_nha_id_ma_tang_key" ON "tang"("khoi_nha_id", "ma_tang");

-- CreateIndex
CREATE INDEX "phong_khu_tro_id_trang_thai_idx" ON "phong"("khu_tro_id", "trang_thai");

-- CreateIndex
CREATE UNIQUE INDEX "phong_khu_tro_id_ma_phong_key" ON "phong"("khu_tro_id", "ma_phong");

-- CreateIndex
CREATE INDEX "lich_su_trang_thai_phong_phong_id_tu_thoi_diem_idx" ON "lich_su_trang_thai_phong"("phong_id", "tu_thoi_diem");

-- CreateIndex
CREATE INDEX "chinh_sach_gia_phong_phong_id_tu_ngay_idx" ON "chinh_sach_gia_phong"("phong_id", "tu_ngay");

-- CreateIndex
CREATE UNIQUE INDEX "ca_nhan_ma_ca_nhan_key" ON "ca_nhan"("ma_ca_nhan");

-- CreateIndex
CREATE INDEX "ca_nhan_ho_ten_idx" ON "ca_nhan"("ho_ten");

-- CreateIndex
CREATE INDEX "ca_nhan_so_dien_thoai_idx" ON "ca_nhan"("so_dien_thoai");

-- CreateIndex
CREATE INDEX "giay_to_tuy_than_ca_nhan_id_idx" ON "giay_to_tuy_than"("ca_nhan_id");

-- CreateIndex
CREATE UNIQUE INDEX "giay_to_tuy_than_loai_giay_to_so_giay_to_hash_key" ON "giay_to_tuy_than"("loai_giay_to", "so_giay_to_hash");

-- CreateIndex
CREATE INDEX "ca_nhan_dia_chi_ca_nhan_id_loai_dia_chi_idx" ON "ca_nhan_dia_chi"("ca_nhan_id", "loai_dia_chi");

-- CreateIndex
CREATE INDEX "hop_dong_phong_id_trang_thai_idx" ON "hop_dong"("phong_id", "trang_thai");

-- CreateIndex
CREATE UNIQUE INDEX "hop_dong_khu_tro_id_ma_hop_dong_key" ON "hop_dong"("khu_tro_id", "ma_hop_dong");

-- CreateIndex
CREATE INDEX "thanh_vien_hop_dong_hop_dong_id_trang_thai_idx" ON "thanh_vien_hop_dong"("hop_dong_id", "trang_thai");

-- CreateIndex
CREATE INDEX "thanh_vien_hop_dong_ca_nhan_id_idx" ON "thanh_vien_hop_dong"("ca_nhan_id");

-- CreateIndex
CREATE UNIQUE INDEX "phu_luc_hop_dong_hop_dong_id_ma_phu_luc_key" ON "phu_luc_hop_dong"("hop_dong_id", "ma_phu_luc");

-- CreateIndex
CREATE UNIQUE INDEX "yeu_cau_tra_phong_hop_dong_id_key" ON "yeu_cau_tra_phong"("hop_dong_id");

-- CreateIndex
CREATE INDEX "giao_dich_tien_coc_hop_dong_id_ngay_giao_dich_idx" ON "giao_dich_tien_coc"("hop_dong_id", "ngay_giao_dich");

-- CreateIndex
CREATE UNIQUE INDEX "dich_vu_khu_tro_id_ma_dich_vu_key" ON "dich_vu"("khu_tro_id", "ma_dich_vu");

-- CreateIndex
CREATE INDEX "chinh_sach_gia_dich_vu_dich_vu_id_tu_ngay_idx" ON "chinh_sach_gia_dich_vu"("dich_vu_id", "tu_ngay");

-- CreateIndex
CREATE INDEX "dich_vu_hop_dong_hop_dong_id_idx" ON "dich_vu_hop_dong"("hop_dong_id");

-- CreateIndex
CREATE INDEX "phat_sinh_dich_vu_hop_dong_id_ngay_phat_sinh_idx" ON "phat_sinh_dich_vu"("hop_dong_id", "ngay_phat_sinh");

-- CreateIndex
CREATE INDEX "cong_to_phong_id_idx" ON "cong_to"("phong_id");

-- CreateIndex
CREATE UNIQUE INDEX "cong_to_khu_tro_id_ma_cong_to_key" ON "cong_to"("khu_tro_id", "ma_cong_to");

-- CreateIndex
CREATE INDEX "chi_so_cong_to_cong_to_id_ngay_ghi_idx" ON "chi_so_cong_to"("cong_to_id", "ngay_ghi");

-- CreateIndex
CREATE UNIQUE INDEX "chi_so_cong_to_cong_to_id_tu_ngay_den_ngay_key" ON "chi_so_cong_to"("cong_to_id", "tu_ngay", "den_ngay");

-- CreateIndex
CREATE INDEX "hoa_don_hop_dong_id_ngay_lap_idx" ON "hoa_don"("hop_dong_id", "ngay_lap");

-- CreateIndex
CREATE INDEX "hoa_don_khu_tro_id_trang_thai_idx" ON "hoa_don"("khu_tro_id", "trang_thai");

-- CreateIndex
CREATE UNIQUE INDEX "hoa_don_khu_tro_id_ma_hoa_don_key" ON "hoa_don"("khu_tro_id", "ma_hoa_don");

-- CreateIndex
CREATE INDEX "chi_tiet_hoa_don_hoa_don_id_idx" ON "chi_tiet_hoa_don"("hoa_don_id");

-- CreateIndex
CREATE UNIQUE INDEX "phien_ban_hoa_don_hoa_don_id_so_phien_ban_key" ON "phien_ban_hoa_don"("hoa_don_id", "so_phien_ban");

-- CreateIndex
CREATE INDEX "phieu_thu_khu_tro_id_ngay_thanh_toan_idx" ON "phieu_thu"("khu_tro_id", "ngay_thanh_toan");

-- CreateIndex
CREATE UNIQUE INDEX "phieu_thu_khu_tro_id_ma_phieu_thu_key" ON "phieu_thu"("khu_tro_id", "ma_phieu_thu");

-- CreateIndex
CREATE INDEX "phan_bo_thanh_toan_hoa_don_id_idx" ON "phan_bo_thanh_toan"("hoa_don_id");

-- CreateIndex
CREATE UNIQUE INDEX "phan_bo_thanh_toan_phieu_thu_id_hoa_don_id_key" ON "phan_bo_thanh_toan"("phieu_thu_id", "hoa_don_id");

-- CreateIndex
CREATE UNIQUE INDEX "lien_ket_tra_cuu_hoa_don_id_key" ON "lien_ket_tra_cuu"("hoa_don_id");

-- CreateIndex
CREATE UNIQUE INDEX "lien_ket_tra_cuu_token_hash_key" ON "lien_ket_tra_cuu"("token_hash");

-- CreateIndex
CREATE INDEX "ho_so_cu_tru_ca_nhan_id_trang_thai_idx" ON "ho_so_cu_tru"("ca_nhan_id", "trang_thai");

-- CreateIndex
CREATE INDEX "ho_so_cu_tru_khu_tro_id_loai_ho_so_idx" ON "ho_so_cu_tru"("khu_tro_id", "loai_ho_so");

-- CreateIndex
CREATE INDEX "khach_luu_tru_phong_id_thoi_gian_den_idx" ON "khach_luu_tru"("phong_id", "thoi_gian_den");

-- CreateIndex
CREATE INDEX "tam_vang_ca_nhan_id_trang_thai_idx" ON "tam_vang"("ca_nhan_id", "trang_thai");

-- CreateIndex
CREATE INDEX "tep_tin_to_chuc_id_idx" ON "tep_tin"("to_chuc_id");

-- CreateIndex
CREATE INDEX "nhat_ky_he_thong_to_chuc_id_created_at_idx" ON "nhat_ky_he_thong"("to_chuc_id", "created_at");

-- CreateIndex
CREATE INDEX "nhat_ky_he_thong_khu_tro_id_created_at_idx" ON "nhat_ky_he_thong"("khu_tro_id", "created_at");

-- CreateIndex
CREATE INDEX "nhat_ky_he_thong_loai_doi_tuong_doi_tuong_id_idx" ON "nhat_ky_he_thong"("loai_doi_tuong", "doi_tuong_id");

-- CreateIndex
CREATE INDEX "nhat_ky_truy_cap_du_lieu_ca_nhan_id_created_at_idx" ON "nhat_ky_truy_cap_du_lieu"("ca_nhan_id", "created_at");

-- AddForeignKey
ALTER TABLE "vai_tro" ADD CONSTRAINT "vai_tro_to_chuc_id_fkey" FOREIGN KEY ("to_chuc_id") REFERENCES "to_chuc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vai_tro_quyen" ADD CONSTRAINT "vai_tro_quyen_vai_tro_id_fkey" FOREIGN KEY ("vai_tro_id") REFERENCES "vai_tro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vai_tro_quyen" ADD CONSTRAINT "vai_tro_quyen_quyen_id_fkey" FOREIGN KEY ("quyen_id") REFERENCES "quyen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thanh_vien_to_chuc" ADD CONSTRAINT "thanh_vien_to_chuc_to_chuc_id_fkey" FOREIGN KEY ("to_chuc_id") REFERENCES "to_chuc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thanh_vien_to_chuc" ADD CONSTRAINT "thanh_vien_to_chuc_tai_khoan_id_fkey" FOREIGN KEY ("tai_khoan_id") REFERENCES "tai_khoan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thanh_vien_to_chuc" ADD CONSTRAINT "thanh_vien_to_chuc_vai_tro_id_fkey" FOREIGN KEY ("vai_tro_id") REFERENCES "vai_tro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thanh_vien_to_chuc" ADD CONSTRAINT "thanh_vien_to_chuc_nguoi_moi_id_fkey" FOREIGN KEY ("nguoi_moi_id") REFERENCES "tai_khoan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khu_tro" ADD CONSTRAINT "khu_tro_to_chuc_id_fkey" FOREIGN KEY ("to_chuc_id") REFERENCES "to_chuc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khu_tro_chu_so_huu" ADD CONSTRAINT "khu_tro_chu_so_huu_khu_tro_id_fkey" FOREIGN KEY ("khu_tro_id") REFERENCES "khu_tro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khu_tro_chu_so_huu" ADD CONSTRAINT "khu_tro_chu_so_huu_tai_khoan_id_fkey" FOREIGN KEY ("tai_khoan_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thanh_vien_khu_tro" ADD CONSTRAINT "thanh_vien_khu_tro_khu_tro_id_fkey" FOREIGN KEY ("khu_tro_id") REFERENCES "khu_tro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thanh_vien_khu_tro" ADD CONSTRAINT "thanh_vien_khu_tro_tai_khoan_id_fkey" FOREIGN KEY ("tai_khoan_id") REFERENCES "tai_khoan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thanh_vien_khu_tro" ADD CONSTRAINT "thanh_vien_khu_tro_vai_tro_id_fkey" FOREIGN KEY ("vai_tro_id") REFERENCES "vai_tro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thanh_vien_khu_tro" ADD CONSTRAINT "thanh_vien_khu_tro_nguoi_moi_id_fkey" FOREIGN KEY ("nguoi_moi_id") REFERENCES "tai_khoan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cau_hinh_khu_tro" ADD CONSTRAINT "cau_hinh_khu_tro_khu_tro_id_fkey" FOREIGN KEY ("khu_tro_id") REFERENCES "khu_tro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khoi_nha" ADD CONSTRAINT "khoi_nha_khu_tro_id_fkey" FOREIGN KEY ("khu_tro_id") REFERENCES "khu_tro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tang" ADD CONSTRAINT "tang_khoi_nha_id_fkey" FOREIGN KEY ("khoi_nha_id") REFERENCES "khoi_nha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phong" ADD CONSTRAINT "phong_khu_tro_id_fkey" FOREIGN KEY ("khu_tro_id") REFERENCES "khu_tro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phong" ADD CONSTRAINT "phong_khoi_nha_id_fkey" FOREIGN KEY ("khoi_nha_id") REFERENCES "khoi_nha"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phong" ADD CONSTRAINT "phong_tang_id_fkey" FOREIGN KEY ("tang_id") REFERENCES "tang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lich_su_trang_thai_phong" ADD CONSTRAINT "lich_su_trang_thai_phong_phong_id_fkey" FOREIGN KEY ("phong_id") REFERENCES "phong"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lich_su_trang_thai_phong" ADD CONSTRAINT "lich_su_trang_thai_phong_nguoi_thuc_hien_id_fkey" FOREIGN KEY ("nguoi_thuc_hien_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chinh_sach_gia_phong" ADD CONSTRAINT "chinh_sach_gia_phong_phong_id_fkey" FOREIGN KEY ("phong_id") REFERENCES "phong"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giay_to_tuy_than" ADD CONSTRAINT "giay_to_tuy_than_ca_nhan_id_fkey" FOREIGN KEY ("ca_nhan_id") REFERENCES "ca_nhan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giay_to_tuy_than" ADD CONSTRAINT "giay_to_tuy_than_anh_mat_truoc_id_fkey" FOREIGN KEY ("anh_mat_truoc_id") REFERENCES "tep_tin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giay_to_tuy_than" ADD CONSTRAINT "giay_to_tuy_than_anh_mat_sau_id_fkey" FOREIGN KEY ("anh_mat_sau_id") REFERENCES "tep_tin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ca_nhan_dia_chi" ADD CONSTRAINT "ca_nhan_dia_chi_ca_nhan_id_fkey" FOREIGN KEY ("ca_nhan_id") REFERENCES "ca_nhan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ca_nhan_dia_chi" ADD CONSTRAINT "ca_nhan_dia_chi_dia_chi_id_fkey" FOREIGN KEY ("dia_chi_id") REFERENCES "dia_chi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lien_he_khan_cap" ADD CONSTRAINT "lien_he_khan_cap_ca_nhan_id_fkey" FOREIGN KEY ("ca_nhan_id") REFERENCES "ca_nhan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hop_dong" ADD CONSTRAINT "hop_dong_khu_tro_id_fkey" FOREIGN KEY ("khu_tro_id") REFERENCES "khu_tro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hop_dong" ADD CONSTRAINT "hop_dong_phong_id_fkey" FOREIGN KEY ("phong_id") REFERENCES "phong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thanh_vien_hop_dong" ADD CONSTRAINT "thanh_vien_hop_dong_hop_dong_id_fkey" FOREIGN KEY ("hop_dong_id") REFERENCES "hop_dong"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thanh_vien_hop_dong" ADD CONSTRAINT "thanh_vien_hop_dong_ca_nhan_id_fkey" FOREIGN KEY ("ca_nhan_id") REFERENCES "ca_nhan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phu_luc_hop_dong" ADD CONSTRAINT "phu_luc_hop_dong_hop_dong_id_fkey" FOREIGN KEY ("hop_dong_id") REFERENCES "hop_dong"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phu_luc_hop_dong" ADD CONSTRAINT "phu_luc_hop_dong_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yeu_cau_tra_phong" ADD CONSTRAINT "yeu_cau_tra_phong_hop_dong_id_fkey" FOREIGN KEY ("hop_dong_id") REFERENCES "hop_dong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yeu_cau_tra_phong" ADD CONSTRAINT "yeu_cau_tra_phong_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yeu_cau_tra_phong" ADD CONSTRAINT "yeu_cau_tra_phong_nguoi_xac_nhan_id_fkey" FOREIGN KEY ("nguoi_xac_nhan_id") REFERENCES "tai_khoan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giao_dich_tien_coc" ADD CONSTRAINT "giao_dich_tien_coc_hop_dong_id_fkey" FOREIGN KEY ("hop_dong_id") REFERENCES "hop_dong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giao_dich_tien_coc" ADD CONSTRAINT "giao_dich_tien_coc_nguoi_thuc_hien_id_fkey" FOREIGN KEY ("nguoi_thuc_hien_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dich_vu" ADD CONSTRAINT "dich_vu_khu_tro_id_fkey" FOREIGN KEY ("khu_tro_id") REFERENCES "khu_tro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chinh_sach_gia_dich_vu" ADD CONSTRAINT "chinh_sach_gia_dich_vu_dich_vu_id_fkey" FOREIGN KEY ("dich_vu_id") REFERENCES "dich_vu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dich_vu_hop_dong" ADD CONSTRAINT "dich_vu_hop_dong_hop_dong_id_fkey" FOREIGN KEY ("hop_dong_id") REFERENCES "hop_dong"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dich_vu_hop_dong" ADD CONSTRAINT "dich_vu_hop_dong_dich_vu_id_fkey" FOREIGN KEY ("dich_vu_id") REFERENCES "dich_vu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dich_vu_hop_dong" ADD CONSTRAINT "dich_vu_hop_dong_chinh_sach_gia_id_fkey" FOREIGN KEY ("chinh_sach_gia_id") REFERENCES "chinh_sach_gia_dich_vu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phat_sinh_dich_vu" ADD CONSTRAINT "phat_sinh_dich_vu_hop_dong_id_fkey" FOREIGN KEY ("hop_dong_id") REFERENCES "hop_dong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phat_sinh_dich_vu" ADD CONSTRAINT "phat_sinh_dich_vu_dich_vu_id_fkey" FOREIGN KEY ("dich_vu_id") REFERENCES "dich_vu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cong_to" ADD CONSTRAINT "cong_to_khu_tro_id_fkey" FOREIGN KEY ("khu_tro_id") REFERENCES "khu_tro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cong_to" ADD CONSTRAINT "cong_to_phong_id_fkey" FOREIGN KEY ("phong_id") REFERENCES "phong"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chi_so_cong_to" ADD CONSTRAINT "chi_so_cong_to_cong_to_id_fkey" FOREIGN KEY ("cong_to_id") REFERENCES "cong_to"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chi_so_cong_to" ADD CONSTRAINT "chi_so_cong_to_anh_cong_to_id_fkey" FOREIGN KEY ("anh_cong_to_id") REFERENCES "tep_tin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chi_so_cong_to" ADD CONSTRAINT "chi_so_cong_to_nguoi_ghi_id_fkey" FOREIGN KEY ("nguoi_ghi_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dieu_chinh_chi_so" ADD CONSTRAINT "dieu_chinh_chi_so_chi_so_cong_to_id_fkey" FOREIGN KEY ("chi_so_cong_to_id") REFERENCES "chi_so_cong_to"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dieu_chinh_chi_so" ADD CONSTRAINT "dieu_chinh_chi_so_nguoi_thuc_hien_id_fkey" FOREIGN KEY ("nguoi_thuc_hien_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dieu_chinh_chi_so" ADD CONSTRAINT "dieu_chinh_chi_so_nguoi_duyet_id_fkey" FOREIGN KEY ("nguoi_duyet_id") REFERENCES "tai_khoan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoa_don" ADD CONSTRAINT "hoa_don_khu_tro_id_fkey" FOREIGN KEY ("khu_tro_id") REFERENCES "khu_tro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoa_don" ADD CONSTRAINT "hoa_don_phong_id_fkey" FOREIGN KEY ("phong_id") REFERENCES "phong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoa_don" ADD CONSTRAINT "hoa_don_hop_dong_id_fkey" FOREIGN KEY ("hop_dong_id") REFERENCES "hop_dong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoa_don" ADD CONSTRAINT "hoa_don_nguoi_lap_id_fkey" FOREIGN KEY ("nguoi_lap_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chi_tiet_hoa_don" ADD CONSTRAINT "chi_tiet_hoa_don_hoa_don_id_fkey" FOREIGN KEY ("hoa_don_id") REFERENCES "hoa_don"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phien_ban_hoa_don" ADD CONSTRAINT "phien_ban_hoa_don_hoa_don_id_fkey" FOREIGN KEY ("hoa_don_id") REFERENCES "hoa_don"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phien_ban_hoa_don" ADD CONSTRAINT "phien_ban_hoa_don_nguoi_thuc_hien_id_fkey" FOREIGN KEY ("nguoi_thuc_hien_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_thu" ADD CONSTRAINT "phieu_thu_khu_tro_id_fkey" FOREIGN KEY ("khu_tro_id") REFERENCES "khu_tro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_thu" ADD CONSTRAINT "phieu_thu_ca_nhan_nguoi_nop_id_fkey" FOREIGN KEY ("ca_nhan_nguoi_nop_id") REFERENCES "ca_nhan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_thu" ADD CONSTRAINT "phieu_thu_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phan_bo_thanh_toan" ADD CONSTRAINT "phan_bo_thanh_toan_phieu_thu_id_fkey" FOREIGN KEY ("phieu_thu_id") REFERENCES "phieu_thu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phan_bo_thanh_toan" ADD CONSTRAINT "phan_bo_thanh_toan_hoa_don_id_fkey" FOREIGN KEY ("hoa_don_id") REFERENCES "hoa_don"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lien_ket_tra_cuu" ADD CONSTRAINT "lien_ket_tra_cuu_hoa_don_id_fkey" FOREIGN KEY ("hoa_don_id") REFERENCES "hoa_don"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ho_so_cu_tru" ADD CONSTRAINT "ho_so_cu_tru_khu_tro_id_fkey" FOREIGN KEY ("khu_tro_id") REFERENCES "khu_tro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ho_so_cu_tru" ADD CONSTRAINT "ho_so_cu_tru_phong_id_fkey" FOREIGN KEY ("phong_id") REFERENCES "phong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ho_so_cu_tru" ADD CONSTRAINT "ho_so_cu_tru_hop_dong_id_fkey" FOREIGN KEY ("hop_dong_id") REFERENCES "hop_dong"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ho_so_cu_tru" ADD CONSTRAINT "ho_so_cu_tru_ca_nhan_id_fkey" FOREIGN KEY ("ca_nhan_id") REFERENCES "ca_nhan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ho_so_cu_tru" ADD CONSTRAINT "ho_so_cu_tru_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lich_su_ho_so_cu_tru" ADD CONSTRAINT "lich_su_ho_so_cu_tru_ho_so_cu_tru_id_fkey" FOREIGN KEY ("ho_so_cu_tru_id") REFERENCES "ho_so_cu_tru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lich_su_ho_so_cu_tru" ADD CONSTRAINT "lich_su_ho_so_cu_tru_nguoi_thuc_hien_id_fkey" FOREIGN KEY ("nguoi_thuc_hien_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khach_luu_tru" ADD CONSTRAINT "khach_luu_tru_khu_tro_id_fkey" FOREIGN KEY ("khu_tro_id") REFERENCES "khu_tro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khach_luu_tru" ADD CONSTRAINT "khach_luu_tru_phong_id_fkey" FOREIGN KEY ("phong_id") REFERENCES "phong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khach_luu_tru" ADD CONSTRAINT "khach_luu_tru_ca_nhan_id_fkey" FOREIGN KEY ("ca_nhan_id") REFERENCES "ca_nhan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khach_luu_tru" ADD CONSTRAINT "khach_luu_tru_nguoi_duoc_tham_id_fkey" FOREIGN KEY ("nguoi_duoc_tham_id") REFERENCES "ca_nhan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khach_luu_tru" ADD CONSTRAINT "khach_luu_tru_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tam_vang" ADD CONSTRAINT "tam_vang_hop_dong_id_fkey" FOREIGN KEY ("hop_dong_id") REFERENCES "hop_dong"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tam_vang" ADD CONSTRAINT "tam_vang_ca_nhan_id_fkey" FOREIGN KEY ("ca_nhan_id") REFERENCES "ca_nhan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tam_vang" ADD CONSTRAINT "tam_vang_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tep_tin" ADD CONSTRAINT "tep_tin_to_chuc_id_fkey" FOREIGN KEY ("to_chuc_id") REFERENCES "to_chuc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tep_tin" ADD CONSTRAINT "tep_tin_nguoi_tai_len_id_fkey" FOREIGN KEY ("nguoi_tai_len_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhat_ky_he_thong" ADD CONSTRAINT "nhat_ky_he_thong_to_chuc_id_fkey" FOREIGN KEY ("to_chuc_id") REFERENCES "to_chuc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhat_ky_he_thong" ADD CONSTRAINT "nhat_ky_he_thong_khu_tro_id_fkey" FOREIGN KEY ("khu_tro_id") REFERENCES "khu_tro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhat_ky_he_thong" ADD CONSTRAINT "nhat_ky_he_thong_tai_khoan_id_fkey" FOREIGN KEY ("tai_khoan_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhat_ky_truy_cap_du_lieu" ADD CONSTRAINT "nhat_ky_truy_cap_du_lieu_tai_khoan_id_fkey" FOREIGN KEY ("tai_khoan_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhat_ky_truy_cap_du_lieu" ADD CONSTRAINT "nhat_ky_truy_cap_du_lieu_ca_nhan_id_fkey" FOREIGN KEY ("ca_nhan_id") REFERENCES "ca_nhan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
