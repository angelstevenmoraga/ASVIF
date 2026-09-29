const formulario = document.getElementById('formularioEquilibrio');
const costoInput = document.getElementById('costoProduccion');
const precioInput = document.getElementById('precioVenta');
const resultado = document.getElementById('resultado');
const costoMostrado = document.getElementById('costoMostrado');
const precioMostrado = document.getElementById('precioMostrado');
const cantidadProductos = document.getElementById('cantidadProductos');
const mensajeResultado = document.getElementById('mensajeResultado');

const formatoMoneda = new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    minimumFractionDigits: 2
});

formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const costoProduccion = Number(costoInput.value);
    const precioVenta = Number(precioInput.value);

    if (!Number.isFinite(costoProduccion) || !Number.isFinite(precioVenta) ||
        costoProduccion < 0 || precioVenta <= 0) {
        mensajeResultado.textContent = 'Ingresa un costo y un precio de venta válidos.';
        resultado.hidden = false;
        return;
    }

    // Punto de equilibrio: costo de producción ÷ precio de venta por producto.
    const productosMinimos = Math.ceil(costoProduccion / precioVenta);

    costoMostrado.textContent = formatoMoneda.format(costoProduccion);
    precioMostrado.textContent = formatoMoneda.format(precioVenta);
    cantidadProductos.textContent = productosMinimos;

    if (productosMinimos === 0) {
        mensajeResultado.textContent = 'No tienes costo de producción por recuperar.';
    } else {
        mensajeResultado.textContent = `Debes vender un mínimo de ${productosMinimos} ${productosMinimos === 1 ? 'producto' : 'productos'} para recuperar el costo de producción. A partir de la venta número ${productosMinimos + 1}, comienzas a obtener ganancias.`;
    }

    resultado.hidden = false;
});
