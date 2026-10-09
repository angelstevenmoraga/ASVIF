const ASVIF_AUTH_KEY = "asvifSesion";
const ASVIF_USERS_KEY = "asvifUsuarios";
const ASVIF_DEFAULT_USER = {
    usuario: "admin",
    nombre: "Administrador",
    password: "asvif123"
};

function obtenerUsuarios() {
    const guardados = localStorage.getItem(ASVIF_USERS_KEY);

    if (!guardados) {
        localStorage.setItem(ASVIF_USERS_KEY, JSON.stringify([ASVIF_DEFAULT_USER]));
        return [ASVIF_DEFAULT_USER];
    }

    try {
        const usuarios = JSON.parse(guardados);
        return Array.isArray(usuarios) ? usuarios : [ASVIF_DEFAULT_USER];
    } catch (error) {
        localStorage.setItem(ASVIF_USERS_KEY, JSON.stringify([ASVIF_DEFAULT_USER]));
        return [ASVIF_DEFAULT_USER];
    }
}

function guardarUsuarios(usuarios) {
    localStorage.setItem(ASVIF_USERS_KEY, JSON.stringify(usuarios));
}

function obtenerSesion() {
    const sesion = sessionStorage.getItem(ASVIF_AUTH_KEY);
    if (!sesion) return null;

    try {
        return JSON.parse(sesion);
    } catch (error) {
        sessionStorage.removeItem(ASVIF_AUTH_KEY);
        return null;
    }
}

function iniciarSesion(usuario, password) {
    const usuarioNormalizado = usuario.trim().toLowerCase();
    const usuarioEncontrado = obtenerUsuarios().find((item) =>
        typeof item.usuario === "string" &&
        item.usuario.toLowerCase() === usuarioNormalizado &&
        item.password === password
    );

    if (!usuarioEncontrado) {
        return false;
    }

    sessionStorage.setItem(ASVIF_AUTH_KEY, JSON.stringify({
        usuario: usuarioEncontrado.usuario,
        nombre: usuarioEncontrado.nombre
    }));
    return true;
}

function registrarUsuario(nombre, usuario, password) {
    const nombreLimpio = nombre.trim();
    const usuarioLimpio = usuario.trim();
    if (nombreLimpio.length < 2 || usuarioLimpio.length < 3 || password.length < 8) {
        return { correcto: false, mensaje: "Completa los datos con valores válidos." };
    }

    const usuarios = obtenerUsuarios();
    const existe = usuarios.some((item) =>
        typeof item.usuario === "string" &&
        item.usuario.toLowerCase() === usuarioLimpio.toLowerCase()
    );

    if (existe) {
        return { correcto: false, mensaje: "Ese usuario ya existe." };
    }

    usuarios.push({
        nombre: nombreLimpio,
        usuario: usuarioLimpio,
        password
    });
    guardarUsuarios(usuarios);
    return { correcto: true };
}

function cerrarSesion() {
    sessionStorage.removeItem(ASVIF_AUTH_KEY);
    window.location.href = window.location.pathname.includes("/pages/") ? "../index.html" : "index.html";
}

