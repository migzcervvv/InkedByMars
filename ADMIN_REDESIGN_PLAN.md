# Admin panel rebuild

Status: Bookings, Calendar and the same-day policy are implemented locally. Cutover and transaction verification against a staging MongoDB replica set are pending.

## Objective

Rebuild administration around two jobs: reviewing bookings and making dates or times non-bookable. Prevent new same-day bookings by default, enforced by the server in `Asia/Manila`. Instagram Direct Messages belongs to a later phase.

Keep React/Vite/Tailwind, centralized CSS, Hono Workers, MongoDB and the Worker media API. Preserve the three public pages and existing records.

Storage: `PLAN.md` tracks the Supabase Storage replacement. Admin media components must use the shared media-service contract and stable Worker URLs. Hosted validation and any existing R2 object migration are separate from the admin redesign.

## Audit findings

- The current navigation has Overview, Bookings, Schedule, Availability and Settings. Schedule and Availability separate closely related calendar work.
- Overview prioritizes aggregate cards rather than requests needing decisions.
- Booking review combines approval, rejection, status editing and scheduling without a single explicit decision sequence.
- Hold counts are calculated from the loaded list page. Overall counts must come from the backend, including pagination and expiry semantics.
- Current availability and validation reject past dates but do not consistently prevent today's bookings. A browser-only restriction would leave direct API submissions open.
- Closing days and slots needs one conflict policy: never silently replace an active hold or confirmed appointment.

## Navigation and scope

| Destination | Main job | Initial state |
| --- | --- | --- |
| Bookings — `/admin/bookings` | Review requests and manage appointments | Needs review: active on-hold and legacy pending requests |
| Calendar — `/admin/calendar` | Inspect the schedule and block/unblock availability | Current month plus selected-day agenda |

Login and `/admin` open Bookings. Redirect old Schedule and Availability URLs to Calendar, retaining date/month context where possible. Remove Overview and general Settings from primary navigation. Keep necessary account/security actions, sign out and a public-site link in a compact account menu.

Do not add analytics, revenue charts, payment management, content editors or an empty Messages tab. Preserve existing payment data without turning it into a new primary workflow.

## Design direction

Use the design-taste frontend skill's app-screen workflow at implementation time. This is a working interface, not another landing page.

- Retain the original Mars mark, neutral paper surfaces, wine text and restrained wax-red accents. Gold must meet contrast requirements wherever used.
- Use Onest for controls and reading. Keep display typography to identity and compact titles; no homepage-sized headings.
- Flat surfaces, readable rows, consistent spacing and text-based status labels. Color supplements meaning; it never carries status alone.
- No parallax, floating artwork, custom cursor, decorative KPI cards or delayed operational content.
- Desktop Bookings: queue and detail pane. Calendar: month and selected-day slots. Phone: one working pane at a time, with Back restoring filters and scroll position.
- Two visibly named destinations, 44px minimum touch targets, visible keyboard focus and accessible dialogs. At 1440x900 and 390px phone width, actual requests/actions must appear without a wall of filters or metric cards.

## Booking review flow

1. Open Needs review. Show client, requested Philippine date/time, status, submitted time and actual hold expiry. Sort active holds by nearest expiry with stable ordering; keep legacy pending requests accessible.
2. Select a request. Read contact details, idea, placement, size, Supabase references and history. Separate the client's requested start from the studio's final appointment range.
3. Choose Confirm appointment or Decline request. Confirmation requires an explicit actual date/start/end using supported schedule boundaries; do not silently treat an inferred duration as agreed.
4. Review the selected range and conflicts, then save. Disable duplicate submission. Show the authoritative server result and refresh both queue and calendar.
5. Decline records a reason/history entry and releases the correct hold. Normal review must not hard-delete requests.
6. Confirmed appointments expose deliberate rescheduling, cancellation and completion. Failed changes retain the previous valid booking and range.

Filters: Needs review, Confirmed, Completed, Cancelled/declined and All; date/client search is secondary. Counts represent the full filtered dataset, not just one page.

Expired holds must be identifiable even before cleanup runs. The current schema has no standalone `expired` enum: derive the label from expiry/history or perform an explicit reviewed migration. Do not invent a persisted status. Stale or expired requests cannot be confirmed without authoritative revalidation.

