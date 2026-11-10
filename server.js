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
function normalizeUsernameBase(name) {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function generateUsername(name) {
    const base = normalizeUsernameBase(name).slice(0, 27);
    if (base.length < 3) throw new Error("El nombre no permite generar un usuario válido.");
    for (let attempt = 0; attempt < 20; attempt += 1) {
        const suffix = crypto.randomInt(100, 1000).toString();
        const usuario = `${base}${suffix}`;
        if (!await database.get("SELECT id FROM usuarios WHERE usuario = ?", [usuario])) return usuario;
    }
    throw new Error("No fue posible generar un usuario disponible.");
}

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

async function setSession(response, userId) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    await database.run("INSERT INTO sesiones (token_hash, usuario_id, expira_en) VALUES (?, ?, ?)", [tokenHash, userId, expiresAt]);
    response.setHeader("Set-Cookie", `asvif_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);
}

async function getCurrentUser(request) {
    const token = readCookie(request, "asvif_session");
    if (!token) return null;
    const session = await database.get(`
        SELECT usuarios.id, usuarios.nombre, usuarios.usuario, usuarios.correo, usuarios.telefono, usuarios.nacionalidad
        FROM sesiones JOIN usuarios ON usuarios.id = sesiones.usuario_id
        WHERE sesiones.token_hash = ? AND sesiones.expira_en > NOW()
    `, [hashToken(token)]);
    return session || null;
}

async function requireUser(request, response) {
    const user = await getCurrentUser(request);
    if (!user) sendJson(response, 401, { error: "Sesión no válida." });
    return user;
}

async function handleApi(request, response, pathname) {
    if (request.method === "GET" && pathname === "/api/paises") {
        const paises = await database.all("SELECT id, nombre FROM paises ORDER BY nombre");
        return sendJson(response, 200, { paises });
    }

    if (request.method === "POST" && pathname === "/api/auth/register") {
        const body = await readJson(request);
        const fields = ["nombre", "correo", "telefono", "password"];
        if (fields.some((field) => typeof body[field] !== "string" || !body[field].trim())) {
            return sendJson(response, 400, { error: "Todos los campos son obligatorios." });
        }
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]{2,80}$/.test(body.nombre.trim())) {
            return sendJson(response, 400, { error: "El nombre solo puede contener letras y espacios." });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(body.correo.trim())) {
            return sendJson(response, 400, { error: "Escribe un correo electrónico válido." });
        }
        if (!/^[+]?[0-9][0-9\s().-]{6,19}$/.test(body.telefono.trim())) {
            return sendJson(response, 400, { error: "El número de teléfono no es válido." });
        }
        if (body.password.length < 8 || body.password.length > 72 || !/[A-Za-z]/.test(body.password) || !/\d/.test(body.password)) {
            return sendJson(response, 400, { error: "La contraseña debe tener 8-72 caracteres, una letra y un número." });
        }
        try {
            const passwordHash = await hashPassword(body.password);
            const usuario = await generateUsername(body.nombre.trim());
            const result = await database.run(`
                INSERT INTO usuarios (nombre, usuario, correo, telefono, password_hash)
                VALUES (?, ?, ?, ?, ?)
                RETURNING id
            `, [body.nombre.trim(), usuario, body.correo.trim().toLowerCase(), body.telefono.trim(), passwordHash]);
            return sendJson(response, 201, { id: result.recordset[0].id, usuario, mensaje: "Cuenta creada." });
        } catch (error) {
            if (String(error.message).includes("UNIQUE")) return sendJson(response, 409, { error: "El usuario o correo ya está registrado." });
            throw error;
        }
    }

    if (request.method === "POST" && pathname === "/api/auth/login") {
        const body = await readJson(request);
        const identificador = String(body.usuario || "").trim().toLowerCase();
        const user = await database.get(
            "SELECT * FROM usuarios WHERE LOWER(usuario) = ? OR LOWER(correo) = ?",
            [identificador, identificador]
        );
        if (!user || !(await verifyPassword(String(body.password || ""), user.password_hash))) {
            return sendJson(response, 401, { error: "Usuario o contraseña incorrectos." });
        }
        await setSession(response, user.id);
        return sendJson(response, 200, { usuario: { nombre: user.nombre, usuario: user.usuario, correo: user.correo } });
    }

    if (request.method === "POST" && pathname === "/api/auth/recovery/request") {
        const body = await readJson(request);
        const correo = String(body.correo || "").trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
            return sendJson(response, 400, { error: "Escribe un correo electrónico válido." });
        }
        const user = await database.get("SELECT id FROM usuarios WHERE LOWER(correo) = ?", [correo]);
        if (user) {
            const rawToken = crypto.randomBytes(32).toString("hex");
            await database.run("DELETE FROM tokens_recuperacion WHERE usuario_id = ?", [user.id]);
            await database.run(
                "INSERT INTO tokens_recuperacion (token_hash, usuario_id, expira_en) VALUES (?, ?, ?)",
                [hashToken(rawToken), user.id, new Date(Date.now() + 15 * 60 * 1000).toISOString()]
            );
        }
        if (!process.env.SMTP_HOST && !process.env.RESEND_API_KEY) {
            return sendJson(response, 503, { error: "La recuperación está preparada, pero el envío de correo aún no está configurado." });
        }
        return sendJson(response, 200, { mensaje: "Si el correo está registrado, recibirás instrucciones." });
    }

    if (request.method === "POST" && pathname === "/api/auth/recovery/reset") {
        const body = await readJson(request);
        const token = String(body.token || "");
        const password = String(body.password || "");
        if (!/^[a-f0-9]{64}$/.test(token) || password.length < 8 || password.length > 72 ||
            !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
            return sendJson(response, 400, { error: "El token o la contraseña no son válidos." });
        }
        const recovery = await database.get(
            "SELECT usuario_id FROM tokens_recuperacion WHERE token_hash = ? AND expira_en > NOW() AND intentos < 5",
            [hashToken(token)]
        );
        if (!recovery) return sendJson(response, 400, { error: "El enlace no es válido o ya expiró." });
        await database.run("UPDATE usuarios SET password_hash = ? WHERE id = ?", [await hashPassword(password), recovery.usuario_id]);
        await database.run("DELETE FROM tokens_recuperacion WHERE token_hash = ?", [hashToken(token)]);
        return sendJson(response, 200, { mensaje: "Contraseña actualizada." });
    }

    if (request.method === "POST" && pathname === "/api/auth/logout") {
        const token = readCookie(request, "asvif_session");
        if (token) await database.run("DELETE FROM sesiones WHERE token_hash = ?", [hashToken(token)]);
        response.setHeader("Set-Cookie", "asvif_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
        return sendJson(response, 200, { correcto: true });
    }

    if (request.method === "GET" && pathname === "/api/auth/me") {
        const user = await requireUser(request, response);
        return user ? sendJson(response, 200, { usuario: user }) : undefined;
    }

    if (request.method === "PUT" && pathname === "/api/auth/profile") {
        const user = await requireUser(request, response);
        if (!user) return;
        const body = await readJson(request);
        const nombre = String(body.nombre || "").trim();
        const telefono = String(body.telefono || "").trim();
        const nacionalidad = String(body.nacionalidad || "").trim();
        const pais = await database.get("SELECT id FROM paises WHERE nombre = ?", [nacionalidad]);
        if (nombre.length < 2 || telefono.length < 7 || !pais) {
            return sendJson(response, 400, { error: "Completa los datos del perfil." });
        }
        await database.run("UPDATE usuarios SET nombre = ?, telefono = ?, nacionalidad = ? WHERE id = ?", [nombre, telefono, nacionalidad, user.id]);
        return sendJson(response, 200, { correcto: true });
    }

    if (request.method === "GET" && pathname === "/api/dashboard/summary") {
        const user = await requireUser(request, response);
        if (!user) return;
        const resumen = await database.get(`
            SELECT
                COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0) AS ingresos,
                COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END), 0) AS gastos,
                COUNT(*) AS movimientos
            FROM movimientos
            WHERE usuario_id = ?
        `, [user.id]);
        const metas = await database.get(`
            SELECT COUNT(*) AS cantidad,
                COALESCE(SUM(monto_objetivo), 0) AS objetivo,
                COALESCE(SUM(monto_actual), 0) AS ahorrado
            FROM metas_ahorro
            WHERE usuario_id = ?
        `, [user.id]);
        return sendJson(response, 200, {
            ingresos: resumen.ingresos,
            gastos: resumen.gastos,
            saldo: resumen.ingresos - resumen.gastos,
            movimientos: resumen.movimientos,
            metas
        });
    }

    if (request.method === "POST" && pathname === "/api/movimientos") {
        const user = await requireUser(request, response);
        if (!user) return;
        const body = await readJson(request);
        const monto = Number(body.monto);
        if (!['ingreso', 'gasto'].includes(body.tipo) || !String(body.categoria || '').trim() || !Number.isFinite(monto) || monto < 0) {
            return sendJson(response, 400, { error: "El movimiento no es válido." });
        }
        const fecha = /^\d{4}-\d{2}-\d{2}$/.test(String(body.fecha || "")) ? body.fecha : new Date().toISOString().slice(0, 10);
        const result = await database.run(`
            INSERT INTO movimientos (usuario_id, tipo, categoria, monto, fecha)
            VALUES (?, ?, ?, ?, ?)
            RETURNING id
        `, [user.id, body.tipo, String(body.categoria).trim(), monto, fecha]);
        return sendJson(response, 201, { id: result.recordset[0].id });
    }

    if (request.method === "PUT" && pathname === "/api/movimientos/snapshot") {
        const user = await requireUser(request, response);
        if (!user) return;
        const body = await readJson(request);
        const fecha = new Date().toISOString().slice(0, 10);
        const ingresos = Array.isArray(body.ingresos) ? body.ingresos : [];
        const gastos = Array.isArray(body.gastos) ? body.gastos : [];
        const categoriasIngresos = ["Salario", "Acciones", "Otros"];
        const categoriasGastos = ["Alquiler", "Alimento", "Servicios", "Vehículo", "Mantenimiento", "Gasolina", "Ocio"];
        try {
            await database.run("DELETE FROM movimientos WHERE usuario_id = ? AND fecha = ?", [user.id, fecha]);
            for (const [index, monto] of ingresos.entries()) {
                if (Number(monto) > 0) await database.run("INSERT INTO movimientos (usuario_id, tipo, categoria, monto, fecha) VALUES (?, ?, ?, ?, ?)", [user.id, "ingreso", categoriasIngresos[index] || "Otros", Number(monto), fecha]);
            }
            for (const [index, monto] of gastos.entries()) {
                if (Number(monto) > 0) await database.run("INSERT INTO movimientos (usuario_id, tipo, categoria, monto, fecha) VALUES (?, ?, ?, ?, ?)", [user.id, "gasto", categoriasGastos[index] || "Otros", Number(monto), fecha]);
            }
        } catch (error) {
            throw error;
        }
        return sendJson(response, 200, { correcto: true });
    }

    if (request.method === "POST" && pathname === "/api/metas") {
        const user = await requireUser(request, response);
        if (!user) return;
        const body = await readJson(request);
        const objetivo = Number(body.montoObjetivo);
        if (!String(body.nombre || "").trim() || !Number.isFinite(objetivo) || objetivo <= 0) {
            return sendJson(response, 400, { error: "La meta no es válida." });
        }
        const result = await database.run(`
            INSERT INTO metas_ahorro (usuario_id, nombre, monto_objetivo, fecha_objetivo)
            VALUES (?, ?, ?, ?)
            RETURNING id
        `, [user.id, String(body.nombre).trim(), objetivo, body.fechaObjetivo || null]);
        return sendJson(response, 201, { id: result.recordset[0].id });
    }

    if (request.method === "GET" && pathname === "/api/movimientos") {
        const user = await requireUser(request, response);
        if (!user) return;
        const movimientos = await database.all("SELECT id, tipo, categoria, monto, fecha FROM movimientos WHERE usuario_id = ? ORDER BY fecha DESC, id DESC", [user.id]);
        return sendJson(response, 200, { movimientos });
    }

    if (request.method === "GET" && pathname === "/api/metas") {
        const user = await requireUser(request, response);
        if (!user) return;
        const metas = await database.all("SELECT id, nombre, monto_objetivo, monto_actual, fecha_objetivo FROM metas_ahorro WHERE usuario_id = ? ORDER BY id DESC", [user.id]);
        return sendJson(response, 200, { metas });
    }

    if (request.method === "GET" && pathname === "/api/tarjetas-control") {
        const user = await requireUser(request, response);
        if (!user) return;
        const tarjetas = await database.all(`
            SELECT id, alias, entidad, limite, dia_corte, dia_pago
            FROM tarjetas_control WHERE usuario_id = ? ORDER BY dia_pago, id
        `, [user.id]);
        return sendJson(response, 200, { tarjetas });
    }

    if (request.method === "POST" && pathname === "/api/tarjetas-control") {
        const user = await requireUser(request, response);
        if (!user) return;
        const body = await readJson(request);
        const alias = String(body.alias || "").trim();
        const entidad = String(body.entidad || "").trim() || null;
        const limite = Number(body.limite);
        const diaCorte = Number(body.diaCorte);
        const diaPago = Number(body.diaPago);
        if (!alias || alias.length > 80 || !Number.isFinite(limite) || limite < 0 ||
            !Number.isInteger(diaCorte) || diaCorte < 1 || diaCorte > 31 ||
            !Number.isInteger(diaPago) || diaPago < 1 || diaPago > 31) {
            return sendJson(response, 400, { error: "Los datos de la tarjeta de control no son válidos." });
        }
        const result = await database.run(`
            INSERT INTO tarjetas_control (usuario_id, alias, entidad, limite, dia_corte, dia_pago)
            VALUES (?, ?, ?, ?, ?, ?) RETURNING id
        `, [user.id, alias, entidad, limite, diaCorte, diaPago]);
        return sendJson(response, 201, { id: result.recordset[0].id });
    }

    if (request.method === "DELETE" && pathname.startsWith("/api/tarjetas-control/")) {
        const user = await requireUser(request, response);
        if (!user) return;
        const id = Number(pathname.split("/").pop());
        if (!Number.isInteger(id) || id < 1) return sendJson(response, 400, { error: "Tarjeta no válida." });
        await database.run("DELETE FROM tarjetas_control WHERE id = ? AND usuario_id = ?", [id, user.id]);
        return sendJson(response, 200, { correcto: true });
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
    const usuarioDemo = await database.get("SELECT id FROM usuarios WHERE LOWER(usuario) = LOWER(?)", ["admin"]);
    if (usuarioDemo) return;
    await database.run(`
        INSERT INTO usuarios (nombre, usuario, correo, telefono, nacionalidad, password_hash)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING id
    `, ["Administrador", "admin", "admin@asvif.local", "00000000", "Nicaragua", await hashPassword("asvif123")]);
}

database.init()
    .then(() => ensureDefaultUser())
    .then(() => server.listen(PORT, () => console.log(`ASVIF disponible en http://localhost:${PORT}`)))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
