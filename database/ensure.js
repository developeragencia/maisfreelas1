'use strict';
/**
 * Cria o banco e as tabelas automaticamente se não existirem.
 * Usa schema-autocreate.sql (CREATE TABLE IF NOT EXISTS) para não apagar dados.
 */
const path = require('path');
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (_) {}

const mysql = require('mysql2/promise');
const fs = require('fs');

async function ensureDatabase(config) {
  config = config || {};
  const dbName = config.database || process.env.DB_NAME || 'maisfreelas';
  const baseConfig = {
    host: (config.host || process.env.DB_HOST || '').trim() || 'localhost',
    port: parseInt(config.port || process.env.DB_PORT || '3306', 10),
    user: config.user || process.env.DB_USER || 'root',
    password: config.password || process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
    multipleStatements: true,
  };

  const connectTimeout = 10000;
  const connConfig = { ...baseConfig, connectTimeout };
  let conn = null;
  try {
    try {
      conn = await mysql.createConnection({ ...connConfig, database: dbName });
      await conn.ping();
    } catch (e) {
      if (e.code === 'ER_BAD_DB_ERROR') {
        if (conn) await conn.end();
        conn = await mysql.createConnection(connConfig);
        await conn.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await conn.end();
        conn = await mysql.createConnection({ ...connConfig, database: dbName });
      } else {
        throw e;
      }
    }
    const schemaPath = path.join(__dirname, 'schema-autocreate.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await conn.query(sql);
    await conn.end();
    return true;
  } catch (e) {
    if (conn) try { await conn.end(); } catch (_) {}
    throw e;
  }
}

module.exports = { ensureDatabase };
