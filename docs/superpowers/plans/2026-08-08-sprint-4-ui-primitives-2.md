# Sprint 4 — UI primitives batch 2

**Goal:** Modal/Sheet, Drawer, Badge, Chip, Avatar, Skeleton, Spinner, EmptyState, Toast in `@buscadis/ui`.

**Done when:** AuthModal uses Modal; ToastContainer uses ToastViewport; primitives exported + stories.

**Status:** ✅ 2026-08-08

## Delivered

| Primitive | File |
|-----------|------|
| Dialog / Modal | `packages/ui/src/dialog.tsx` |
| Drawer | `packages/ui/src/drawer.tsx` |
| Badge / Chip / Avatar | `badge.tsx` `chip.tsx` `avatar.tsx` |
| Skeleton / Spinner / EmptyState | `skeleton.tsx` `spinner.tsx` `empty-state.tsx` |
| Toast | `toast.tsx` → `components/Toast.tsx` |

## Migrations

- `AuthModal` → Radix Dialog (Modal)
- `ToastContainer` → `ToastViewport`

Remaining ad-hoc modals migrate incrementally (Sprint 4+ backlog), not all at once.
