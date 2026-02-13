'use strict';
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

async function testConnection() {
  try {
    const c = await pool.getConnection();
    await c.ping();
    c.release();
    return true;
  } catch (e) {
    console.error('[DB]', e.message);
    return false;
  }
}

module.exports = pool;
module.exports.testConnection = testConnection;