function mostrarConfirmacionCerrarSesion() {
    let modal = document.querySelector("#modal-cerrar-sesion");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modal-cerrar-sesion";
        modal.className = "modal-confirmacion";
        modal.hidden = true;
        modal.innerHTML = `
            <div class="modal-confirmacion-contenido" role="dialog" aria-modal="true" aria-labelledby="titulo-cerrar-sesion">
                <span class="modal-confirmacion-icono"><i class="fa-solid fa-right-from-bracket"></i></span>
                <h2 id="titulo-cerrar-sesion">¿Cerrar sesión?</h2>
                <p>Tu sesión se cerrará en este dispositivo. Podrás volver a ingresar cuando quieras.</p>
                <div class="modal-confirmacion-acciones">
                    <button type="button" class="modal-cancelar">Cancelar</button>
                    <button type="button" class="modal-aceptar">Cerrar sesión</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const cerrarModal = () => {
            modal.hidden = true;
            document.body.classList.remove("modal-abierto");
        };
        modal.querySelector(".modal-cancelar").addEventListener("click", cerrarModal);
        modal.querySelector(".modal-aceptar").addEventListener("click", cerrarSesion);
        modal.addEventListener("click", (evento) => {
            if (evento.target === modal) cerrarModal();
        });
        modal._cerrar = cerrarModal;
    }

    modal.hidden = false;
    document.body.classList.add("modal-abierto");
    modal.querySelector(".modal-cancelar").focus();
}

function haySesion() {
    return Boolean(obtenerSesion());
}

function rutaLogin() {
    return window.location.pathname.includes("/pages/") ? "login.html" : "pages/login.html";
}

function obtenerDatosUsuario(clave, valorInicial) {
    const sesion = obtenerSesion();
    if (!sesion) return valorInicial;

    const guardado = localStorage.getItem(`asvif:${sesion.usuario}:${clave}`);
    if (!guardado) return valorInicial;

    try {
        return JSON.parse(guardado);
    } catch (error) {
        localStorage.removeItem(`asvif:${sesion.usuario}:${clave}`);
        return valorInicial;
    }
}

function guardarDatosUsuario(clave, datos) {
    const sesion = obtenerSesion();
    if (!sesion) return;
    localStorage.setItem(`asvif:${sesion.usuario}:${clave}`, JSON.stringify(datos));
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.protegida === "true" && !haySesion()) {
        window.location.replace(rutaLogin());
    }

    const sesion = obtenerSesion();
    const menuUsuario = document.querySelector(".menu-usuario");
    const acceso = document.querySelector("[data-acceso]");
    const bienvenida = document.querySelector("[data-bienvenida]");

    if (menuUsuario) {
        menuUsuario.hidden = !sesion;
    }

    if (acceso) {
        if (sesion) {
            acceso.textContent = "Cerrar sesión";
            acceso.removeAttribute("href");
            acceso.setAttribute("data-cerrar-sesion", "");
            acceso.setAttribute("role", "button");
            acceso.setAttribute("tabindex", "0");
            acceso.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión';
        } else {
            acceso.setAttribute("href", rutaLogin());
            acceso.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Iniciar sesión';
        }
    }

    if (bienvenida && sesion) {
        bienvenida.textContent = `Hola, ${sesion.nombre}. Organiza tus finanzas con claridad.`;
    }

    document.querySelectorAll("[data-cerrar-sesion]").forEach((boton) => {
        boton.addEventListener("click", mostrarConfirmacionCerrarSesion);
    });

    document.addEventListener("keydown", (evento) => {
        const modal = document.querySelector("#modal-cerrar-sesion");
        if (evento.key === "Escape" && modal && !modal.hidden) modal._cerrar();
    });

    const sidebarBoton = document.querySelector(".sidebar-toggle");
    const sidebar = document.querySelector(".panel-lateral");
    if (sidebarBoton && sidebar) {
        const cambiarSidebar = (abierto) => {
            sidebarBoton.setAttribute("aria-expanded", String(abierto));
            sidebar.setAttribute("aria-hidden", String(!abierto));
            sidebar.classList.toggle("abierto", abierto);
            document.body.classList.toggle("sidebar-abierto", abierto);
        };

        sidebar.setAttribute("aria-hidden", "false");
        sidebarBoton.addEventListener("click", () => {
            cambiarSidebar(!sidebar.classList.contains("abierto"));
        });

        sidebar.querySelectorAll("a").forEach((enlace) => {
            enlace.addEventListener("click", () => cambiarSidebar(false));
        });

        document.addEventListener("keydown", (evento) => {
            if (evento.key === "Escape") cambiarSidebar(false);
        });

        document.addEventListener("click", (evento) => {
            if (sidebar.classList.contains("abierto") &&
                !sidebar.contains(evento.target) &&
                !sidebarBoton.contains(evento.target)) {
                cambiarSidebar(false);
            }
        });
    }

    const paginaActual = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".panel-lateral a[href]").forEach((enlace) => {
        const destino = enlace.getAttribute("href").split("/").pop();
        if (destino === paginaActual) {
            enlace.classList.add("activo");
            enlace.setAttribute("aria-current", "page");
        }
    });

    const menuBoton = document.querySelector(".menu-boton");
    const menu = document.querySelector("#menu-navegacion");
    const menuFondo = document.querySelector(".menu-fondo");
    const menuCerrar = document.querySelector(".menu-cerrar");
    if (menuBoton && menu) {
        const cambiarMenu = (abierto) => {
            menuBoton.setAttribute("aria-expanded", String(abierto));
            menu.setAttribute("aria-hidden", String(!abierto));
            menu.classList.toggle("abierto", abierto);
            menu.hidden = !abierto;
            if (menuFondo) menuFondo.hidden = !abierto;
            document.body.classList.toggle("menu-abierto", abierto);
        };

        menuBoton.addEventListener("click", (evento) => {
            const abierto = menuBoton.getAttribute("aria-expanded") === "true";
            cambiarMenu(!abierto);
        });

        if (menuFondo) menuFondo.addEventListener("click", () => cambiarMenu(false));
        if (menuCerrar) menuCerrar.addEventListener("click", () => cambiarMenu(false));

        document.addEventListener("click", (evento) => {
            if (!menu.contains(evento.target) && !menuBoton.contains(evento.target) &&
                (!menuFondo || !menuFondo.contains(evento.target))) {
                cambiarMenu(false);
            }
        });

        document.addEventListener("keydown", (evento) => {
            if (evento.key === "Escape") {
                cambiarMenu(false);
                menuBoton.focus();
            }
        });

        menu.querySelectorAll("a").forEach((enlace) => {
            enlace.addEventListener("click", () => cambiarMenu(false));
        });
    }
});
