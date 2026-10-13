function generarTabla(evento) {
    if (evento) evento.preventDefault();

    const ahorroMensual = Number(document.getElementById("ahorro").value);
    const interesMensual = Number(document.getElementById("interes").value) / 100;
    const meses = Number.parseInt(document.getElementById("tiempo").value, 10);

    const tbody = document.querySelector("#tablaAhorro tbody");
    tbody.innerHTML = "";

    if (!Number.isFinite(ahorroMensual) || ahorroMensual < 0 ||
        !Number.isFinite(interesMensual) || interesMensual < 0 ||
        !Number.isInteger(meses) || meses < 1 || meses > 600) {
        tbody.innerHTML = '<tr><td colspan="5">Ingresa valores válidos. El plazo debe estar entre 1 y 600 meses.</td></tr>';
        return;
    }

    guardarDatosUsuario("ahorro", { ahorroMensual, interesMensual, meses });
    let compuesto = 0;

    for (let i = 1; i <= meses; i++) {
        const interesGenerado = compuesto * interesMensual;
        const totalMes = compuesto + interesGenerado + ahorroMensual;
        const fila = document.createElement("tr");
        [i, `C$ ${compuesto.toFixed(2)}`, `C$ ${interesGenerado.toFixed(2)}`,
            `C$ ${ahorroMensual.toFixed(2)}`, `C$ ${totalMes.toFixed(2)}`]
            .forEach((valor) => {
                const celda = document.createElement("td");
                celda.textContent = valor;
                fila.appendChild(celda);
            });
        tbody.appendChild(fila);
        compuesto = totalMes;
    }
}

async function cargarMetas() {
    const lista = document.getElementById("listaMetas");
    if (!lista || typeof solicitarApi !== "function") return;
    try {
        const datos = await solicitarApi("/api/metas");
        lista.innerHTML = datos.metas.length ? "" : "<p>Aún no tienes metas creadas.</p>";
        datos.metas.forEach((meta) => {
            const elemento = document.createElement("article");
            const avance = Math.min(100, (meta.monto_actual / meta.monto_objetivo) * 100);
            elemento.innerHTML = `<strong></strong><span></span><div class="meta-progreso"><i></i></div>`;
            elemento.querySelector("strong").textContent = meta.nombre;
            elemento.querySelector("span").textContent = `C$ ${Number(meta.monto_actual).toLocaleString("es-NI")} de C$ ${Number(meta.monto_objetivo).toLocaleString("es-NI")} · ${avance.toFixed(0)}%`;
            elemento.querySelector("i").style.width = `${avance}%`;
            lista.appendChild(elemento);
        });
    } catch (error) {
        lista.innerHTML = "<p>Inicia sesión desde el servidor para consultar tus metas.</p>";
    }
}

async function guardarMeta(evento) {
    evento.preventDefault();
    const estado = document.getElementById("estadoMeta");
    try {
        await solicitarApi("/api/metas", {
            method: "POST",
            body: JSON.stringify({
                nombre: document.getElementById("metaNombre").value,
                montoObjetivo: document.getElementById("metaObjetivo").value,
                fechaObjetivo: document.getElementById("metaFecha").value
            })
        });
        document.getElementById("formularioMeta").reset();
        estado.textContent = "Meta guardada";
        cargarMetas();
    } catch (error) {
        estado.textContent = error.message;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("formularioAhorro").addEventListener("submit", generarTabla);
    document.getElementById("formularioMeta").addEventListener("submit", guardarMeta);
    cargarMetas();
    const datos = obtenerDatosUsuario("ahorro", null);
    if (datos) {
        document.getElementById("ahorro").value = datos.ahorroMensual;
        document.getElementById("interes").value = datos.interesMensual * 100;
        document.getElementById("tiempo").value = datos.meses;
        generarTabla();
    }
});
