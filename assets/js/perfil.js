document.addEventListener("DOMContentLoaded", async () => {
    const formulario = document.getElementById("formularioPerfil");
    const mensaje = document.getElementById("mensajePerfil");
    const selectorPais = document.getElementById("perfilNacionalidad");
    const formularioTarjeta = document.getElementById("formularioTarjeta");
    const listaTarjetas = document.getElementById("listaTarjetas");
    const mensajeTarjeta = document.getElementById("mensajeTarjeta");
    let graficas = [];
    try {
        const [datos, catalogo] = await Promise.all([solicitarApi("/api/auth/me"), solicitarApi("/api/paises")]);
        const usuario = datos.usuario;
        catalogo.paises.forEach((pais) => selectorPais.add(new Option(pais.nombre, pais.nombre)));
        document.getElementById("perfilNombre").value = usuario.nombre;
        document.getElementById("perfilCorreo").value = usuario.correo;
        document.getElementById("perfilTelefono").value = usuario.telefono;
        selectorPais.value = usuario.nacionalidad;
    } catch (error) {
        mensaje.textContent = "No se pudo cargar el perfil.";
    }

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        try {
            await solicitarApi("/api/auth/profile", {
                method: "PUT",
                body: JSON.stringify({
                    nombre: document.getElementById("perfilNombre").value,
                    telefono: document.getElementById("perfilTelefono").value,
                    nacionalidad: document.getElementById("perfilNacionalidad").value
                })
            });
            mensaje.textContent = "Cambios guardados correctamente.";
            const sesion = obtenerSesion();
            if (sesion) {
                sesion.nombre = document.getElementById("perfilNombre").value.trim();
                sessionStorage.setItem("asvifSesion", JSON.stringify(sesion));
            }
        } catch (error) {
            mensaje.textContent = error.message;
        }
    });

    async function cargarControlFinanciero() {
        const [movimientosData, tarjetasData] = await Promise.all([
            solicitarApi("/api/movimientos"),
            solicitarApi("/api/tarjetas-control")
        ]);
        const movimientos = movimientosData.movimientos;
        const ingresos = movimientos.filter((item) => item.tipo === "ingreso").reduce((total, item) => total + Number(item.monto), 0);
        const gastos = movimientos.filter((item) => item.tipo === "gasto").reduce((total, item) => total + Number(item.monto), 0);
        const dinero = new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" });
        document.getElementById("controlIngresos").textContent = dinero.format(ingresos);
        document.getElementById("controlGastos").textContent = dinero.format(gastos);
        document.getElementById("controlSaldo").textContent = dinero.format(ingresos - gastos);
        const categorias = {};
        movimientos.filter((item) => item.tipo === "gasto").forEach((item) => {
            categorias[item.categoria] = (categorias[item.categoria] || 0) + Number(item.monto);
        });
        if (window.Chart) {
            graficas.forEach((grafica) => grafica.destroy());
            graficas = [new Chart(document.getElementById("graficaBalance"), {
                type: "bar",
                data: { labels: ["Ingresos", "Gastos"], datasets: [{ data: [ingresos, gastos], backgroundColor: ["#2f8f78", "#e9b949"], borderRadius: 8 }] },
                options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            }), new Chart(document.getElementById("graficaCategorias"), {
                type: "doughnut",
                data: { labels: Object.keys(categorias).length ? Object.keys(categorias) : ["Sin gastos"], datasets: [{ data: Object.values(categorias).length ? Object.values(categorias) : [1], backgroundColor: ["#155e55", "#2f8f78", "#e9b949", "#9ac7b5", "#8aa39c", "#d9b56d"] }] },
                options: { plugins: { legend: { position: "bottom" } } }
            })];
        }
        renderizarTarjetas(tarjetasData.tarjetas);
    }

    function renderizarTarjetas(tarjetas) {
        listaTarjetas.innerHTML = tarjetas.length ? "" : '<p class="vacio">Aún no tienes tarjetas de control registradas.</p>';
        tarjetas.forEach((tarjeta) => {
            const elemento = document.createElement("article");
            elemento.className = "tarjeta-control";
            elemento.innerHTML = `<div><span class="tarjeta-chip"><i class="fa-solid fa-credit-card"></i></span><h3>${escapar(tarjeta.alias)}</h3><small>${escapar(tarjeta.entidad || "Referencia personal")}</small></div><p><strong>Corte:</strong> día ${tarjeta.dia_corte}<br><strong>Pago:</strong> día ${tarjeta.dia_pago}<br><strong>Próximo pago:</strong> ${fechaDelMes(tarjeta.dia_pago)}<br><strong>Límite:</strong> ${dinero.format(Number(tarjeta.limite))}</p><button type="button" class="eliminar-tarjeta" data-id="${tarjeta.id}" aria-label="Eliminar ${escapar(tarjeta.alias)}"><i class="fa-solid fa-trash"></i></button>`;
            listaTarjetas.append(elemento);
        });
    }

    function fechaDelMes(dia) {
        const hoy = new Date();
        let mes = hoy.getMonth();
        let anio = hoy.getFullYear();
        const maximo = new Date(anio, mes + 1, 0).getDate();
        if (hoy.getDate() > Math.min(Number(dia), maximo)) mes += 1;
        if (mes > 11) {
            mes = 0;
            anio += 1;
        }
        const fecha = new Date(anio, mes, Math.min(Number(dia), new Date(anio, mes + 1, 0).getDate()));
        return fecha.toLocaleDateString("es-NI", { day: "2-digit", month: "short", year: "numeric" });
    }

    function escapar(valor) {
        const contenedor = document.createElement("span");
        contenedor.textContent = String(valor);
        return contenedor.innerHTML;
    }

    const dinero = new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" });
    formularioTarjeta.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        try {
            await solicitarApi("/api/tarjetas-control", { method: "POST", body: JSON.stringify({
                alias: document.getElementById("tarjetaAlias").value,
                entidad: document.getElementById("tarjetaEntidad").value,
                limite: document.getElementById("tarjetaLimite").value,
                diaCorte: document.getElementById("tarjetaCorte").value,
                diaPago: document.getElementById("tarjetaPago").value
            }) });
            formularioTarjeta.reset();
            mensajeTarjeta.textContent = "Tarjeta de control agregada.";
            await cargarControlFinanciero();
        } catch (error) {
            mensajeTarjeta.textContent = error.message;
        }
    });

    listaTarjetas.addEventListener("click", async (evento) => {
        const boton = evento.target.closest(".eliminar-tarjeta");
        if (!boton) return;
        try {
            await solicitarApi(`/api/tarjetas-control/${boton.dataset.id}`, { method: "DELETE" });
            await cargarControlFinanciero();
        } catch (error) {
            mensajeTarjeta.textContent = error.message;
        }
    });

    try {
        await cargarControlFinanciero();
    } catch (error) {
        mensajeTarjeta.textContent = "No se pudo cargar el control financiero.";
    }
});
