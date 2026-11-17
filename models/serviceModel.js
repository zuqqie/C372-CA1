const db = require('../config/db');

// Active services only, cheapest-to-display fields, ordered by name
function getActiveServices(callback) {
  const sql = 'SELECT id, name, price FROM services WHERE is_active = 1 ORDER BY name';
  db.query(sql, (err, rows) => {
    if (err) return callback(err);
    callback(null, rows);
  });
}

module.exports = { getActiveServices };
