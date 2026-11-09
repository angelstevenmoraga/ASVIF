document.addEventListener("DOMContentLoaded", async () => {
    if (typeof haySesion === "function" && haySesion()) {
        window.location.replace("panel.html");
        return;
    }

    const tabLogin = document.getElementById("tab-login");
    const tabRegistro = document.getElementById("tab-registro");
    const formLogin = document.getElementById("form-login");
    const formRegistro = document.getElementById("form-registro");
    const botonDemo = document.getElementById("btn-demo");
    const selectorPais = document.getElementById("reg-nacionalidad");
    const seccionRecuperacion = document.getElementById("recuperacion-seccion");
    const botonRecuperacion = document.getElementById("btn-recuperacion");
    const formRecuperacion = document.getElementById("form-recuperacion");
    const metodoRecuperacion = document.getElementById("recuperacion-metodo");
    const contactoRecuperacion = document.getElementById("recuperacion-contacto");
    const etiquetaContacto = document.getElementById("recuperacion-contacto-label");
    const modalError = document.getElementById("modal-error-acceso");
    const modalAviso = document.getElementById("modal-aviso-registro");
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
    const cerrarModalAviso = () => {
        modalAviso.hidden = true;
        document.body.classList.remove("modal-error-abierto");
    };
    const mostrarAvisoRegistro = (titulo, mensaje, exitoso = false, etiqueta = "AVISO DE REGISTRO") => {
        modalAviso.querySelector(".modal-aviso-etiqueta").textContent = etiqueta;
        modalAviso.querySelector("#titulo-aviso-registro").textContent = titulo;
        modalAviso.querySelector("#mensaje-aviso-registro").textContent = mensaje;
        modalAviso.classList.toggle("etapa-exitosa", exitoso);
        modalAviso.querySelector(".modal-aviso-icono i").className = exitoso
            ? "fa-solid fa-circle-check"
            : "fa-solid fa-circle-exclamation";
        modalAviso.hidden = false;
        document.body.classList.add("modal-error-abierto");
        modalAviso.querySelector(".modal-aviso-accion").focus();
    };

    try {
        const datos = await solicitarApi("/api/paises");
        datos.paises.forEach((pais) => selectorPais.add(new Option(pais.nombre, pais.nombre)));
    } catch (error) {
        selectorPais.disabled = true;
        selectorPais.options[0].textContent = "No se pudo cargar la lista";
    }

    modalError.querySelector(".modal-error-cerrar").addEventListener("click", cerrarModalError);
    modalError.querySelector(".modal-error-accion").addEventListener("click", () => {
        cerrarModalError();
        document.getElementById("login-usuario").focus();
    });
    modalError.addEventListener("click", (evento) => {
        if (evento.target === modalError) cerrarModalError();
    });
    modalAviso.querySelector(".modal-aviso-cerrar").addEventListener("click", cerrarModalAviso);
    modalAviso.querySelector(".modal-aviso-accion").addEventListener("click", cerrarModalAviso);
    modalAviso.addEventListener("click", (evento) => {
        if (evento.target === modalAviso) cerrarModalAviso();
    });
    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape" && !modalError.hidden) cerrarModalError();
        if (evento.key === "Escape" && !modalAviso.hidden) cerrarModalAviso();
    });

    // Cambiar a Iniciar Sesión
    tabLogin.addEventListener("click", () => {
        tabLogin.classList.add("activo");
        tabRegistro.classList.remove("activo");
        formLogin.classList.add("activo");
        formRegistro.classList.remove("activo");
        seccionRecuperacion.hidden = false;
    });

    // Cambiar a Crear Cuenta
    tabRegistro.addEventListener("click", () => {
        tabRegistro.classList.add("activo");
        tabLogin.classList.remove("activo");
        formRegistro.classList.add("activo");
        formLogin.classList.remove("activo");
        seccionRecuperacion.hidden = true;
    });

    botonRecuperacion.addEventListener("click", () => {
        const abierto = botonRecuperacion.getAttribute("aria-expanded") === "true";
        botonRecuperacion.setAttribute("aria-expanded", String(!abierto));
        formRecuperacion.hidden = abierto;
        if (!abierto) metodoRecuperacion.focus();
    });

    metodoRecuperacion.addEventListener("change", () => {
        const usaTelefono = metodoRecuperacion.value === "telefono";
        etiquetaContacto.innerHTML = usaTelefono
            ? '<i class="fa-solid fa-phone"></i> Número de teléfono'
            : '<i class="fa-solid fa-envelope"></i> Correo electrónico';
        contactoRecuperacion.type = usaTelefono ? "tel" : "email";
        contactoRecuperacion.placeholder = usaTelefono ? "+505 8888 8888" : "correo@ejemplo.com";
        contactoRecuperacion.autocomplete = usaTelefono ? "tel" : "email";
        contactoRecuperacion.pattern = usaTelefono ? "[+]?[0-9][0-9\\s().-]{6,19}" : "";
        contactoRecuperacion.value = "";
        contactoRecuperacion.focus();
    });

    formRecuperacion.addEventListener("submit", (evento) => {
        evento.preventDefault();
        const campoInvalido = [metodoRecuperacion, contactoRecuperacion].find((campo) => !campo.checkValidity());
        if (campoInvalido) {
            campoInvalido.reportValidity();
            mostrarAvisoRegistro("Revisa tus datos", campoInvalido.validationMessage, false, "AVISO DE RECUPERACIÓN");
            campoInvalido.focus();
            return;
        }

        mostrarAvisoRegistro("Recuperación preparada", "El método seleccionado quedó configurado. La solicitud se podrá enviar cuando se conecte el servicio de recuperación.", true, "CONFIGURACIÓN COMPLETA");
        formRecuperacion.reset();
        metodoRecuperacion.dispatchEvent(new Event("change"));
        botonRecuperacion.click();
    });

    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        const usuario = document.getElementById("login-usuario").value;
        const password = document.getElementById("login-password").value;

        if (!(await iniciarSesion(usuario, password))) {
            mostrarErrorAcceso();
            return;
        }

        mostrarAvisoRegistro("Inicio de sesión correcto", "Has iniciado sesión correctamente. Ya puedes entrar a tu panel.", true, "ACCESO CONFIRMADO");
        modalAviso.querySelector(".modal-aviso-accion").addEventListener("click", () => {
            window.location.href = "panel.html";
        }, { once: true });
    });

    botonDemo.addEventListener("click", () => {
        iniciarSesionDemo();
        mostrarAvisoRegistro("Inicio de sesión correcto", "La sesión demo está activa. Ya puedes entrar a tu panel.", true, "ACCESO DEMO CONFIRMADO");
        modalAviso.querySelector(".modal-aviso-accion").addEventListener("click", () => {
            window.location.href = "panel.html";
        }, { once: true });
    });

    // Captura del envío del Registro
    formRegistro.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nombre = document.getElementById("reg-nombre").value;
        const usuario = document.getElementById("reg-usuario").value;
        const correo = document.getElementById("reg-correo").value;
        const telefono = document.getElementById("reg-telefono").value;
        const nacionalidad = document.getElementById("reg-nacionalidad").value;
        const password = document.getElementById("reg-password").value;
        const confirmPassword = document.getElementById("reg-confirm-password").value;

        const campos = [...formRegistro.querySelectorAll("input")];
        const campoInvalido = campos.find((campo) => !campo.checkValidity());
        if (campoInvalido) {
            campoInvalido.reportValidity();
            mostrarAvisoRegistro("Revisa tus datos", campoInvalido.validationMessage);
            campoInvalido.focus();
            return;
        }

        if (password !== confirmPassword) {
            mostrarAvisoRegistro("Las contraseñas no coinciden", "Escribe la misma contraseña en ambos campos.");
            document.getElementById("reg-confirm-password").focus();
            return;
        }
        if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
            mostrarAvisoRegistro("Contraseña no válida", "La contraseña debe incluir al menos una letra y un número.");
            document.getElementById("reg-password").focus();
            return;
        }

        const resultado = await registrarUsuario(nombre, usuario, correo, telefono, nacionalidad, password);
        if (!resultado.correcto) {
            mostrarAvisoRegistro("No se pudo crear la cuenta", resultado.mensaje || "Comprueba los datos e inténtalo de nuevo.");
            return;
        }

        mostrarAvisoRegistro("Registro exitoso", "Tu cuenta fue creada. Ya puedes iniciar sesión.", true);
        formRegistro.reset();
        modalAviso.querySelector(".modal-aviso-accion").addEventListener("click", () => tabLogin.click(), { once: true });
    });
});