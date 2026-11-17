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
  connectionLimit: 10
});

module.exports = pool;
