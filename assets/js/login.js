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
    const campoEstado = document.getElementById("campo-estado");
    const selectorEstado = document.getElementById("reg-estado");
    const regionAyuda = document.getElementById("reg-region");
    const selectorPrefijo = document.getElementById("reg-prefijo");
    const selectorPrefijoBoton = document.getElementById("reg-prefijo-boton");
    const selectorPrefijoSeleccion = document.getElementById("reg-prefijo-seleccion");
    const selectorPrefijoOpciones = document.getElementById("reg-prefijo-opciones");
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
        const estadosMexico = {
            "Aguascalientes": ["Centro", 1], "Baja California": ["Noroeste", 2], "Baja California Sur": ["Noroeste", 3],
            "Campeche": ["Sureste", 4], "Chiapas": ["Sureste", 7], "Chihuahua": ["Noroeste", 8],
            "Ciudad de México": ["Centro", 9], "Coahuila": ["Noreste", 5], "Colima": ["Occidente", 6],
            "Durango": ["Noroeste", 10], "Guanajuato": ["Centro", 11], "Guerrero": ["Centro", 12],
            "Hidalgo": ["Centro", 13], "Jalisco": ["Occidente", 14], "México": ["Centro", 15],
            "Michoacán": ["Occidente", 16], "Morelos": ["Centro", 17], "Nayarit": ["Occidente", 18],
            "Nuevo León": ["Noreste", 19], "Oaxaca": ["Sureste", 20], "Puebla": ["Centro", 21],
            "Querétaro": ["Centro", 22], "Quintana Roo": ["Sureste", 23], "San Luis Potosí": ["Noreste", 24],
            "Sinaloa": ["Noroeste", 25], "Sonora": ["Noroeste", 26], "Tabasco": ["Sureste", 27],
            "Tamaulipas": ["Noreste", 28], "Tlaxcala": ["Centro", 29], "Veracruz": ["Sureste", 30],
            "Yucatán": ["Sureste", 31], "Zacatecas": ["Noroeste", 32]
        };
        Object.keys(estadosMexico).forEach((estado) => selectorEstado.add(new Option(estado, estado)));
        const prefijos = {
            Argentina: ["54", "argentina"], Bolivia: ["591", "bolivia"], Brasil: ["55", "brasil"],
            Canadá: ["1", "canada"], Chile: ["56", "chile"], Colombia: ["57", "colombia"],
            "Costa Rica": ["506", "costa-rica"], Cuba: ["53", "cuba"], Ecuador: ["593", "ecuador"],
            "El Salvador": ["503", "el-salvador"], "Estados Unidos": ["1", "estados-unidos"],
            Guatemala: ["502", "guatemala"], Honduras: ["504", "honduras"], México: ["52", "mexico"],
            Nicaragua: ["505", "nicaragua"], Panamá: ["507", "panama"], Paraguay: ["595", "paraguay"],
            Perú: ["51", "peru"], "Puerto Rico": ["1", "puerto-rico"],
            "República Dominicana": ["1", "republica-dominicana"], Uruguay: ["598", "uruguay"],
            Venezuela: ["58", "venezuela"], Belice: ["501", "belice"], Jamaica: ["1", "jamaica"]
        };
        datos.paises.forEach((pais) => {
            selectorPais.add(new Option(pais.nombre, pais.nombre));
            const prefijo = prefijos[pais.nombre];
            if (!prefijo) return;
            const [codigo, archivo] = prefijo;
            const opcion = document.createElement("button");
            opcion.type = "button";
            opcion.className = "prefijo-opcion";
            opcion.setAttribute("role", "option");
            opcion.dataset.valor = `+${codigo}`;
            opcion.dataset.archivo = archivo;
            opcion.dataset.etiqueta = `${pais.nombre} (+${codigo})`;
            opcion.innerHTML = `<img class="prefijo-bandera" src="../assets/img/countries/${archivo}.png" alt=""> <span>${pais.nombre} (+${codigo})</span>`;
            opcion.addEventListener("click", () => seleccionarPrefijo(opcion));
            selectorPrefijoOpciones.append(opcion);
        });
        selectorPais.addEventListener("change", () => {
            const prefijo = prefijos[selectorPais.value];
            const esMexico = selectorPais.value === "México";
            campoEstado.hidden = !esMexico;
            selectorEstado.required = esMexico;
            if (!esMexico) {
                selectorEstado.value = "";
                regionAyuda.textContent = "";
            }
            if (prefijo) {
                const opcion = [...selectorPrefijoOpciones.children].find((item) => item.dataset.archivo === prefijo[1]);
                if (opcion) seleccionarPrefijo(opcion);
            }
        });
        selectorEstado.addEventListener("change", () => {
            const region = estadosMexico[selectorEstado.value];
            regionAyuda.textContent = region ? `Código estatal ${String(region[1]).padStart(2, "0")} · Región ${region[0]}` : "";
        });
        function seleccionarPrefijo(opcion) {
            selectorPrefijo.value = opcion.dataset.valor;
            selectorPrefijoSeleccion.innerHTML = `<img class="prefijo-bandera" src="../assets/img/countries/${opcion.dataset.archivo}.png" alt=""> <span>${opcion.dataset.etiqueta}</span>`;
            [...selectorPrefijoOpciones.children].forEach((item) => item.setAttribute("aria-selected", String(item === opcion)));
            selectorPrefijoOpciones.classList.remove("abierto");
            selectorPrefijoBoton.setAttribute("aria-expanded", "false");
        }
        selectorPrefijoBoton.addEventListener("click", () => {
            const abierto = selectorPrefijoOpciones.classList.toggle("abierto");
            selectorPrefijoBoton.setAttribute("aria-expanded", String(abierto));
        });
        document.addEventListener("click", (evento) => {
            if (!document.getElementById("selector-prefijo").contains(evento.target)) {
                selectorPrefijoOpciones.classList.remove("abierto");
                selectorPrefijoBoton.setAttribute("aria-expanded", "false");
            }
        });
    } catch (error) {
        selectorPais.disabled = true;
        selectorPrefijoBoton.disabled = true;
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
    });

    // Cambiar a Crear Cuenta
    tabRegistro.addEventListener("click", () => {
        tabRegistro.classList.add("activo");
        tabLogin.classList.remove("activo");
        formRegistro.classList.add("activo");
        formLogin.classList.remove("activo");
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
        const correo = document.getElementById("reg-correo").value;
        const numeroTelefono = document.getElementById("reg-telefono").value.trim();
        const prefijo = selectorPrefijo.value;
        const telefono = `${prefijo} ${numeroTelefono}`;
        const nacionalidad = document.getElementById("reg-nacionalidad").value;
        const estado = document.getElementById("reg-estado").value;
        const password = document.getElementById("reg-password").value;
        const confirmPassword = document.getElementById("reg-confirm-password").value;

        const campos = [...formRegistro.querySelectorAll("input, select")];
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

        const resultado = await registrarUsuario(nombre, correo, telefono, nacionalidad, estado, password);
        if (!resultado.correcto) {
            mostrarAvisoRegistro("No se pudo crear la cuenta", resultado.mensaje || "Comprueba los datos e inténtalo de nuevo.");
            return;
        }

        mostrarAvisoRegistro("Registro exitoso", `Tu cuenta fue creada. Tu usuario es ${resultado.usuario}.`, true);
        formRegistro.reset();
        modalAviso.querySelector(".modal-aviso-accion").addEventListener("click", () => tabLogin.click(), { once: true });
    });
});