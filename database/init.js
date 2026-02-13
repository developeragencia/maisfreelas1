#!/usr/bin/env node
'use strict';
/**
 * Cria o banco de dados e as tabelas do MaisFreelas do zero.
 * Uso: node database/init.js
 * Requer .env com DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME.
 * Se o banco não existir, será criado (usuário MySQL precisa de permissão).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_NAME = process.env.DB_NAME || 'maisfreelas';
const configWithoutDb = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  charset: 'utf8mb4',
  multipleStatements: true,
};

async function main() {
  let conn;
  try {
    conn = await mysql.createConnection(configWithoutDb);
    console.log('[DB] Conectado ao MySQL.');

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('[DB] Banco', DB_NAME, 'criado ou já existe.');

    await conn.changeUser({ database: DB_NAME });

    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await conn.query(sql);
    console.log('[DB] Schema aplicado com sucesso.');
  } catch (e) {
    console.error('[DB] Erro:', e.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