Preserve notes, filters and the selected request on recoverable errors. Another admin's update causes a conflict/refetch, not a silent overwrite. Notification failure must not misrepresent a successfully committed confirmation as a failed booking change.

## Calendar and non-bookable time

1. Select a date and inspect authoritative Open, On hold, Confirmed and Blocked slots.
2. Choose Block whole day or Block time range. Ranges are start-inclusive/end-exclusive and use actual supported slot boundaries.
3. Add an optional internal reason and review the exact affected date/range. Public availability must not expose private reasons or client identifiers.
4. Reject overlaps with active holds or confirmed appointments by default. Show affected bookings to the authenticated admin. Cancellation or rescheduling is a separate explicit action.
5. Apply the entire operation atomically; refresh the selected day and public availability after success.
6. Unblock only an admin-created closure. Never release a client's hold or reopen a confirmed appointment through this action.

Today remains visible for reviewing existing appointments and blocking time. Removing a closure from today does not make it publicly bookable. Recurring closures and complex recurring schedules are outside the first release; do not automatically carry old bulk-opening controls into the simplified interface.

## Same-day booking policy

**Default: a new appointment's date must be strictly after today's date in `Asia/Manila`. The earliest date is tomorrow.** This is a calendar-day rule, not a rolling 24-hour lead time.

- Create one server-owned policy function with an injectable clock. Compute the studio date using an explicit timezone, never the Worker/browser/database machine's local date or an unqualified UTC date slice.
- Apply it to public availability ranges, single-date availability, public booking creation, admin creation of new client appointments and rescheduling to a new date.
- Validate before creating records or taking holds and recheck at the authoritative mutation boundary. A crafted API request must fail even if browser validation is bypassed.
- Today/past availability returns a truthful non-bookable day, zero bookable slots and a policy explanation. A well-formed date must not become a format error or fake network outage.
- The public calendar disables today and begins with a policy-eligible date. Eligibility does not imply availability: preserve actual closures, holds, bookings and unknown/error states.
- Existing same-day appointments are not cancelled or rewritten. Viewing, cancellation and completion remain possible. Before implementation, explicitly define handling of an already-existing unconfirmed same-day request; default to no new same-day reservation or move to today.
- Recheck at Philippine midnight and on submit. Use server-provided policy/date metadata so a stale tab cannot keep yesterday's rule. Preserve the booking draft when refreshing invalid date/time choices.
- Phase one has no same-day bypass/toggle. A later exception requires a separate product decision, authorization and an audit record.

## Architecture and data contracts

- `client/src/features/admin/bookings`: queue/detail composition, filter state and mutations.
- `client/src/features/admin/calendar`: month/day composition and block/unblock mutations.
- Shared components: request rows, status labels, detail sections, date/time controls and conflict notices. Reuse the existing calendar model and UI primitives.
- Keep API adapters transport-only. Centralize shared admin tokens/styles in `client/src/index.css`, with Tailwind for responsive composition.
- Backend routes authenticate and validate. Controllers orchestrate operations, services own policy and schedule changes, MongoDB stores application records and Supabase holds reference files.
- Availability responses include effective timezone, studio date, earliest bookable date and same-day policy. Cache behavior must not retain yesterday's eligibility after midnight.
- Preserve unique indexes and server-side pagination/totals. Use version/conditional checks and MongoDB transactions, or another explicitly verified atomic design, when booking and closure operations change multiple records. A Durable Object does not automatically make interleaved asynchronous writes transactional.
- Mutations must be safe to retry without duplicate bookings, status history or notifications. Retain attribution and real expiry checks.
- Preserve existing deep links and historical records. Any schema/enum change requires migration and rollback instructions. Do not mutate production data during QA.

## Implementation sequence

| Phase | Work | Exit condition |
| --- | --- | --- |
| 1. Contracts | Map current statuses, routes, indexes and conflict behavior; decide treatment of existing same-day requests | Written transition/conflict matrix and compatible API contracts |
| 2. Policy | Implement the shared server rule and update public availability/calendar | Today is rejected across entry points; tomorrow obeys actual availability; midnight tests pass |
| 3. Design | Desktop/tablet/phone designs, shared shell, controls and full state specifications | Reviewed screenshots and keyboard flow; no fabricated business data |
| 4. Bookings | Queue/detail, explicit decisions, server totals and conflict recovery | Review and appointment transitions pass isolated integration tests |
| 5. Calendar | Unified month/day view, whole-day/range closures and guarded reopening | Closures cannot overwrite bookings; public availability reflects committed edits |
| 6. Cutover | Compatibility redirects, retire replaced pages, staged integration and visual QA | Acceptance checks pass on test Atlas and a staging Supabase bucket |

