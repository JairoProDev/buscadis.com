# Sprint 3 — `@buscadis/ui` primitives (batch 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `@buscadis/ui` with Button, IconButton, Icon (Lucide registry), Input, Textarea, Select; mount Storybook with a11y addon; migrate Header, AuthModal, and Publish CTA surfaces to the new primitives.

**Architecture:** New workspace package `packages/ui` depends on `@buscadis/tokens` + Radix + CVA. App imports from `@buscadis/ui`. No hex/px outside tokens. Server-safe by default (`'use client'` only where Radix requires it).

**Tech Stack:** React 18, Radix UI, `class-variance-authority`, `lucide-react`, Storybook 8 + `@storybook/addon-a11y`, Tailwind via tokens preset, `cn()` from app or shared util.

## Global Constraints

- Consume only `--bs-*` / token classes (`bg-bs-action`, `text-adis-600`, etc.).
- Button heights: sm 36 / md 44 / lg 52; isolated controls ≥44×44 touch.
- `IconButton` requires `aria-label` (TypeScript enforced).
- No component sets its own margin.
- `forwardRef` + native props on every primitive.
- Focus ring: `shadow-focus` / `var(--bs-focus-ring)`.
- Publish variant uses warm fill + `--bs-fg-on-warm` (Sprint 2 CTA contract).
- Do not start Sprint 4 modals in this sprint.
- Commits small; one primitive group per commit preferred.

---

## File map

| Path | Role |
|------|------|
| `packages/ui/package.json` | `@buscadis/ui` workspace package |
| `packages/ui/src/lib/cn.ts` | clsx + tailwind-merge |
| `packages/ui/src/button.tsx` | Button + CVA |
| `packages/ui/src/icon-button.tsx` | IconButton |
| `packages/ui/src/icon.tsx` | Lucide registry + sizes |
| `packages/ui/src/input.tsx` | Input |
| `packages/ui/src/textarea.tsx` | Textarea |
| `packages/ui/src/select.tsx` | Radix Select (+ native fallback note) |
| `packages/ui/src/index.ts` | Public exports |
| `.storybook/*` | Storybook config at repo root or `packages/ui` |
| `packages/ui/src/*.stories.tsx` | Stories + a11y |
| `components/Header.tsx` | Migrate icon buttons + publish if present |
| `components/HeaderIconButton.tsx` | Re-export or delete → IconButton |
| `components/AuthModal.tsx` | Use Button/Input |
| `lib/publish-cta-styles.ts` + NavbarMobile/Header | Prefer `Button variant="publish"` |
| `packages/tokens/eslint-rules` | Add ban: `react-icons` outside `Icons.tsx` / `packages/ui` (optional this sprint) |
| Root `package.json` | workspace dep `@buscadis/ui` |

---

### Task 1: Scaffold `@buscadis/ui`

- [ ] **Step 1: Create package**

```bash
mkdir -p packages/ui/src/lib
```

`packages/ui/package.json`:

```json
{
  "name": "@buscadis/ui",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "dependencies": {
    "@buscadis/tokens": "workspace:*",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-slot": "^1.2.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.511.0",
    "tailwind-merge": "^3.4.0"
  }
}
```

- [ ] **Step 2: Add to root** `"@buscadis/ui": "workspace:*"` and `npm install`.

- [ ] **Step 3: `cn` helper** in `packages/ui/src/lib/cn.ts` (clsx + twMerge).

- [ ] **Step 4: Commit**

```bash
git add packages/ui package.json package-lock.json
git commit -m "$(cat <<'EOF'
chore: scaffold @buscadis/ui package for design-system primitives

EOF
)"
```

---

### Task 2: Button + IconButton

**Spec:** doc `07-PRIMITIVAS.md` § Button / IconButton.

- [ ] **Step 1: Write failing story/test** — Storybook story file importing Button (will fail until component exists) OR a minimal vitest/rtl test if Storybook not up yet. Prefer Storybook story skeleton.

- [ ] **Step 2: Implement `button.tsx` with CVA**

Variants: `primary | secondary | ghost | destructive | publish`  
Sizes: `sm | md | lg`  
Props: `loading`, `disabled`, `iconLeft`, `iconRight`, `fullWidth`, `asChild` (Radix Slot).

Primary styles (illustrative):

