const mysql = require('mysql2');
const config = require('../config.js');

// MySQL connection pool (shared by all models).
// A pool lets the booking model hold ONE connection for a whole transaction,
// while pool.query() still works for the other models.
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: config.dbPassword,
  database: 'petcare',
  waitForConnections: true,
  connectionLimit: 10,
  // Return DATE columns as 'YYYY-MM-DD' text so the day never shifts with the time zone
  dateStrings: ['DATE']
});

module.exports = pool;
