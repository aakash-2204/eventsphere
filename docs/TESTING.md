# Test plan and results

Results are recorded honestly: **Passed** means the check was actually run and
observed. **Pending** means it still has to be run against the live database.

## Automated checks

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | Passed (0 problems) |
| TypeScript (strict) | `npx tsc --noEmit` | Passed |
| Production build | `npm run build` | Passed (all routes compile) |

## Production tests already completed (live site)

| Flow | Result |
| --- | --- |
| Sign up → confirmation email → link → dashboard | Passed |
| Log in / log out | Passed |
| Forgot password → email → reset → log in | Passed |
| Logged-out access to `/dashboard` redirects to `/login?next=…` | Passed |
| Bad / expired email links go to `/auth/error` | Passed |

## Feature test plan (run after the Phase 3 migration and seed)

| # | Test | Steps | Expected | Result |
| --- | --- | --- | --- | --- |
| 1 | Event discovery | `/events`, search "Marathon", filter category/city/date/max price, sort by price | Matching published events only; filters stay in the URL | Pending |
| 2 | Event detail | Open a published event | Details, venue/online, ticket types with seats left | Pending |
| 3 | Hold + summary | Choose type + quantity → Continue | Checkout shows total and a 10:00 countdown; seats-left drops | Pending |
| 4 | Mock payment success | Pay now (card or UPI) | Loading state → "Payment successful" → tickets with QR codes | Pending |
| 5 | Duplicate payment | Reopen `/checkout/<id>` after paying | "This booking is confirmed"; no extra tickets | Pending |
| 6 | Mock payment failure | "Simulate failed payment" | "Payment failed (simulated)"; seats released | Pending |
| 7 | Hold expiry | Start checkout, wait 10 min, then pay | "Hold expired"; seats released | Pending |
| 8 | Overselling | Book the last seats from two accounts | Second gets "Not enough tickets left" | Pending |
| 9 | My tickets | `/tickets` upcoming / past tabs | QR per seat, statuses | Pending |
| 10 | Check-in | Organizer `/organizer/check-in`, enter ticket ID | "Checked in" | Pending |
| 11 | Duplicate check-in | Same ticket again | "Already checked in" | Pending |
| 12 | Wrong organizer | Another organizer checks in the ticket | "not authorized" | Pending |
| 13 | Booking cancellation | `/bookings/<id>` → Cancel | Booking + tickets cancelled, seats returned, notification | Pending |
| 14 | Event creation | Organizer creates draft, adds ticket types, uploads banner, submits | Status "pending approval" | Pending |
| 15 | Admin approval | Admin `/admin/events` → Approve | Event published and visible on `/events`; organizer notified | Pending |
| 16 | Event cancellation | Organizer cancels a published event with bookings | Bookings/tickets cancelled; attendees notified | Pending |
| 17 | Access control | Attendee opens `/admin`, `/organizer/events/new`, another user's `/bookings/<id>` | Redirect / 404, no data shown | Pending |
| 18 | Role management | Admin `/admin/users` → Make organizer | Role changes; admin role cannot be granted | Pending |
| 19 | Mobile layout | 360 px width | No horizontal scrolling; menus usable | Pending |
