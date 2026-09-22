# Publish Studio Immersive — Implementation Plan

> **For agentic workers:** Steps use checkbox syntax.

**Goal:** Immersive `/publicar` capture-first, free publish, auto-download, mode switcher, blue nav CTA.

**Architecture:** Page shell chrome-free; `PublishStudio` modes on one `PublishDraft`; analyze + AI questions; download helper on publish success.

**Tech Stack:** Next.js, Web Speech + optional `/api/publish/stt`, existing flyer export, `useSpeechRecognition`.

## Global Constraints

- Publish always free as primary path.
- No Header/Navbar on `/publicar`.
- Nav Publicar CTA = brand blue, not sol yellow.
- Max 4 AI questions.
- Auto-download cover on successful publish (default on).

---

### Task 1: Docs

- [x] Spec + this plan
- [x] Design-system PublishCta / color notes

### Task 2: Phase 0 chrome + CTA

- [x] `app/publicar/page.tsx` immersive shell
- [x] `publish-cta-styles.ts` blue action
- [x] Shell full-bleed

### Task 3: Phase 1 capture + questions + free first

- [x] Capture stage + voice → analyze
- [x] Mount `PublishAIQuestions`
- [x] Primary “Publicar gratis”

### Task 4: Phase 2 download + modes

- [x] Auto-download helper
- [x] Mode switcher Capture|Formulario|Plantilla|Diseño

### Task 5: Phase 3 attributes + STT

- [x] Analyze prompt fills `atributos`
- [x] `/api/publish/stt` + client fallback
