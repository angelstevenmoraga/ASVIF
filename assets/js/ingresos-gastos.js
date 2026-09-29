const ingresosInputs = document.querySelectorAll('.ingreso');
const gastosInputs = document.querySelectorAll('.gasto');
const totalIngresoEl = document.getElementById('totalIngreso');
const totalGastoEl = document.getElementById('totalGasto');
const residuoEl = document.getElementById('residuo');

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

    totalIngresoEl.textContent = totalIngreso.toLocaleString('es-NI', { minimumFractionDigits: 2 });
    totalGastoEl.textContent = totalGasto.toLocaleString('es-NI', { minimumFractionDigits: 2 });
    residuoEl.textContent = residuo.toLocaleString('es-NI', { minimumFractionDigits: 2 });

    grafico.data.datasets[0].data = [residuo > 0 ? residuo : 0, totalGasto];
    grafico.update();
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
});
