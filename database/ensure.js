'use strict';
/**
 * Cria o banco e as tabelas automaticamente se não existirem.
 * Usado na subida do servidor (server.js) para não depender de rodar SQL à mão.
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function ensureDatabase(config) {
  config = config || {};
  const dbName = config.database || process.env.DB_NAME || 'maisfreelas';
  const configWithoutDb = {
    host: config.host || process.env.DB_HOST || '127.0.0.1',
    port: parseInt(config.port || process.env.DB_PORT || '3306', 10),
    user: config.user || process.env.DB_USER || 'root',
    password: config.password || process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
    multipleStatements: true,
  };

  let conn;
  try {
    conn = await mysql.createConnection(configWithoutDb);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.end();
    conn = null;

    conn = await mysql.createConnection({ ...configWithoutDb, database: dbName });
    const schemaPath = path.join(__dirname, 'schema.sql');
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
