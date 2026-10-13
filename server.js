const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { promisify } = require("node:util");
const database = require("./db");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const scrypt = promisify(crypto.scrypt);
const sessions = new Map();

function sendJson(response, status, body) {
    response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(body));
}

function readJson(request) {
    return new Promise((resolve, reject) => {
        let content = "";
        request.on("data", (chunk) => {
            content += chunk;
            if (content.length > 100000) request.destroy();
        });
        request.on("end", () => {
            try {
                resolve(content ? JSON.parse(content) : {});
            } catch (error) {
                reject(error);
            }
        });
        request.on("error", reject);
    });
}

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = await scrypt(password, salt, 64);
    return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const derivedKey = await scrypt(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), derivedKey);
}

function readCookie(request, name) {
    const cookies = request.headers.cookie || "";
    const match = cookies.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function setSession(response, userId) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    database.prepare("INSERT INTO sesiones (token_hash, usuario_id, expira_en) VALUES (?, ?, ?)").run(tokenHash, userId, expiresAt);
    response.setHeader("Set-Cookie", `asvif_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);
}

function getCurrentUser(request) {
    const token = readCookie(request, "asvif_session");
    if (!token) return null;
    const session = database.prepare(`
        SELECT usuarios.id, usuarios.nombre, usuarios.usuario, usuarios.correo, usuarios.telefono, usuarios.nacionalidad
        FROM sesiones JOIN usuarios ON usuarios.id = sesiones.usuario_id
        WHERE sesiones.token_hash = ? AND sesiones.expira_en > datetime('now')
    `).get(hashToken(token));
    return session || null;
}

function requireUser(request, response) {
    const user = getCurrentUser(request);
    if (!user) sendJson(response, 401, { error: "Sesión no válida." });
    return user;
}

async function handleApi(request, response, pathname) {
    if (request.method === "POST" && pathname === "/api/auth/register") {
        const body = await readJson(request);
        const fields = ["nombre", "usuario", "correo", "telefono", "nacionalidad", "password"];
        if (fields.some((field) => typeof body[field] !== "string" || !body[field].trim())) {
            return sendJson(response, 400, { error: "Todos los campos son obligatorios." });
        }
        if (body.password.length < 8) return sendJson(response, 400, { error: "La contraseña debe tener al menos 8 caracteres." });
        try {
            const passwordHash = await hashPassword(body.password);
            const result = database.prepare(`
                INSERT INTO usuarios (nombre, usuario, correo, telefono, nacionalidad, password_hash)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(body.nombre.trim(), body.usuario.trim(), body.correo.trim().toLowerCase(), body.telefono.trim(), body.nacionalidad.trim(), passwordHash);
            return sendJson(response, 201, { id: Number(result.lastInsertRowid), mensaje: "Cuenta creada." });
        } catch (error) {
            if (String(error.message).includes("UNIQUE")) return sendJson(response, 409, { error: "El usuario o correo ya está registrado." });
            throw error;
        }
    }

    if (request.method === "POST" && pathname === "/api/auth/login") {
        const body = await readJson(request);
        const user = database.prepare("SELECT * FROM usuarios WHERE usuario = ? COLLATE NOCASE").get(String(body.usuario || "").trim());
        if (!user || !(await verifyPassword(String(body.password || ""), user.password_hash))) {
            return sendJson(response, 401, { error: "Usuario o contraseña incorrectos." });
        }
        setSession(response, user.id);
        return sendJson(response, 200, { usuario: { nombre: user.nombre, usuario: user.usuario, correo: user.correo } });
    }

    if (request.method === "POST" && pathname === "/api/auth/logout") {
        const token = readCookie(request, "asvif_session");
        if (token) database.prepare("DELETE FROM sesiones WHERE token_hash = ?").run(hashToken(token));
        response.setHeader("Set-Cookie", "asvif_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
        return sendJson(response, 200, { correcto: true });
    }

    if (request.method === "GET" && pathname === "/api/auth/me") {
        const user = requireUser(request, response);
        return user ? sendJson(response, 200, { usuario: user }) : undefined;
    }

    if (request.method === "PUT" && pathname === "/api/auth/profile") {
        const user = requireUser(request, response);
        if (!user) return;
        const body = await readJson(request);
        const nombre = String(body.nombre || "").trim();
        const telefono = String(body.telefono || "").trim();
        const nacionalidad = String(body.nacionalidad || "").trim();
        if (nombre.length < 2 || telefono.length < 7 || nacionalidad.length < 2) {
            return sendJson(response, 400, { error: "Completa los datos del perfil." });
        }
        database.prepare("UPDATE usuarios SET nombre = ?, telefono = ?, nacionalidad = ? WHERE id = ?").run(nombre, telefono, nacionalidad, user.id);
        return sendJson(response, 200, { correcto: true });
    }

    if (request.method === "GET" && pathname === "/api/dashboard/summary") {
        const user = requireUser(request, response);
        if (!user) return;
        const resumen = database.prepare(`
            SELECT
                COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0) AS ingresos,
                COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END), 0) AS gastos,
                COUNT(*) AS movimientos
            FROM movimientos
            WHERE usuario_id = ?
        `).get(user.id);
        const metas = database.prepare(`
            SELECT COUNT(*) AS cantidad,
                COALESCE(SUM(monto_objetivo), 0) AS objetivo,
                COALESCE(SUM(monto_actual), 0) AS ahorrado
            FROM metas_ahorro
            WHERE usuario_id = ?
        `).get(user.id);
        return sendJson(response, 200, {
            ingresos: resumen.ingresos,
            gastos: resumen.gastos,
            saldo: resumen.ingresos - resumen.gastos,
            movimientos: resumen.movimientos,
            metas
        });
    }

    if (request.method === "POST" && pathname === "/api/movimientos") {
        const user = requireUser(request, response);
        if (!user) return;
        const body = await readJson(request);
        const monto = Number(body.monto);
        if (!['ingreso', 'gasto'].includes(body.tipo) || !String(body.categoria || '').trim() || !Number.isFinite(monto) || monto < 0) {
            return sendJson(response, 400, { error: "El movimiento no es válido." });
        }
        const fecha = /^\d{4}-\d{2}-\d{2}$/.test(String(body.fecha || "")) ? body.fecha : new Date().toISOString().slice(0, 10);
        const result = database.prepare(`
            INSERT INTO movimientos (usuario_id, tipo, categoria, monto, fecha)
            VALUES (?, ?, ?, ?, ?)
        `).run(user.id, body.tipo, String(body.categoria).trim(), monto, fecha);
        return sendJson(response, 201, { id: Number(result.lastInsertRowid) });
    }

    if (request.method === "PUT" && pathname === "/api/movimientos/snapshot") {
        const user = requireUser(request, response);
        if (!user) return;
        const body = await readJson(request);
        const fecha = new Date().toISOString().slice(0, 10);
        const ingresos = Array.isArray(body.ingresos) ? body.ingresos : [];
        const gastos = Array.isArray(body.gastos) ? body.gastos : [];
        const categoriasIngresos = ["Salario", "Acciones", "Otros"];
        const categoriasGastos = ["Alquiler", "Alimento", "Servicios", "Vehículo", "Mantenimiento", "Gasolina", "Ocio"];
        database.exec("BEGIN");
        try {
            database.prepare("DELETE FROM movimientos WHERE usuario_id = ? AND fecha = ?").run(user.id, fecha);
            const insertar = database.prepare(`
                INSERT INTO movimientos (usuario_id, tipo, categoria, monto, fecha)
                VALUES (?, ?, ?, ?, ?)
            `);
            ingresos.forEach((monto, index) => {
                if (Number(monto) > 0) insertar.run(user.id, "ingreso", categoriasIngresos[index] || "Otros", Number(monto), fecha);
            });
            gastos.forEach((monto, index) => {
                if (Number(monto) > 0) insertar.run(user.id, "gasto", categoriasGastos[index] || "Otros", Number(monto), fecha);
            });
            database.exec("COMMIT");
        } catch (error) {
            database.exec("ROLLBACK");
            throw error;
        }
        return sendJson(response, 200, { correcto: true });
    }

    if (request.method === "POST" && pathname === "/api/metas") {
        const user = requireUser(request, response);
        if (!user) return;
        const body = await readJson(request);
        const objetivo = Number(body.montoObjetivo);
        if (!String(body.nombre || "").trim() || !Number.isFinite(objetivo) || objetivo <= 0) {
            return sendJson(response, 400, { error: "La meta no es válida." });
        }
        const result = database.prepare(`
            INSERT INTO metas_ahorro (usuario_id, nombre, monto_objetivo, fecha_objetivo)
            VALUES (?, ?, ?, ?)
        `).run(user.id, String(body.nombre).trim(), objetivo, body.fechaObjetivo || null);
        return sendJson(response, 201, { id: Number(result.lastInsertRowid) });
    }

    if (request.method === "GET" && pathname === "/api/movimientos") {
        const user = requireUser(request, response);
        if (!user) return;
        const movimientos = database.prepare("SELECT id, tipo, categoria, monto, fecha FROM movimientos WHERE usuario_id = ? ORDER BY fecha DESC, id DESC").all(user.id);
        return sendJson(response, 200, { movimientos });
    }

    if (request.method === "GET" && pathname === "/api/metas") {
        const user = requireUser(request, response);
        if (!user) return;
        const metas = database.prepare("SELECT id, nombre, monto_objetivo, monto_actual, fecha_objetivo FROM metas_ahorro WHERE usuario_id = ? ORDER BY id DESC").all(user.id);
        return sendJson(response, 200, { metas });
    }

    sendJson(response, 404, { error: "Ruta no encontrada." });
}

