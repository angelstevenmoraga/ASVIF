const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");
const fs = require("node:fs");

const dataDirectory = path.join(__dirname, "data");
fs.mkdirSync(dataDirectory, { recursive: true });

const database = new DatabaseSync(path.join(dataDirectory, "asvif.sqlite"));
database.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        usuario TEXT NOT NULL COLLATE NOCASE UNIQUE,
        correo TEXT NOT NULL COLLATE NOCASE UNIQUE,
        telefono TEXT NOT NULL,
        nacionalidad TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sesiones (
        token_hash TEXT PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        expira_en TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS movimientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
        categoria TEXT NOT NULL,
        monto REAL NOT NULL CHECK (monto >= 0),
        fecha TEXT NOT NULL,
        creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS metas_ahorro (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        nombre TEXT NOT NULL,
        monto_objetivo REAL NOT NULL CHECK (monto_objetivo > 0),
        monto_actual REAL NOT NULL DEFAULT 0 CHECK (monto_actual >= 0),
        fecha_objetivo TEXT,
        creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
`);

module.exports = database;
