const db = require('../config/db');

// One booking with its payment, only if the booking's pet belongs to ownerId.
function getOwnedBookingPayment(ownerId, bookingId, callback) {
  const sql = `
    SELECT sb.id AS booking_id,
           DATE_FORMAT(sb.booking_date, '%Y-%m-%d') AS booking_date,
           p.name AS pet_name,
           s.name AS service_name,
           sb.booked_price,
           sb.booking_status,
           pay.id AS payment_id,
           pay.amount,
           pay.payment_status,
           pay.payment_reference
    FROM service_bookings sb
    JOIN pets p ON p.id = sb.pet_id
    JOIN services s ON s.id = sb.service_id
    JOIN payments pay ON pay.booking_id = sb.id
    WHERE sb.id = ? AND p.owner_id = ?
    LIMIT 1`;
  db.query(sql, [bookingId, ownerId], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows.length ? rows[0] : null);
  });
}

// Saves the simulated payment result on BOTH records in one transaction.
// Only a pending or declined payment can be changed, and only by the pet's owner.
// callback(null, true)  -> saved
// callback(null, false) -> not allowed (not owned, or already approved)
function savePaymentResult(ownerId, bookingId, paymentStatus, bookingStatus, reference, callback) {
  db.getConnection((connErr, conn) => {
    if (connErr) return callback(connErr);

    function fail(err) {
      conn.rollback(() => { conn.release(); callback(err); });
    }

    conn.beginTransaction((beginErr) => {
      if (beginErr) { conn.release(); return callback(beginErr); }

      const paySql = `
        UPDATE payments pay
        JOIN service_bookings sb ON sb.id = pay.booking_id
        JOIN pets p ON p.id = sb.pet_id
        SET pay.payment_status = ?, pay.payment_reference = ?
        WHERE sb.id = ? AND p.owner_id = ?
          AND pay.payment_status IN ('pending', 'declined')`;

      conn.query(paySql, [paymentStatus, reference, bookingId, ownerId], (payErr, payRes) => {
        if (payErr) return fail(payErr);

        if (payRes.affectedRows !== 1) {
          return conn.rollback(() => { conn.release(); callback(null, false); });
        }

        conn.query('UPDATE service_bookings SET booking_status = ? WHERE id = ?',
          [bookingStatus, bookingId], (bookErr) => {
            if (bookErr) return fail(bookErr);
            conn.commit((commitErr) => {
              if (commitErr) return fail(commitErr);
              conn.release();
              callback(null, true);
            });
          });
      });
    });
  });
}

module.exports = { getOwnedBookingPayment, savePaymentResult };
