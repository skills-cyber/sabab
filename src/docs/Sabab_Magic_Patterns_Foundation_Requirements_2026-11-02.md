# SABAB — Product, UX and Design Foundation

**Version:** 1.0  
**Date:** 2026-11-02  
**Status:** Authoritative design brief for the first Magic Patterns generation; architectural choices are proposals pending engineering review.  
**Product:** Sabab (সাবাব) — Bangladesh-first, multi-tenant School ERP + SIS + LMS + Academic Planning SaaS.

---

## 1. Mission and expected output

Design **one cohesive, production-quality school-management application**, not unrelated dashboard mockups. Sabab should help a school **plan its academic year, run the school each day, monitor whether teaching happened as planned, evaluate learning, communicate with guardians, and manage money**, through fast and understandable workflows.

The user wants **HisabIQ_UI's compact, polished, data-dense design language**, the useful scope of **Zamil by Profico**, and substantially deeper school planning and administration workflows. Bangladesh and low-cost Android devices are first-class constraints.

**Primary outcome for the first generation:** a reusable design foundation, working navigation, role-aware layouts, and realistic interactive prototype flows. Make reasonable product/UX decisions without waiting for further questions. Record important assumptions. Do not invent a working backend, production authentication, live payment, or official integration.

### Reference priority — obey in this order
1. **Sabab product requirements in this file** define business scope and end-to-end workflows.
2. **The connected GitHub `HisabIQ_UI` repository**, once accessible, is the **authoritative visual and interaction reference**: reuse/adapt its established design tokens, sidebar/top navigation, forms, compact tables, inline edit patterns, filters, search, dialogs, action menus and responsive behaviors. Do not copy HisabIQ retail ERP domain logic or invoice/POS data models.
3. **Zamil** (<https://www.zamilbyprofico.com/>) is a **functionality and go-to-market benchmark**, not a design source of truth or a verified backend blueprint. Its public marketing describes SIS, LMS, attendance, fees, parent updates, lessons, assignments, quizzes, gradebook, imports, RBAC, audit trail, multi-campus views and PWA. Public claims do not prove every workflow is deployed or secure.
4. **Design judgment**: Make autonomous, reasoned decisions wherever details are missing, as long as they respect the preceding constraints. Improve weak existing Sabab workflows rather than blindly replicating them.

**Reference-access rule:** Inspect the actual HisabIQ_UI repository/components if the platform can access it. If access fails, say so in the output, follow the detailed rules here, and request/allow screenshots later. Do **not** claim repository inspection without having done it. Keep Sabab in a separate project/repository.

---

## 2. Product differentiation

Zamil offers a useful baseline: school records, daily/period attendance, fee collection, lessons, assignments, basic grading and parent communication. Sabab must be distinguished by the **Academic Year Operating System**:

**Annual academic plan → syllabus and topic map → weekly/daily lesson schedule → teacher assignment and timetable → class execution/attendance → CT/exam → marks and publication → gap analysis → makeup classes and revised plan.**

The system must answer, at any time:
- What did the institution plan to teach and assess this year, term, week and day?
- What was actually taught by which teacher, in which room/section and period?
- What was missed or postponed, what is behind schedule, and how will it be recovered?
- Which tests and examination questions cover which syllabus topics?
- Which students need attention? Which guardians need updates?
- What fees are owed/paid, and what actions are pending for staff?

A **school principal and a teacher must see different, task-oriented home pages**, not the same generic dashboard with different menu visibility.

---

## 3. Technology and boundary assumptions

**Frontend target / visual component vocabulary:** React + TypeScript; **Next.js App Router is the preferred option for a new Sabab web application**, subject to engineering review; Tailwind CSS; shadcn/ui (Radix primitives); Lucide icons; responsive PWA where appropriate. Reuse HisabIQ_UI component patterns, not unnecessary redesigns. Do not assume a specific Next.js version just because Wappalyzer detected one on Zamil's public site.

**Backend proposal, not a request to implement it in Magic Patterns:** NestJS modular monolith, PostgreSQL, row-level tenant protection, Redis/queue where justified, object storage, versioned APIs. Keep frontend contracts/mocks separable from real APIs. No backend rewrite or deployment in this design-only phase.

**Core multi-tenancy model:** platform → institution/tenant → campus(es) → academic year → class/section → users, teaching and student records. Permission scope can be tenant-wide, campus-wide, class/subject-specific, or student/guardian-linked. A person may have multiple roles, subject assignments and campuses.

**SaaS core:** build or adapt reusable capabilities in the separate `saascore` foundation (tenants, identity, RBAC, subscriptions, feature gates, audit). Sabab adds school-domain models; do not couple domain logic to an ERP-specific SaaS base.

**Security by design:** tenant isolation enforced server-side, least-privilege RBAC, audit histories for sensitive writes, no exposing unreleased grades or other students' records, idempotent financial operations and payment callbacks, guardian-child verification, permission-appropriate export. UI controls complement—not replace—backend rules.

---

## 4. Target people and portals

| Role | Primary jobs | Start screen |
|---|---|---|
| Platform super admin / SaaS owner | Tenants, campuses, plans, subscriptions, SMS credits, usage, support, audit | SaaS Control Center |
| School owner / governing admin | Performance across campuses, budgets, setup, approvals | Institution Overview |
| Principal / head teacher | Academic targets, routine approval, teacher performance, missed syllabus, exam approval | Academic Command Center |
| Academic coordinator / exam controller | Master plan, topic map, timetable, CT/exam calendar, question moderation, results | Academic Planning |
| Teacher / class teacher | Today's classes, attendance, lesson log, homework, CT, marks, communication | My Teaching Day |
| Accountant / cashier | Fees, dues, scholarships, receipts, ledger, reconciliation, daily close | Fee Collection |
| Admission / office staff | Student/guardian records, admissions, documents, transfers, messages | Students / Admissions |
| Parent / guardian | All linked children, attendance, homework, syllabus, results, fees, announcements | My Children |
| Student | Lessons, schedule, assignments, assessments, results | My Learning |

Role switcher and school/campus/year context must be visible but compact. Users may belong to multiple schools if explicitly granted access. Parents with multiple children use **one guardian login** and a child switcher.

---

## 5. Information architecture and module inventory

Show a coherent sidebar with sections rather than 28 unrelated top-level menu items. Every sidebar selection and in-page underline tab must correspond to the same logical hierarchy and predictable route. Avoid mismatch between sidebar ordering and tab ordering.

### A. Workspaces / academic operations — flagship
1. **Overview:** role-specific priorities, pending actions, KPIs, alerts, today's timetable and quick actions.
2. **Academic Year & Calendar:** setup, terms, working days, holidays, events, exam periods, school closures, overrides, version history.
3. **Curriculum & Syllabus:** curricula/streams, grades, subjects, books, chapters, topics, learning outcomes, teaching targets, topic completion, academic-year versions.
4. **Academic Planner:** annual plan, term/month/week/day views, planned vs delivered progress, plan versions, teacher submissions and principal approval.
5. **Routine & Timetable:** periods, breaks, rooms, teachers, class-section allocations, subject frequency, auto/manual scheduling, clashes, substitution.
6. **Teacher Daily Workspace:** Today's classes, attendance, lesson objectives, materials, homework, class diary, completed/partial/missed, follow-up.
7. **Cancelled & Makeup Classes:** reason, substitute, proposed slot, clash checks, approval, carry-over to syllabus completion.
8. **Class Tests / Continuous Assessment:** CT calendar, topic coverage, question preparation, approved syllabus, marks, insights.
9. **Examination:** assessment type, exam plan, date/room/seat plan, questions, moderation, mark capture, verification, result publication.
10. **Question Bank:** subjects/chapters, MCQ/CQ/short answer, question difficulty, marks, reuse, versioning, moderation, printable paper.
11. **Results & Report Cards:** draft scores, weightage, GPA/rubric configuration, verification, approval, publish, correction history, export/print.
12. **Homework & LMS:** assignments, learning materials, recordings/attachments, submissions, feedback, auto-graded quizzes.

### B. School administration
13. **Students & Enrollment:** admissions, unique IDs, student profiles, campus/class/section placement, siblings, guardians, promotion, transfers, archive.
14. **Attendance & Leave:** student and staff daily/period attendance, bulk mark, late/leave, reasons, correction, guardian alert and report.
15. **Teachers & Staff:** profiles, qualifications, class/subject assignment, workload, availability, substitutions, attendance and leave.
16. **Parents & Communication:** guardian relationships, announcements, class-specific alerts, SMS/WhatsApp templates, opt-in, delivery log, inbox.
17. **Fees & Collection:** configurable charges, monthly generation, concessions, sibling discounts, fines/waivers, partial/advance pay, due list, cash/bank/mobile financial methods, receipt and reversal.
18. **Accounts & Finance:** daybook, categories, expense, income, cash/bank registers, settlement, exports, reconciliation, audit.
19. **Admissions & Website/CRM:** application, enquiry, waitlist, admission test, acceptance, document verification (later phase).
20. **Library / Inventory / Transport / Hostel / Payroll:** planned phase-two modules; expose coherent future module architecture, not fake working features.
21. **Reports & Analytics:** school overview, academic coverage, teaching completion, student engagement, attendance, fees/dues, campus comparison, printable reports.
22. **Settings & Master Data:** school profile, campuses, academic years, streams, grades, class/sections, subjects, fee types, approval workflows, grading rules, roles and permissions, language and notification settings.

### C. SaaS platform / control plane
23. **SaaS Dashboard:** tenant registrations, trials, subscriptions, usage, payments, support and revenue metrics.
24. **Tenants & Campuses:** onboard/verify/suspend/reactivate, campus limits, domain/branding, billing contact, data health.
25. **Plans, Subscription & Feature Gates:** free/trial/paid plan configuration, plan changes, renewal, grace period, invoices, limits and add-ons.
26. **SMS/WhatsApp Package Center:** provider integrations, credit purchases, balances, usage, templates, rate/cost tracking.
27. **Platform Roles, Support & Audit:** support impersonation only with explicit controlled consent/logging if ever provided; RBAC, security events, platform diagnostics, support tickets.

**Phase one priorities:** A1–A12 plus Students, Attendance, Teachers, Fees, Parents, Reports, Settings and SaaS Control Center design foundations. Phase-two modules can have meaningful shell screens or clearly be marked as planned.

---

## 6. Flagship end-to-end workflows (must prototype)

### Workflow 1 — school onboarding
Create institution → select campus count (1 or 2 supported initially; extensible) → academic year → grades/sections → subject and fee templates → import/validate Excel roster → map guardians → assign employees/teachers → activate school dashboard. Show mapping errors, duplicates, partial success and resumable drafts.

### Workflow 2 — academic year planning
Choose campus + academic year → create terms and holidays → select board/stream/curriculum version → map class/subject syllabus → add topic outcomes and planned period counts → set exam/test calendar → assign teachers → generate/edit timetable → review clashes → submit plan for principal approval → publish locked version → track revisions with reason.

### Workflow 3 — teacher's normal day
Open **My Teaching Day** → see periods and planned chapters → mark class/period attendance in bulk → open prefilled lesson plan → record actual topic, completion/partial completion, homework and evidence → submit class diary → see unfinished syllabus carry-forward. Teacher can manage lessons with few taps on low-cost Android. Include offline draft and sync status design, but don't imply server-validated offline posts are complete.

### Workflow 4 — cancelled and makeup class
Mark class cancelled/missed → record reason → compute syllabus impact → propose a teacher/room/time → validate timetable/teacher/section conflicts → principal approval if required → notify stakeholders → complete makeup lesson → resolve linked syllabus gap. Never silently count a missed class as delivered.

### Workflow 5 — CT and examination lifecycle
Create CT/exam → select approved topics/objectives → build question blueprint → draft questions → moderate/approve paper → schedule sessions → enter/grade marks → reviewer verifies → authorized publish → guardian/student visibility → controlled corrections after publication with full audit.

### Workflow 6 — attendance and parent contact
Take daily or period attendance → handle P/A/L/Leave and bulk operations → detect absences/late patterns → preview opted-in notice → queue message → inspect delivery status → guardian views the event. Allow correction with who/why/history.

### Workflow 7 — student lifecycle
Lead/application → admission → guardian verification → initial class allocation → new academic-year enrollment → promotion/detention → section transfer → withdrawal/transfer certificate → read-only historic enrollment.

### Workflow 8 — fees and finance
Configure fee structure → generate dues → add discount/scholarship → pay partial/full by cash, bank or Bangladesh mobile channel → issue printable bilingual receipt → daily close and reconciliation → overdue notification. Corrections through authorized adjustment/reversal, not silent edits to posted ledger records.

### Workflow 9 — parent and student portal
Guardian sees linked children → each child's today schedule, attendance, homework, exam timeline, progress and balance → pay/see fee receipt if enabled → school updates → preference/language settings. Only released/authorized results are visible.

### Workflow 10 — SaaS subscription
New tenant/trial → configure one/two-campus entitlements → subscription and SMS credits → upgrade/downgrade with limits and non-destructive handling of over-limit data → renewal/reminders → grace/read-only policy if configured → platform usage/audit.

---

## 7. Universal interaction specification

**Every substantive list must provide, as relevant:**
- Instant search, relevant filters/date/campus/year scope, sort, pagination/density and column visibility.
- Row click/quick preview with related records; clearly named action menu (`⋯`) for View, Edit, Duplicate, Export/Print, Archive/Delete, history, and related actions where permitted.
- Bulk actions only when safe, selection state, clear feedback, undo where safe, delete/archive confirmations.
- Real-looking interaction states: loading, empty, no matches, read-only, validation error, unsaved changes, conflict, insufficient permission, success and partial failure.
- Helpful keyboard navigation; Enter/Escape behavior; tab order; visible focus; usable touch interactions.
- Efficient quick-add for lookups (e.g., sections, subjects, guardian) without losing parent-form context.
- **No decorative-only buttons.** In the prototype, implement meaningful local-state behavior or visibly label an action as a preview/placeholder.

### Inline cell editing: global, risk-aware design rule
Use a consistent reusable inline editing table mechanism **across all suitable tables**. Examples: permitted names/labels, price-like configurable settings, syllabus targets, non-sensitive notes. Reveal an edit affordance **on hover or keyboard focus** (on touch, accessible through tap or `⋯`), not permanent clutter; support Save/Cancel, Enter/Esc and validation. For complex operations use full edit dialog, drawer or workflow.

**Do not inline edit** published marks, ledger postings, published academic plans, confirmed attendance requiring reason, security roles, tuition transactions or critical approvals without a controlled audited workflow. Demonstrate both editable and protected cells and their permission states. Row actions should support the relevant edit/update/delete/archive behavior.

---

## 8. Design system — derived from HisabIQ_UI

Inspect HisabIQ_UI first. Use its actual tokens/layout/components wherever accessible. Fallback design constraints if unavailable:

| Category | Rule |
|---|---|
| Overall | Compact, highly legible, information-dense; no huge cards, oversized headers or gratuitous whitespace |
| Layout | Responsive fixed/collapsible sidebar, clear top context controls, clean content region |
| Navigation | Sidebar and in-module tabs consistently ordered; underline tabs; role-focused menu groups |
| Brand | HisabIQ-style restrained blue/neutral aesthetic **adapted to Sabab branding**, not retail-specific logos |
| Themes | Complete light/dark mode, including charts, tables, dropdowns and empty states |
| Type | Geist (Latin) and Hind Siliguri (Bangla) if available; sharp clear hierarchy; no tiny unreadable mobile text |
| Buttons and fields | Consistent **0.375rem (`rounded-md`)** radius; common design tokens, not one-off overrides |
| Desktop inputs | Compact, typically around 36px where appropriate; bigger targets on touch devices |
| Tables | Compact density, sticky headers when useful, right-aligned numbers, accessible row selection, horizontal overflow strategy |
| Labels | English labels with concise Bangla helper tooltips; optional full Bangla localisation across UI |
| Forms | Related fields grouped, required markers, errors by field, inline quick-add, clear primary action |
| Dates/numbers | Bangladesh-friendly formats, BDT (৳), localized digits as an option, proper time and academic-year context |
| Visuals | Only meaningful KPI/coverage charts, calendars, timelines and progress indicators; avoid empty decorative graphs |
| Dialogs | Approvals/complex edits have focused dialogs or drawers, clear confirm/cancel and error handling |
| Status | Consistent semantic tokens for draft, submitted, approved, published, overdue, cancelled, needs review |
| Responsiveness | Desktop, tablet, and budget Android phone; collapse columns/reorder content instead of shrinking text to unreadable size |
| Performance | Fast navigation, debounced search where needed, virtualization for large datasets, avoid excessive animations |
| Accessibility | Visible focus, keyboard reachability, labels, contrast, semantic status, tap targets, no color-only meaning |

**Note:** exact colors and component dimensions should be obtained from the actual connected HisabIQ_UI repository; do not fabricate or contradict its source design tokens.

---

## 9. Bangladesh-specific requirements

- Support Bangla and English names, labels, document output and guardian notifications; English with optional Bangla explanations is the administrative default.
- Handle common Bangladeshi levels: primary, secondary and higher secondary, while keeping grading/class nomenclature configurable. Madrasa/English-medium/other streams are optional profiles, not assumptions applied to every school.
- Curriculum and exams must be **versioned per academic year, institution, stream and board**; do not hard-code NCTB topic lists, class structure, grading thresholds or annually changing policies as permanent facts.
- Guardian telephone input supports Bangladesh phone numbers and OTP flow (design only); guardian links require verified access.
- Cash and bank receipts; potential bKash, Nagad and SSLCOMMERZ integration points, subject to provider confirmation and backend implementation.
- BDT fee amounts in UI, printable bilingual receipt/report card, good A4 print layouts, sensible CSV/Excel import/export.
- SMS constraints, opt-in consent, templates, delivery status, cost/credit visibility; WhatsApp availability and template approval cannot be assumed.
- Low connectivity: attendance and lesson drafts may have Pending / Synced / Needs Review states with clear, safe replay semantics; no optimistic irreversible fee or marks publication.
- School configuration must support Fridays/weekends, Islamic/official holidays, Ramadan routines and term-specific overrides without hard-coded assumptions.

---

## 10. SaaS and permission design guardrails

- Distinguish **platform admin** from **school admins**; they do not share operational record access by default.
- Multiple campuses: school-wide configurations, per-campus permissions, students and financial views; cross-campus totals only for authorized roles.
- Subscription plans/feature flags/role restrictions affect both UI and backend contracts. No hidden-data leakage by querying unauthorized student records.
- Tenant lifecycle: signup, onboarding, trial, billing, suspension/grace, upgrade/downgrade, cancellation, export; downgrade must not delete historic school records by default.
- Financial and academic audit histories must be clear and discoverable.
- Support a compact **SaaS Control Center** covering tenants, plans, entitlements, SMS balances, provider costs, payments, support, platform audit and per-tenant feature toggles.

---

## 11. Exact first-generation UI deliverables and depth

Magic Patterns may have a limited generation budget. Prioritize **quality and connectedness over creating dozens of static screens**.

### Tier A — must be substantially interactive in the initial generation
1. **App shell**: role, campus and year selectors, navigation, dark/light, search, notifications, quick actions.
2. **Principal dashboard**: action queue, academic progress, timetable clashes, attendance, fee status, upcoming exams.
3. **Academic Year Planner**: calendar + month/week views, topic coverage, version/status, create/edit/approve plan.
4. **Timetable builder**: class/teacher/room view, assignment edit, conflict display, substitute/makeup actions.
5. **Teacher Today**: period list, attendance, lesson completion/partial/missed, homework and class diary.
6. **Exams/CT**: assessment list, syllabus selection, question flow, mark entry, review/publish status.
7. **Students & Fees**: compact tables, student quick preview, guardian linkage, invoice/due/receipt prototype.
8. **Parent Portal**: multi-child overview, homework, approved results, attendance and fees.
9. **SaaS Control Center**: tenants, campus limits, plans, SMS credits and feature flags.
10. **Reusable components**: table with hover/focus inline editing, `⋯` actions, picker/combobox, drawer, confirm, tabs, filter row, approval timeline.

### Tier B — create consistent connected layouts and functional prototypes as capacity allows
Staff, LMS, assignments, question bank, report cards, attendance history, finance/ledger, communication, role settings, detailed reports, school onboarding, admin settings.

### Tier C — explicitly planned, not falsely fully implemented
Library, hostel, transport, payroll, inventory, website CRM, advanced AI tools and external gateways.

### Seeded example data
Use clearly marked **fictional sample data** from one Bangladeshi school with 2 campuses, academic year, classes/sections, teachers, student/guardian links, curriculum topics, lessons, class tests, fees and small alerts. Make connected records internally consistent across screens; do not expose real student PII.

---

## 12. Critical acceptance criteria

The generated prototype is acceptable only if:

1. It obviously feels like a **compact, polished HisabIQ_UI-inspired application**, not a generic oversized school dashboard.
2. The **role-aware application shell** works and menu/tab hierarchy is consistent.
3. A teacher can open a scheduled class, mark attendance, submit a lesson result and see academic progress reflect it.
4. An administrator can create a plan, see conflicts and approve a revision; missed classes can lead to makeup scheduling.
5. A test/exam is linked to syllabus scope, with draft/review/published stages and permission-aware mark edits.
6. A guardian only sees linked children's authorized data.
7. Student and fee lists have real contextual actions, appropriate inline edits, filters and previews.
8. Light and dark themes, Bangla/English content and responsive mobile/tablet layouts are coherent.
9. SaaS platform operations are visibly distinct from school operations.
10. Important interactions produce meaningful UI feedback. Any features not truly implemented are explicitly identified.
11. The design reuses established components, tokens and action patterns across modules rather than introducing a new aesthetic on every page.
12. External service connectivity, backend persistence and integrations are not misrepresented as completed in a UI concept.

---

## 13. Autonomous design authority and final handoff

You are **authorized and expected to make senior product design decisions**. Choose better navigation, screen composition, component reuse, action placement, data hierarchy, modal/drawer usage and missing UX flows. Eliminate redundant steps, shorten common paths and keep the information that staff require visible. You may **add missing practical actions** consistent with school operations; you must not remove the unique academic planning lifecycle.

### At completion, provide:
- Navigable prototype with the highest-priority connected screens and interactions.
- Reusable Sabab component/design system derived from the HisabIQ_UI reference (or explicitly state if that repository was inaccessible).
- Sitemap and role-based navigation map.
- Key design decisions and 5–10 assumptions/limitations.
- A concise **Implemented in prototype / Designed but not interactive / Requires backend** distinction.
- Suggested next screens to add without replacing or redesigning the approved base.

**Do not** stop after designing one overview screen. **Do not** spend the first generation writing a long research essay or asking repeated questions. Use this file as the detailed requirement source; focus the generation on a coherent UI foundation with deep, realistic, connected interactions.

---

## 14. Reference URLs and provenance

- HisabIQ_UI: **the repository the user connects to Magic Patterns**; repo owner/URL intentionally not guessed.
- Zamil public marketing: <https://www.zamilbyprofico.com/> (vendor-advertised capabilities; not independent proof of implementation).
- Sabab: a separate project with its own school-specific implementation and approved design foundation.
- Source of specific product requirements: user-defined Sabab academic-planning, roles, parent portal, SaaS Control Center, Bangladesh-localization and HisabIQ_UI design directions.

**End of foundation file.**
