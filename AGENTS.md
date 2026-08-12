# Repository Instructions

Before changing this repository, read these sources in order:

1. `AGENTS.md`
2. `docs/CONVENTIONS.md`
3. `api/prisma/schema.prisma`
4. The relevant modules and tests

## Mandatory Rules

- Keep domain terminology in Vietnamese.
- Use English for technical and infrastructure terminology.
- Do not translate `khu-tro` to `property`.
- Do not translate `to-chuc` to `organization`.
- Do not translate `phong` to `room`.
- Do not translate `hop-dong` to `contract` in application, module, or API naming.
- Do not translate `hoa-don` to `invoice` in application, module, or API naming.
- Auth technical routes use `register`, `login`, `refresh`, `logout`, and `me`.
- Do not use `/toi` for technical current-user routes.
- Keep physical database names in Vietnamese.
- Never reset or drop the database without explicit instruction.
- Never modify applied migrations.
- Never remove the `uq_hop_dong_phong_dang_hoat_dong` constraint.
- Use migrations for schema changes.
- Run lint, build, and tests after changes.
- `docs/CONVENTIONS.md` is the source of truth for project naming and architecture conventions.
- For runtime-sensitive changes, successful compilation alone is not enough; verify the affected runtime flow.
- Prefer the smallest correct change and do not refactor unrelated modules.