## Implemented transitions

| State | Allowed actions |
| --- | --- |
| Active hold or legacy pending | Confirm a future appointment with an explicit range, or decline with a reason |
| Expired hold | Review as expired. A new booking request is required to reserve time. |
| Confirmed | Reschedule to a date from tomorrow onward, cancel with a reason, or mark completed. Existing same-day appointments stay visible and can be cancelled or completed. |
| Completed or cancelled | Review booking details and history |

Booking and schedule writes use MongoDB transactions. Booking decisions require the loaded `updatedAt`, and closure edits require the loaded schedule version. The confirmation transaction releases the previous range and reserves the new one together, so a conflict rolls back the release. Public submissions carry a retry key, and booking notifications run after commit.

The Calendar uses `PUT /api/schedule/:date/closure` for whole-day and range changes. Earlier bulk, force-override and per-slot mutation routes are retired. Existing blocked dates remain visible and can be reopened individually. Legacy whole-day records can also contain independent slot closures. Reopening the day flag keeps those slots closed until explicitly unblocked.
| Future | Instagram Direct Messages | Separate account eligibility, platform-policy and messaging tests pass |

## Future: Instagram Direct Messages

Connect the studio's professional Instagram account, receive supported message events, review conversations and send explicit admin replies. This is separate from Works feed access; do not assume its token/permissions grant messaging. No placeholder inbox or sending behavior ships in the initial rebuild.

Before implementation, verify the current Meta login route, account eligibility, messaging permissions/access levels, app review, webhook subscriptions and response restrictions against official documentation.

Planned work:

- Reuse the future Connect/Reconnect authorization flow, single-use OAuth state and encrypted MongoDB credential storage. Revocation/disconnect must not break booking administration.
- Add a Worker webhook endpoint with verification challenge handling, raw-body signature validation, duplicate/replay protection and prompt acknowledgement. Process subsequent work through a retryable queue/background flow.
- Define access, retention/deletion and attachment rules before storing message content. Store necessary conversation metadata/content in MongoDB. Do not publicly copy private DM attachments into the existing public media delivery path.
- Add Messages navigation only when the real integration works. Show real sender/content, timestamps, unread and failure states. Handle out-of-order events, unsupported types and pagination honestly.
- Send only after an authenticated admin explicitly submits a reply. Track pending/sent/failed from Meta's actual response, enforce current messaging restrictions, prevent duplicates and require deliberate retry when delivery is uncertain.
- Link a conversation to a booking only through an explicit action. A DM never automatically creates, confirms or reserves an appointment.
- Verify webhook authenticity, retries, reconnect/revocation, rate limits, attachment privacy and sending restrictions using an authorized test account. Never message real customers during QA.

## Acceptance checklist

- [x] Only Bookings and Calendar are primary destinations. Login opens Needs review and legacy URLs redirect.
- [x] Active holds and legacy pending requests have a paginated queue, server counts, expiry and history.
- [x] Confirmation requires an explicit date, start and end and rejects expired or conflicting state.
- [x] Whole-day and range blocks preserve active holds and confirmed appointments. Reopening affects only studio closures.
- [x] Server and public UI prevent new same-day booking and rescheduling in `Asia/Manila`.
- [ ] Tests cover Philippine 23:59/00:00, other browser timezones, leap dates, stale tabs and direct API calls; tomorrow is not incorrectly treated as a 24-hour wait.
- [ ] Tests cover concurrent hold/closure, confirmation/expiry, duplicate submissions, release/cancellation and stale edits. Database and public availability agree after conflicts.
- [ ] Unknown availability remains unknown; error states preserve useful input. No fabricated counts or operational data.
- [ ] Verify live Supabase references in staging. No new client storage is used for booking details or media.
- [x] Desktop, tablet and phone layouts, short viewport, focus restoration, named controls and reduced motion were checked with browser fixtures.
- [x] Frontend lint and build, focused tests and the Worker dry run pass locally.
- [x] Verification is recorded in `PLAN.md` and browser artifacts are stored in ignored `.taste-skill/`.
- [x] DMs remain future work until their separate acceptance checks pass.
