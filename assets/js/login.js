document.addEventListener("DOMContentLoaded", () => {
    if (typeof haySesion === "function" && haySesion()) {
        window.location.replace("panel.html");
        return;
    }

    const tabLogin = document.getElementById("tab-login");
    const tabRegistro = document.getElementById("tab-registro");
    const formLogin = document.getElementById("form-login");
    const formRegistro = document.getElementById("form-registro");
    const modalError = document.getElementById("modal-error-acceso");
    const modalErrorContenido = modalError.querySelector(".modal-error-contenido");
    const cerrarModalError = () => {
        modalError.hidden = true;
        document.body.classList.remove("modal-error-abierto");
    };
    const mostrarErrorAcceso = () => {
        modalError.hidden = false;
        document.body.classList.add("modal-error-abierto");
        modalErrorContenido.classList.remove("modal-error-sacudir");
        void modalErrorContenido.offsetWidth;
        modalErrorContenido.classList.add("modal-error-sacudir");
        modalError.querySelector(".modal-error-accion").focus();
    };

    modalError.querySelector(".modal-error-cerrar").addEventListener("click", cerrarModalError);
    modalError.querySelector(".modal-error-accion").addEventListener("click", () => {
        cerrarModalError();
        document.getElementById("login-usuario").focus();
    });
    modalError.addEventListener("click", (evento) => {
        if (evento.target === modalError) cerrarModalError();
    });
    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape" && !modalError.hidden) cerrarModalError();
    });

    // Cambiar a Iniciar Sesión
    tabLogin.addEventListener("click", () => {
        tabLogin.classList.add("activo");
        tabRegistro.classList.remove("activo");
        formLogin.classList.add("activo");
        formRegistro.classList.remove("activo");
    });

    // Cambiar a Crear Cuenta
    tabRegistro.addEventListener("click", () => {
        tabRegistro.classList.add("activo");
        tabLogin.classList.remove("activo");
        formRegistro.classList.add("activo");
        formLogin.classList.remove("activo");
    });

    const mostrarMensaje = (formulario, mensaje, esError = true) => {
        let elemento = formulario.querySelector(".mensaje-formulario");
        if (!elemento) {
            elemento = document.createElement("p");
            elemento.className = "mensaje-formulario";
            formulario.appendChild(elemento);
        }
        elemento.textContent = mensaje;
        elemento.setAttribute("role", "alert");
        elemento.style.color = esError ? "#ffb4a8" : "#d7f5a2";
    };

    formLogin.addEventListener("submit", (e) => {
        e.preventDefault();
        const usuario = document.getElementById("login-usuario").value;
        const password = document.getElementById("login-password").value;

        if (!iniciarSesion(usuario, password)) {
            mostrarErrorAcceso();
            return;
        }

        window.location.href = "panel.html";
    });

    // Captura del envío del Registro
    formRegistro.addEventListener("submit", (e) => {
        e.preventDefault();
        const nombre = document.getElementById("reg-nombre").value;
        const usuario = document.getElementById("reg-usuario").value;
        const password = document.getElementById("reg-password").value;
        const confirmPassword = document.getElementById("reg-confirm-password").value;

        if (password !== confirmPassword) {
            mostrarMensaje(formRegistro, "Las contraseñas no coinciden.");
            return;
        }

        if (password.length < 8) {
            mostrarMensaje(formRegistro, "La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        const resultado = registrarUsuario(nombre, usuario, password);
        if (!resultado.correcto) {
            mostrarMensaje(formRegistro, resultado.mensaje);
            return;
        }

        mostrarMensaje(formRegistro, "Cuenta creada. Ahora puedes iniciar sesión.", false);
        tabLogin.click();
        formRegistro.reset();
    });
});