```tsx
primary: 'bg-[var(--bs-action)] text-[var(--bs-fg-on-action)] hover:bg-[var(--bs-action-hover)]',
publish: 'bg-[var(--bs-publish-bg)] text-[var(--bs-fg-on-warm)] ...',
```

Heights via h-9/h-11/h-13 (36/44/52) or explicit style tokens.

- [ ] **Step 3: Implement `icon-button.tsx`** — wraps Button; `aria-label: string` required.

- [ ] **Step 4: Export from `index.ts`.**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(ui): add Button and IconButton primitives with CVA variants

EOF
)"
```

---

### Task 3: Icon registry (Lucide)

- [ ] **Step 1: Implement `icon.tsx`**

```tsx
size: 16 | 20 | 24 | 32  // default 20
// Map string names → lucide components for the icons Header/Auth/Publish need first
```

Minimum set for migration: Search, Menu, Bell, MessageCircle, User, X, ChevronDown, Plus, Sun, Moon, MapPin, Check.

- [ ] **Step 2: Do not delete `components/Icons.tsx` yet** — dual-run; new code uses `@buscadis/ui` Icon.

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(ui): add Lucide Icon registry with typed sizes

EOF
)"
```

---

### Task 4: Input, Textarea, Select

- [ ] **Step 1: Input** — height md=44 lg=52; label separate (never placeholder-as-label); error + `aria-describedby`; support `inputMode`.

- [ ] **Step 2: Textarea** — same border/focus tokens; min-rows prop.

- [ ] **Step 3: Select** — Radix Select for ≤12 options; document native `<select>` fallback for longer lists (can implement native-only first if faster, with same visual tokens).

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(ui): add Input, Textarea, and Select primitives

EOF
)"
```

---

### Task 5: Storybook + a11y addon

- [ ] **Step 1: Init Storybook** (Vite or Next framework — prefer Vite for package isolation):

```bash
npx storybook@8 init --type react_vite --skip-install
# or configure manually under packages/ui
```

- [ ] **Step 2: Import `packages/tokens/dist/tokens.css` in preview.**

- [ ] **Step 3: Add `@storybook/addon-a11y`.** Viewport 360 preselected.

- [ ] **Step 4: Stories for each variant of Button + Input states.**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
chore: add Storybook with a11y addon for @buscadis/ui

EOF
)"
```

---

### Task 6: Migrate Header → IconButton + Icon

**Files:** `components/Header.tsx`, `components/HeaderIconButton.tsx`

- [ ] **Step 1: Replace HeaderIconButton usages** with `IconButton` from `@buscadis/ui` (keep 44px).

- [ ] **Step 2: Either delete HeaderIconButton or make it a thin deprecated wrapper.**

- [ ] **Step 3: Manual smoke** — notifications/messages/menu still work; touch targets ≥44.

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
refactor: migrate Header chrome to @buscadis/ui IconButton

EOF
)"
```

---

### Task 7: Migrate AuthModal + Publish CTA

**Files:** `components/AuthModal.tsx`, `components/NavbarMobile.tsx`, `components/Header.tsx`, `lib/publish-cta-styles.ts`

- [ ] **Step 1: AuthModal** — primary/secondary Button; email/password Input.

- [ ] **Step 2: Publish entry points** — `Button variant="publish"` instead of ad-hoc publishCta inline styles where practical; keep `publishCta` object as token bridge if needed for one cycle.

- [ ] **Step 3: Smoke auth open/close + publish CTA contrast still dark-on-yellow.

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
refactor: adopt @buscadis/ui in AuthModal and Publish CTA

EOF
)"
```

---

### Task 8: DoD verification

- [ ] Header/Auth/Publish import from `@buscadis/ui`
- [ ] Storybook runs; a11y addon shows no critical on Button/Input stories
- [ ] `npm run tokens:build` still green
- [ ] No new raw hex in `packages/ui`
- [ ] Update roadmap: Sprint 3 ✅

```bash
rg -n "from '@buscadis/ui'" components/Header.tsx components/AuthModal.tsx
rg -n "HeaderIconButton" components/Header.tsx   # expect gone or wrapper only
```

---

## Out of scope

- Modal/Drawer/Toast (Sprint 4)
- Full `react-icons` → Lucide migration of all 265 files
- AdisoCard rebuild (Sprint 5)
- SSR crawler fix (Sprint 6 — can parallel)

## Parallel note

If SEO is higher priority than primitives polish, start Sprint 6 plan in parallel after Task 1 of this sprint — do not block SSR on Storybook.
