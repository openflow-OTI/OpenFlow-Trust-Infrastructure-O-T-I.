# OTI Frontend Task Log

## Legend
- ✅ Done (Manager verified)
- 🔄 In Progress
- ⬜ Pending

---

## Completed

### ✅ Task 7B — txCount Cap Indicator
Confirmed done by Manager (July 7, 2026).

### ✅ Task 7C — Dynamic Rate Limit Display
- File: `src/hooks/useAnonymousLimit.ts`
- Switched from GET /admin/plan-configs (admin-protected) to GET /api/config/anonymous-limit (public)
- Falls back to 3 when backend returns null (architectural default)
- Homepage shows live DB value; confirmed live showing "20 per day" (Manager verified)

### ✅ Task 9 — Admin Panel UI
Full admin panel implemented and confirmed working live by Manager (July 7, 2026).

### ✅ Task 10 — Navbar API Health Status Dot
Confirmed done by Manager (July 7, 2026).

### ✅ Plan Configs Tab (Admin Panel)
- File: `src/pages/admin/PlanConfigs.tsx`
- PATCH /admin/plan-configs/{plan_name} with body `{ daily_limit, description? }`
- Description only sent if non-empty (avoid backend empty-string edge cases)
- On success: invalidates both `['admin', 'plan-configs']` and `['anonymous-limit']` queries

### ✅ Admin Panel Desktop Layout Fix
- File: `src/index.css`
- `.app-main:has(.admin-shell), .app-main:has(.admin-gate)` → `max-width: 100%; width: 100%; margin: 0; padding: 0`
- Admin sidebar sticky at `top: 70px; height: calc(100vh - 70px)`

### ✅ useAnonymousLimit Hook Fix
- File: `src/hooks/useAnonymousLimit.ts`
- Switched from admin-protected endpoint to correct public endpoint
- staleTime: 5 minutes; falls back to architectural default of 3 when DB returns null

### ✅ Homepage Scrollbar + Layout Fix
- File: `src/index.css`
- html/body/root: `min-height: 100%` (was `height: 100%`)
- `.app-shell`: removed `overflow: hidden`; uses `min-height: 100%`
- `.app-main`: removed `overflow-y: auto`; added `min-height: calc(100vh - 62px)`
- `.navbar`: `position: sticky; top: 0; z-index: 50; background: var(--bg)`
- `.home-rate-note`: `margin-top: auto` pins rate note to bottom of viewport

### ✅ API Keys Tab — UI Resilience Fix
- File: `src/pages/admin/ApiKeys.tsx`
- Section header + `+ New Key` button always rendered regardless of load state
- Loading state renders inline below header
- Error state renders inline with `.admin-error-block` styling + `↻ Retry` button wired to `keys.refetch()`
- Table guarded behind `keys.isSuccess`; removed `keys.data!` non-null assertions
- Confirmed working (create/list/edit/delete) — Manager verified July 7, 2026

---

## Pending

### ⬜ Task 8 — Professional Results Page Redesign
Standing by for Manager instruction.

### ⬜ Task 9C — Plan Limit Enforcement Verification (Backend, Frontend aware)
Backend Builder verifying `daily_limit` enforcement across all plan types (free, pro, enterprise). No frontend changes needed. Logged for record completeness.