function serveStatic(response, pathname) {
    let filePath = pathname === "/" ? path.join(ROOT, "index.html") : path.join(ROOT, pathname);
    if (!filePath.startsWith(ROOT)) return sendJson(response, 403, { error: "Acceso no permitido." });
    fs.stat(filePath, (error, stats) => {
        if (error || !stats.isFile()) return sendJson(response, 404, { error: "Archivo no encontrado." });
        const extensions = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
        response.writeHead(200, { "Content-Type": `${extensions[path.extname(filePath)] || "application/octet-stream"}; charset=utf-8` });
        fs.createReadStream(filePath).pipe(response);
    });
}

const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    try {
        if (requestUrl.pathname.startsWith("/api/")) await handleApi(request, response, requestUrl.pathname);
        else serveStatic(response, decodeURIComponent(requestUrl.pathname));
    } catch (error) {
        console.error(error);
        if (!response.headersSent) sendJson(response, 500, { error: "Error interno del servidor." });
    }
});

async function ensureDefaultUser() {
    const usuarioDemo = database.prepare("SELECT id FROM usuarios WHERE usuario = ? COLLATE NOCASE").get("admin");
    if (usuarioDemo) return;
    database.prepare(`
        INSERT INTO usuarios (nombre, usuario, correo, telefono, nacionalidad, password_hash)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run("Administrador", "admin", "admin@asvif.local", "00000000", "Nicaragüense", await hashPassword("asvif123"));
}

ensureDefaultUser()
    .then(() => server.listen(PORT, () => console.log(`ASVIF disponible en http://localhost:${PORT}`)))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
