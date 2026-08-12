# Project Conventions

## 1. Language Strategy

- Domain and business terminology uses Vietnamese.
- Technical and infrastructure terminology uses English.
- User-facing UI text and error messages use Vietnamese.
- Physical database names use Vietnamese `snake_case` through Prisma `@map` and `@@map`.
- REST auth actions use conventional English terms.
- `/me` is preferred over `/toi` for technical current-user routes.

Correct application names:

- `AuthService`
- `TaiKhoanService`
- `KhuTroService`
- `HoaDonService`

Avoid:

- `DangNhapService`
- `PropertyService`
- `InvoiceService`

Correct routes:

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/refresh`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/tai-khoan/me`
- `/api/to-chuc`
- `/api/khu-tro`
- `/api/phong`
- `/api/hop-dong`
- `/api/hoa-don`

Incorrect routes:

- `/api/auth/dang-nhap`
- `/api/auth/dang-xuat`
- `/api/auth/lam-moi-token`
- `/api/auth/toi`
- `/api/organizations`
- `/api/properties`
- `/api/rooms`
- `/api/contracts`
- `/api/invoices`

---

## 2. Naming Rules

Technical terms use English:

- `login`
- `logout`
- `register`
- `refresh`
- `session`
- `token`
- `permission`
- `role`
- `guard`
- `service`
- `controller`
- `module`
- `dto`
- `config`
- `audit`
- `pagination`
- `logger`

Domain terms use Vietnamese:

- `taiKhoan`
- `toChuc`
- `khuTro`
- `khoiNha`
- `tang`
- `phong`
- `caNhan`
- `hopDong`
- `dichVu`
- `congTo`
- `chiSoCongTo`
- `hoaDon`
- `phieuThu`
- `hoSoCuTru`
- `khachLuuTru`
- `tamVang`

Do not force awkward English translations for established domain concepts.

---

## 3. File and Folder Naming

Folders and files use kebab-case.

Domain folders remain Vietnamese:

- `tai-khoan/`
- `to-chuc/`
- `khu-tro/`
- `khoi-nha/`
- `phong/`
- `hop-dong/`
- `hoa-don/`

Technical folders may use English:

- `auth/`
- `authorization/`
- `common/`
- `config/`
- `prisma/`
- `audit/`

Examples:

- `tai-khoan.service.ts`
- `to-chuc.controller.ts`
- `khu-tro.module.ts`
- `hop-dong.service.ts`
- `hoa-don.controller.ts`

---

## 4. TypeScript Naming

Classes use PascalCase.

Domain classes retain Vietnamese terminology:

- `TaiKhoanService`
- `ToChucService`
- `KhuTroService`
- `PhongService`
- `HopDongService`
- `HoaDonService`

Technical classes use English terminology:

- `AuthService`
- `PermissionGuard`
- `CurrentUser`
- `PaginationDto`
- `AllExceptionsFilter`

Variables and functions use camelCase.

Examples:

- `taiKhoanId`
- `khuTroId`
- `findByEmail`
- `createSession`
- `getCurrentUser`

Do not use `any` unless technically unavoidable.

Avoid unnecessary `@ts-ignore` and non-null assertions.

---

## 5. ID Naming

Use Vietnamese domain identifiers in camelCase:

- `taiKhoanId`
- `toChucId`
- `khuTroId`
- `phongId`
- `hopDongId`
- `hoaDonId`

Do not use:

- `accountId`
- `organizationId`
- `propertyId`
- `roomId`

for these established domain entities.

Database fields remain snake_case:

- `tai_khoan_id`
- `to_chuc_id`
- `khu_tro_id`

---

## 6. Boolean Naming

Application-side booleans may use clear English prefixes when appropriate:

- `isActive`
- `isDefault`
- `isSystem`
- `canInvite`
- `hasPermission`
- `shouldRefresh`

Domain-specific names may remain Vietnamese when clearer:

- `duocMoiThanhVien`
- `laChuSoHuuChinh`

Do not force awkward translations.

---

## 7. REST API Rules

Base prefix:

`/api`

Use resource-oriented routes.

Examples:

- `GET /api/khu-tro`
- `POST /api/khu-tro`
- `GET /api/khu-tro/:id`
- `PATCH /api/khu-tro/:id`
- `DELETE /api/khu-tro/:id`

Nested resources should reflect ownership only when useful:

- `GET /api/khu-tro/:khuTroId/phong`
- `POST /api/khu-tro/:khuTroId/phong`

Avoid CRUD verbs in routes:

Incorrect:

- `/api/khu-tro/tao-moi`
- `/api/phong/xoa`
- `/api/hoa-don/cap-nhat`

Auth actions are exceptions and use conventional English:

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/refresh`
- `/api/auth/logout`
- `/api/auth/me`

---

## 8. DTO and Validation

Every write endpoint should use an explicit DTO.

Do not expose Prisma generated types directly as request DTOs.

Use:

- `class-validator`
- `class-transformer`

Global validation should keep:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

DTO naming:

- `CreateKhuTroDto`
- `UpdatePhongDto`
- `CreateHopDongDto`

Normalize input where appropriate:

- trim strings
- lowercase email
- validate UUIDs
- normalize phone number carefully

---

## 9. Database Naming

Physical PostgreSQL names remain Vietnamese `snake_case`.

Examples:

- `tai_khoan`
- `to_chuc`
- `khu_tro`
- `phong`
- `hop_dong`
- `hoa_don`

Use Prisma:

- `@map(...)`
- `@@map(...)`

Do not rename physical database structures just to make them English.

---

## 10. Prisma and Migration Rules

Use migrations for schema changes.

Do not use `prisma db push` as the normal schema-change workflow.

Never modify an already-applied migration.

Never reset or drop the database without explicit approval.

Do not remove or accidentally replace custom PostgreSQL features.

The following partial unique index is critical:

`uq_hop_dong_phong_dang_hoat_dong`

It enforces that one room cannot have multiple active contracts.

After schema changes run:

- `npx prisma format`
- `npx prisma validate`
- `npx prisma migrate dev --name ...`
- `npx prisma generate`

---

## 11. Authentication

Authentication uses conventional English technical terminology.

Endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Passwords must never be stored in plaintext.

Refresh tokens must never be stored in plaintext.

Use hash-based refresh session storage.

JWT payload should remain minimal.

Do not put large permission sets into JWT if they may become stale.

---

## 12. Authorization / RBAC

Authorization must be enforced server-side.

Do not trust a resource ID just because the client supplied it.

Check membership and permission scope before accessing:

- `toChuc`
- `khuTro`
- sensitive domain data

Technical authorization naming stays English:

- `PermissionGuard`
- `RequirePermissions`
- `CurrentUser`

Permission codes should be stable machine-readable identifiers.

Do not hard-code role checks such as:

`role === "ADMIN"`

when permission-based authorization is available.

---

## 13. Error Response

Machine-readable error codes use English uppercase identifiers.

Examples:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `INTERNAL_SERVER_ERROR`

User-facing messages remain Vietnamese.

Example:

```json
{
  "success": false,
  "statusCode": 403,
  "code": "FORBIDDEN",
  "message": "Bạn không có quyền thực hiện thao tác này",
  "errors": [],
  "path": "/api/khu-tro/...",
  "timestamp": "..."
}