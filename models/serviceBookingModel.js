const db = require('../config/db');

// Creates ONE pending booking and ONE pending payment in a single transaction.
// Callback contract:
//   callback(null, { bookingId, paymentId })  -> both records committed
//   callback(null, null)                      -> pet not owned / service unavailable
//   callback(error)                           -> database failure
function createPendingBooking(ownerId, petId, serviceId, bookingDate, callback) {
  let finished = false;
  function finish(err, result) {
    if (finished) return;
    finished = true;
    callback(err, result);
  }

  db.getConnection((connErr, conn) => {
    if (connErr) return finish(connErr);

    // Roll back, always release the connection, then report the original error
    function fail(err) {
      conn.rollback((rollbackErr) => {
        if (rollbackErr) console.error('Rollback failed:', rollbackErr);
        conn.release();
        finish(err);
      });
    }

    conn.beginTransaction((beginErr) => {
      if (beginErr) {
        conn.release();
        return finish(beginErr);
      }

      // The price comes from the services table, never from the browser.
      // The row is only inserted if the pet belongs to ownerId AND the service is active.
      const bookingSql = `
        INSERT INTO service_bookings (pet_id, service_id, booking_status, booked_price, booking_date)
        SELECT p.id, s.id, 'pending', s.price, ?
        FROM pets p
        JOIN services s ON s.id = ? AND s.is_active = 1
        WHERE p.id = ? AND p.owner_id = ?`;

      conn.query(bookingSql, [bookingDate, serviceId, petId, ownerId], (bookErr, bookResult) => {
        if (bookErr) return fail(bookErr);

        if (bookResult.affectedRows !== 1) {
          // Not owned / unavailable: nothing was written
          return conn.rollback((rollbackErr) => {
            conn.release();
            if (rollbackErr) return finish(rollbackErr);
            finish(null, null);
          });
        }

        const bookingId = bookResult.insertId;

        // Payment amount is copied from the booking's stored price
        const paymentSql = `
          INSERT INTO payments (booking_id, amount, payment_status)
          SELECT id, booked_price, 'pending' FROM service_bookings WHERE id = ?`;

        conn.query(paymentSql, [bookingId], (payErr, payResult) => {
          if (payErr) return fail(payErr);
          if (payResult.affectedRows !== 1) {
            return fail(new Error('Payment record was not created'));
          }

          conn.commit((commitErr) => {
            if (commitErr) return fail(commitErr);
            conn.release();
            finish(null, { bookingId, paymentId: payResult.insertId });
          });
        });
      });
    });
  });
}

// Booking history for the owner's pets, newest first.
// LEFT JOIN so a booking without a payment row is still shown.
function getBookingsByOwner(ownerId, callback) {
  const sql = `
    SELECT sb.id AS booking_id,
           DATE_FORMAT(sb.booking_date, '%Y-%m-%d') AS booking_date,
           p.name AS pet_name,
           s.name AS service_name,
           sb.booked_price,
           sb.booking_status,
           pay.payment_status,
           pay.payment_reference,
           sb.created_at
    FROM service_bookings sb
    JOIN pets p ON p.id = sb.pet_id
    JOIN services s ON s.id = sb.service_id
    LEFT JOIN payments pay ON pay.booking_id = sb.id
    WHERE p.owner_id = ?
    ORDER BY sb.created_at DESC, sb.id DESC`;
  db.query(sql, [ownerId], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows);
  });
}

module.exports = { createPendingBooking, getBookingsByOwner };
