# Change: Journal page redesign, admin area clean-up, date fix

## 1. Journal page (customers)
- Pet switcher pills, pet profile card (photo, chips, Entries / This month / Latest numbers).
- Entries shown as a timeline of cards, newest first, with a date badge and an icon chosen from the activity words.
- Search shows the result count and a Clear button. Friendly empty states.
- Same routes, ownership checks and POST deletes as before. No new database tables.

## 2. Admin area
- Admin menu: Dashboard, Customers, Customer Bookings, Consultation Inbox. No Journals, Book a Service or Booking History.
- Admins who open /journals, /services or /bookings (or POST /services/book) are redirected to /admin/dashboard (middleware blockAdmin).
- Dashboard shows customers, pets, bookings, approved simulated total, pending payments and open consultations.
- Customer Bookings page: search box and payment status filter (runs in the browser only).

## 3. Bug fix: journal dates one day early
- Cause: mysql2 returned DATE columns as JavaScript Dates at local midnight. toISOString() converts to UTC, so in Singapore (UTC+8) 2026-11-12 became 2026-11-11. The edit form also pre-filled the wrong day, so saving an edit could move an entry back a day.
- Fix: config/db.js uses dateStrings: ['DATE'] and the views show the text date directly.
- Entries are now ordered newest first (ORDER BY entry_date DESC, id DESC).

## 4. Tests
UI1: Dates on the journal page match the saved dates (12, 16, 18, 20 Nov).
UI2: Edit form for a 2026-11-12 entry is pre-filled with 2026-11-12.
UI3: Entries and search results are newest first.
UI4: Admin is redirected from /journals, /journals/new, /services, /bookings and POST /services/book.
UI5: Admin pages load: dashboard, customer bookings, customers, consultation inbox.
UI6: Customer pages still load. A customer opening /admin/bookings gets Access Denied.
