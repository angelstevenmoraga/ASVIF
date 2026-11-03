const sql = require("mssql");

const config = {
    server: process.env.DB_SERVER || "localhost",
    port: Number(process.env.DB_PORT) || 1433,
    user: process.env.DB_USER || "sa",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ASVIF",
    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== "false"
    }
};

const poolPromise = sql.connect(config);

async function query(text, values = []) {
    const pool = await poolPromise;
    const request = pool.request();
    const sqlText = values.reduce((result, value, index) => {
        request.input(`p${index}`, value === null ? sql.NVarChar : value);
        return result.replace("?", `@p${index}`);
    }, text);
    return request.query(sqlText);
}

const database = {
    async get(text, values = []) {
        const result = await query(text, values);
        return result.recordset[0];
    },
    async all(text, values = []) {
        const result = await query(text, values);
        return result.recordset;
    },
    async run(text, values = []) {
        const result = await query(text, values);
        return { changes: result.rowsAffected[0] || 0, recordset: result.recordset || [] };
    },
    async exec(text) {
        return query(text);
    },
    async init() {
        await query(`
            IF OBJECT_ID(N'usuarios', N'U') IS NULL CREATE TABLE usuarios (
                id INT IDENTITY(1,1) PRIMARY KEY, nombre NVARCHAR(80) NOT NULL,
                usuario NVARCHAR(30) NOT NULL UNIQUE, correo NVARCHAR(120) NOT NULL UNIQUE,
                telefono NVARCHAR(30) NOT NULL, nacionalidad NVARCHAR(80) NOT NULL,
                password_hash NVARCHAR(200) NOT NULL, creado_en DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
            );
            IF OBJECT_ID(N'sesiones', N'U') IS NULL CREATE TABLE sesiones (
                token_hash CHAR(64) PRIMARY KEY, usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                expira_en DATETIME2 NOT NULL
            );
            IF OBJECT_ID(N'movimientos', N'U') IS NULL CREATE TABLE movimientos (
                id INT IDENTITY(1,1) PRIMARY KEY, usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                tipo NVARCHAR(10) NOT NULL CHECK (tipo IN (N'ingreso', N'gasto')), categoria NVARCHAR(80) NOT NULL,
                monto DECIMAL(18,2) NOT NULL CHECK (monto >= 0), fecha DATE NOT NULL,
                creado_en DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
            );
            IF OBJECT_ID(N'metas_ahorro', N'U') IS NULL CREATE TABLE metas_ahorro (
                id INT IDENTITY(1,1) PRIMARY KEY, usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                nombre NVARCHAR(120) NOT NULL, monto_objetivo DECIMAL(18,2) NOT NULL CHECK (monto_objetivo > 0),
                monto_actual DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (monto_actual >= 0), fecha_objetivo DATE NULL,
                creado_en DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
            );
            IF OBJECT_ID(N'tarjetas_control', N'U') IS NULL CREATE TABLE tarjetas_control (
                id INT IDENTITY(1,1) PRIMARY KEY, usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                alias NVARCHAR(80) NOT NULL, entidad NVARCHAR(80) NULL,
                limite DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (limite >= 0),
                dia_corte TINYINT NOT NULL CHECK (dia_corte BETWEEN 1 AND 31),
                dia_pago TINYINT NOT NULL CHECK (dia_pago BETWEEN 1 AND 31),
                creado_en DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
            );
            IF OBJECT_ID(N'paises', N'U') IS NULL CREATE TABLE paises (
                id INT IDENTITY(1,1) PRIMARY KEY, nombre NVARCHAR(80) NOT NULL UNIQUE
            );
        `);
        const paises = ["Argentina", "Bolivia", "Brasil", "Canadá", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador", "El Salvador", "España", "Estados Unidos", "Guatemala", "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela", "Alemania", "Australia", "China", "Corea del Sur", "Egipto", "Francia", "India", "Indonesia", "Italia", "Japón", "Marruecos", "Noruega", "Nueva Zelanda", "Países Bajos", "Portugal", "Reino Unido", "Rusia", "Sudáfrica", "Suecia", "Suiza", "Turquía"];
        for (const pais of paises) {
            await query("IF NOT EXISTS (SELECT 1 FROM paises WHERE nombre = ?) INSERT INTO paises (nombre) VALUES (?)", [pais, pais]);
        }
    }
};

module.exports = database;
