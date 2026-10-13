const ingresosInputs = document.querySelectorAll('.ingreso');
const gastosInputs = document.querySelectorAll('.gasto');
const totalIngresoEl = document.getElementById('totalIngreso');
const totalGastoEl = document.getElementById('totalGasto');
const residuoEl = document.getElementById('residuo');
let sincronizacionPendiente;

// Configuración del gráfico
const ctx = document.getElementById('grafico').getContext('2d');
let grafico = new Chart(ctx, {
    type: 'pie',
    data: {
        labels: ['Ingresos', 'Gastos'],
        datasets: [{
            data: [0, 0],
            backgroundColor: ['#689f38', '#c5e1a5']
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' },
            tooltip: { enabled: true }
        }
    }
});

function actualizar() {
    let totalIngreso = 0;
    let totalGasto = 0;

    ingresosInputs.forEach(input => totalIngreso += parseFloat(input.value) || 0);
    gastosInputs.forEach(input => totalGasto += parseFloat(input.value) || 0);

    let residuo = totalIngreso - totalGasto;

    const datos = {
        ingresos: Array.from(ingresosInputs, (input) => Number(input.value) || 0),
        gastos: Array.from(gastosInputs, (input) => Number(input.value) || 0)
    };
    guardarDatosUsuario("ingresos-gastos", datos);
    clearTimeout(sincronizacionPendiente);
    sincronizacionPendiente = setTimeout(() => {
        if (typeof solicitarApi === "function") {
            solicitarApi("/api/movimientos/snapshot", {
                method: "PUT",
                body: JSON.stringify(datos)
            }).catch(() => null);
        }
    }, 250);

    totalIngresoEl.textContent = totalIngreso.toLocaleString('es-NI', { minimumFractionDigits: 2 });
    totalGastoEl.textContent = totalGasto.toLocaleString('es-NI', { minimumFractionDigits: 2 });
    residuoEl.textContent = residuo.toLocaleString('es-NI', { minimumFractionDigits: 2 });

    grafico.data.datasets[0].data = [residuo > 0 ? residuo : 0, totalGasto];
    grafico.update();
}

async function cargarHistorial() {
    const cuerpo = document.getElementById("historialMovimientos");
    if (!cuerpo || typeof solicitarApi !== "function") return;
    try {
        const datos = await solicitarApi("/api/movimientos");
        cuerpo.innerHTML = datos.movimientos.length ? "" : '<tr><td colspan="4">Aún no hay movimientos guardados.</td></tr>';
        datos.movimientos.forEach((movimiento) => {
            const fila = document.createElement("tr");
            [movimiento.fecha, movimiento.tipo, movimiento.categoria, `C$ ${Number(movimiento.monto).toLocaleString("es-NI", { minimumFractionDigits: 2 })}`].forEach((valor) => {
                const celda = document.createElement("td");
                celda.textContent = valor;
                fila.appendChild(celda);
            });
            cuerpo.appendChild(fila);
        });
        window.movimientosASVIF = datos.movimientos;
    } catch (error) {
        cuerpo.innerHTML = '<tr><td colspan="4">El historial estará disponible al iniciar sesión desde el servidor.</td></tr>';
    }
}

function exportarHistorial() {
    const movimientos = window.movimientosASVIF || [];
    const filas = [["Fecha", "Tipo", "Categoría", "Monto"], ...movimientos.map((movimiento) => [movimiento.fecha, movimiento.tipo, movimiento.categoria, movimiento.monto])];
    const contenido = filas.map((fila) => fila.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(",")).join("\n");
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));
    enlace.download = "historial-asvif.csv";
    enlace.click();
    URL.revokeObjectURL(enlace.href);
}

// Escuchar cambios
ingresosInputs.forEach(input => input.addEventListener('input', actualizar));
gastosInputs.forEach(input => input.addEventListener('input', actualizar));

document.addEventListener("DOMContentLoaded", () => {
    const datos = obtenerDatosUsuario("ingresos-gastos", null);
    if (datos) {
        ingresosInputs.forEach((input, index) => input.value = datos.ingresos[index] || "");
        gastosInputs.forEach((input, index) => input.value = datos.gastos[index] || "");
    }
    actualizar();
    cargarHistorial();
    document.getElementById("exportarHistorial")?.addEventListener("click", exportarHistorial);
});
