# Feature: Simulated payment for a booking (CA1 extension)

## 1. User goal
As a pet owner, I want to pay for a pending booking and see whether the payment
was approved or declined, so that I know if my booking is confirmed.

## 2. Scope
- A simulation only. No card details are collected and no real money moves.
- Extends Lesson 8 (booking creates pending booking + pending payment). The
  Lesson 8 booking behaviour and messages are not changed.
- Reuses the Lesson 6 mock provider (services/mockPaymentProvider.js).
- The Lesson 6 Postman endpoints (/payments/prepare, /payments/mock) are unchanged.

## 3. Routes (all require login)
| Method | Path | Purpose |
|---|---|---|
| GET | /checkout/:bookingId | Review booking and amount, choose a simulated result |
| POST | /checkout/:bookingId | Run the simulated payment (testStatus APPROVED or DECLINED) |
| GET | /receipt/:bookingId | Payment confirmation (reads saved result, safe to refresh) |

## 4. Rules
- Owner comes from the session. A booking is only found if its pet belongs to the user.
- The amount comes from the saved payment record. The browser cannot set it.
- Only APPROVED and DECLINED are accepted. Anything else is rejected.
- Only a pending or declined payment can be paid. An approved payment cannot be changed.
- Payment row and booking row are updated together in one transaction.

## 5. Status mapping
| Provider result | payments.payment_status | service_bookings.booking_status | Message |
|---|---|---|---|
| APPROVED | approved | confirmed | Payment approved. Your booking is confirmed. |
| DECLINED | declined | payment_failed | Payment declined. Your booking is not confirmed. You can try again. |

## 6. Acceptance criteria
SP1: Pending booking, choose approved -> receipt shows approved / confirmed, reference saved.
SP2: Pending booking, choose declined -> receipt shows declined / payment_failed, Try again offered.
SP3: Declined booking can be paid again and then approved.
SP4: Approved booking cannot be paid again (redirected to receipt, status unchanged).
SP5: Another user cannot open or pay my booking (redirected, nothing changed).
SP6: testStatus other than APPROVED or DECLINED is rejected, nothing changed.
SP7: Extra form field such as amount=1 is ignored; amount stays the saved price.
SP8: Logged-out user is redirected to /login.

## 7. Out of scope
Real gateway, card form, refunds, webhooks, admin payment pages.
