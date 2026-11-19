const db = require('../config/db');

// Numbers for the admin dashboard
function getAdminStats(callback) {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'user') AS customers,
      (SELECT COUNT(*) FROM pets) AS pets,
      (SELECT COUNT(*) FROM service_bookings) AS bookings,
      (SELECT COUNT(*) FROM payments WHERE payment_status = 'pending') AS pending_payments,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'approved') AS approved_total,
      (SELECT COUNT(*) FROM consultations WHERE status = 'open') AS open_consultations`;
  db.query(sql, (err, rows) => {
    if (err) return callback(err);
    callback(null, rows[0]);
  });
}

module.exports = { getAdminStats };
