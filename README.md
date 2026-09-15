# Serendib Travel & Tours — Inquiry Management System (Phase 1)

A frontend-only, production-style Travel CRM prototype built with **React 19 + TypeScript + Vite + Tailwind CSS v4 + Recharts + React Router**.
There is **no backend** in Phase 1: data is seeded from realistic mock data and persisted in `localStorage` through a service layer that can be swapped for REST calls in Phase 2.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

### Departments

Serendib runs two separate departments, and every user belongs to one of them (or to Head Office):

| Department | Handles | Manager | Sales executives |
|---|---|---|---|
| **Inbound** | Foreign travellers touring Sri Lanka (`INB-…` inquiries) | Shanika Rodrigo | Kasun Perera, Nadeesha Fernando, Ruwan Bandara |
| **Outbound** | Sri Lankans travelling abroad (`OUT-…` inquiries) | Malith Gunawardena | Dilan Jayawardena, Tharushi de Silva, Hiruni Samarasekara |
| **Head Office** | Both departments | Super Admin | — |

Department staff only see their own department's inquiries, follow-ups, quotations, bookings, customers, packages and reports, and can only assign work to their own team.

**Sales executives see only their own inquiries** — those assigned to them. They work from *My Inquiries* (the department-wide Inbound/Outbound lists redirect there), and their follow-ups, quotations, customers, customer history and dashboard figures are all limited to those inquiries. Opening another executive's inquiry by URL shows an access-denied page. Enforced in `utils/permissions.ts → canSeeInquiry` and applied through `hooks/useWorkspaceData.ts`; in Phase 2 the API must apply the same rule server-side. Head Office users get a department switcher (All / Inbound / Outbound) in the sidebar and a side-by-side department comparison on the dashboard.

### Demo accounts (any password)

| Email | Role | What you'll see |
|---|---|---|
| admin@serendibtravel.com | Super Admin · Head Office | Everything, department switcher, Users & Settings |
| viewer@serendibtravel.com | Viewer · Head Office | Read-only view of both departments |
| inbound.manager@serendibtravel.com | Inbound Manager | Inbound team, assignment & reports |
| inbound.sales@serendibtravel.com | Inbound Sales Executive (Kasun Perera) | Only his assigned inbound inquiries |
| outbound.manager@serendibtravel.com | Outbound Manager | Outbound team, assignment & reports |
| outbound.sales@serendibtravel.com | Outbound Sales Executive (Dilan Jayawardena) | Only his assigned outbound inquiries |

Settings → **Reset demo data** restores the original sample data.

## Features

- **Dashboard** — 8 KPI cards, inquiry trend (week / month / 6 months), inbound vs outbound donut, sources, status pipeline, executive performance, due follow-ups, latest inquiries.
- **Inbound / Outbound / My Inquiries** — search, filters (date, status, priority, executive, source, destination), sort, pagination, row actions (View, Edit, Assign, Change status, Follow-up, Add note). Tables become cards on mobile.
- **Inquiry forms** — multi-section forms with validation, auto nights calculation, auto IDs (`INB-2026-00001`, `OUT-2026-00001`), *Save*, *Save & Add Follow-up*, *Cancel*.
- **Inquiry detail** — header with status/priority/assignee, pipeline progress, quick status change, tabs: Overview, Timeline, Follow-ups, Quotations, Booking, Documents (placeholder), Notes.
- **Follow-ups** — Today / Overdue / Upcoming / Completed with complete, reschedule and edit; overdue highlighting.
- **Quotations** — line-item builder with discount & totals, draft/sent/accepted/rejected/expired, printable **Preview Quotation**.
- **Bookings** — convert from inquiry (with optional advance), record payments, balance tracking, booking status workflow.
- **Customers** — list + profile with inquiry history, booking history, notes, contact actions.
- **Tours & Packages** — inbound/outbound tabs with CRUD.
- **Reports** — Inquiry, Conversion (funnel), Sales Executive and Source reports with global filters; CSV export works, Excel/PDF are Phase 2 placeholders.
- **Users** — CRUD, activate/deactivate. **Settings** — company profile, defaults, quotation terms.

## Project structure

```
src/
  components/
    ui/          Reusable primitives: Button, Badge, Card, Form, Modal, Tabs, DataTable, FilterBar, Pagination, ActionMenu
    layout/      Sidebar, brand mark
    inquiry/     Workflow modals: Assign, Follow-up, Note, Status, Quotation (+Preview), Booking/Payment, useInquiryActions
    charts/      Recharts wrappers (trend, donut, bars, funnel)
  context/       AuthContext (demo auth + permissions), ToastContext
  data/          mockData.ts — deterministic seed generator (dates relative to today)
  hooks/         useServiceQuery, useWorkspaceData (role scoping), useTableState (search/filter/sort/paging)
  layouts/       AppLayout (sidebar + topbar)
  pages/         One file per screen
  services/      storage.ts (the ONLY localStorage access) + one service per entity + analyticsService
  types/         Domain types shared by UI and services
  utils/         dates, formatting, IDs, constants, permissions (role + department fence), departments, CSV export
```

## Phase 2: plugging in a real backend

```
Component → hook (useServiceQuery) → service (inquiryService…) → storage.ts (localStorage)
                                                     ↓ Phase 2
Component → hook (useServiceQuery) → service (inquiryService…) → HTTP client → REST API → Database
```

1. Components never touch `localStorage`; all services already return **Promises**.
2. Replace `createRepository()` in `services/storage.ts` (or each service body) with `fetch`/axios calls, e.g. `list: () => api.get('/inquiries')`.
3. Move ID generation (`previewNextId`), activity logging, customer matching and analytics aggregation server-side; keep the same function signatures.
4. Replace `authService` with real login (JWT/session) and enforce `utils/permissions.ts` rules on the server.
5. Optionally switch `useServiceQuery` to TanStack Query and `HashRouter` to `BrowserRouter`.

Types in `src/types` can be used as the API contract.
# travel_ims
