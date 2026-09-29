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

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("formularioAhorro").addEventListener("submit", generarTabla);
    const datos = obtenerDatosUsuario("ahorro", null);
    if (datos) {
        document.getElementById("ahorro").value = datos.ahorroMensual;
        document.getElementById("interes").value = datos.interesMensual * 100;
        document.getElementById("tiempo").value = datos.meses;
        generarTabla();
    }
});
