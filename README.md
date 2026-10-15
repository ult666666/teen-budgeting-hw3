# Teen Budgeting - HW3

Charles Dai | 70-445 Artificial Intelligence for Business Leaders | Fall 2026

Live app: https://teen-budgeting-hw3.vercel.app
Public repository: https://github.com/ult666666/teen-budgeting-hw3
Spec: instructor's Starter C, with the explicit Scope for HW3 in `docs/requirements.md`.

## Run and test

Use Node.js 22 or newer. Run `npm ci`, `npm test`, `npm run build`, and `npm run dev`.
The local app is at http://127.0.0.1:4317. Vitest is pinned in the lockfile.
`npm run build` checks JavaScript syntax and copies the browser assets into `dist`.
Vercel deploys the `api/budget.js` Node function separately from these static assets.

## What was built

The October 1 prototype was a local-only budget with description/amount addition. Its source is the first commit; the original folder remains unchanged on the laptop.
HW3 completes R-05: amount, date, category, optional merchant/note, editing and deletion, with server-computed integer-cent totals. Editing and deletion were not built in the October 1 prototype.
Tests were written and run before the story implementation. Seven story assertions failed, then all ten tests passed. SEC-18 then had three genuine failures for overlong add/edit text before the fix. The resulting suite passed 32 tests; later HTTP/evidence checks may increase this count.

## Scope and limitations

- No real payments. A future payment demo must use a Simulated payment button; this app has no checkout.
- No sign-in provider. A typed, made-up display name is only a demo namespace, NOT authentication. Anyone choosing the same name sees the same demo.
- No database. Data is in server memory and resets on every deploy. Restarting or switching server instances may also reset it. A stale write gets 409, not a false success.
- Use fictional spending only. No bank connections, passwords, API/model calls, analytics or third-party trackers.
- This is not a production financial product. Lessons, age verification, savings goals, category/period insights, authenticated ownership, account deletion and distributed rate limiting are not built.
- The original files in `docs/` describe a larger product. A passing homework story does not mean that entire product or security spec is complete.

## Security spec audit

Statuses refer only to implemented homework routes. N/A means outside this build, not a completed production control.

| Rule | Status | Evidence or remaining gap |
| --- | --- | --- |
| SEC-1 | Fully in inspected snapshot | Source/history checks found no credential patterns; no API key is required. |
| SEC-2 | N/A | No runtime secrets are required. Future secrets must use environment variables. |
| SEC-3 | Fully | `.env.example` states that no variables are required. |
| SEC-4 | Not met | No identity provider. Display names can be impersonated. |
| SEC-5 | Partly | Missing name returns 401, but a name is not a verified session. |
| SEC-6 | Not met | Real sign-in and uniform sign-in failure handling are not implemented. |
| SEC-7 | Not met | Data is partitioned by typed name, not by a trusted signed-in user ID. |
| SEC-8 | Partly | Another demo namespace/missing entry gets 404; name impersonation still defeats real ownership. |
| SEC-9 | Not met for personal data | No sharing feature, but same-name access means personal spending must never be entered. |
| SEC-10 | Not met | No age-before-account flow; no real accounts are created. |
| SEC-11 | Not met | Under-13 account refusal is not implemented. |
| SEC-12 | N/A | No checkout exists; minor purchase policy is not implemented. |
| SEC-13 | Fully on deployment | Public app and API use HTTPS. Local development is loopback HTTP. |
| SEC-14 | Fully for scoped fields | Only demo display name and budget/entry fields are requested. No real data is needed. |
| SEC-15 | Fully for entries | Delete removes the entry from history and recalculates totals; story and live checks. |
| SEC-16 | Not met | No account deletion workflow, persistent store, or production retention policy. |
| SEC-17 | Fully in application code | Handler and service do not log request bodies, names or entries. Hosting-provider logs are outside this code audit. |
| SEC-18 | Fully for scoped entry routes | Server rejects invalid amount, date, category, text types, and merchant/note over 200 characters on both add and edit. Tests cover 200/201 boundaries. Future unbuilt routes are not certified. |
| SEC-19 | Fully for rendered entry fields | User text is inserted using `textContent`, not HTML. Goals do not exist in this build. |
| SEC-20 | Fully for scoped totals | Server computes budget/spent/remaining from its state and ignores client totals; test included. Category limit comparisons are not built. |
| SEC-21 | Not met | No shared 60-writes/minute per-address limiter. Memory-size bounds are not a rate limiter. |
| SEC-22 | N/A | No AI endpoint exists. |
| SEC-23 | Fully for app data | Tests use fictional names and in-memory fixtures; app has no production-data credentials. Authorized GitHub/Vercel account tools were used only for publication. |
| SEC-24 | Procedural | User authorized this isolated homework project and publication. No outside-project deletions or Git history rewriting occurred. |

### SEC-18 before and after

Before: **Partly** - amount/date/category/text types validated on the server, but the 200-character cap was only in the page.
After: **Fully for scoped entry routes** - server checks the cap before add/edit mutation; no remaining gap in this row for implemented routes. Other audit rows and future routes remain as listed above.

## Criterion-to-test mapping

| Acceptance criterion | Test name | Status |
| --- | --- | --- |
| R-05 save and show all entry fields | a saved entry appears in history with amount date category merchant and note | Passing |
| R-05 optional fields are optional | an entry can be saved without an optional merchant or note | Passing |
| R-05 edit and update totals | editing an entry updates its fields and recalculates totals | Passing |
| R-05 delete and update totals | deleting an entry removes it and updates the totals | Passing |
| R-11 rejection preserves data | a failed save leaves stored entries and totals unchanged | Passing |
| SEC-18 note length | the server rejects a 201-character note before saving | Passing |
| SEC-18 edit length | an overlong edited note is rejected without replacing the existing entry | Passing |
| SEC-20 server authority | the server ignores a total sent by the browser | Passing |

## AI-use disclosure

ChatGPT assisted with reading the specification, planning, coding, tests, source checks, GitHub/Vercel setup, AI-assisted browser checks of this app, research and write-up drafting. The student must personally complete the four manual-only Part D attempts, review the live checks, and revise the memo in their own words. No automated checks of a classmate's app are represented as manual work, and no unperformed result is reported as observed.
