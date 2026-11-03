const monedas = {
    NIO: { nombre: "Córdoba nicaragüense", simbolo: "C$", tasa: 36.6243 },
    HNL: { nombre: "Lempira hondureño", simbolo: "L", tasa: 26.4217 },
    GTQ: { nombre: "Quetzal guatemalteco", simbolo: "Q", tasa: 7.6821 },
    CRC: { nombre: "Colón costarricense", simbolo: "₡", tasa: 501.25 },
    PAB: { nombre: "Balboa panameño", simbolo: "B/.", tasa: 1 },
    DOP: { nombre: "Peso dominicano", simbolo: "RD$", tasa: 63.18 },
    MXN: { nombre: "Peso mexicano", simbolo: "MX$", tasa: 18.43 },
    COP: { nombre: "Peso colombiano", simbolo: "COL$", tasa: 4120 },
    PEN: { nombre: "Sol peruano", simbolo: "S/", tasa: 3.48 },
    ARS: { nombre: "Peso argentino", simbolo: "AR$", tasa: 1480 },
    CLP: { nombre: "Peso chileno", simbolo: "CLP$", tasa: 950 },
    BRL: { nombre: "Real brasileño", simbolo: "R$", tasa: 5.35 },
    BOB: { nombre: "Boliviano", simbolo: "Bs", tasa: 6.91 },
    PYG: { nombre: "Guaraní paraguayo", simbolo: "₲", tasa: 7850 },
    UYU: { nombre: "Peso uruguayo", simbolo: "$U", tasa: 40.2 }
};

const formato = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formulario = document.querySelector("#formularioConversor");
const campoDolares = document.querySelector("#dolares");
const campoMoneda = document.querySelector("#moneda");
const mensajeError = document.querySelector("#mensajeError");
const resultado = document.querySelector("#resultadoConversor");

Object.entries(monedas).forEach(([codigo, moneda]) => {
    const opcion = document.createElement("option");
    opcion.value = codigo;
    opcion.textContent = `${codigo} - ${moneda.nombre}`;
    campoMoneda.append(opcion);
});

function actualizarTasa() {
    const moneda = monedas[campoMoneda.value];
    document.querySelector("#tasaReferencia").textContent = `1 USD = ${moneda.tasa.toFixed(4)} ${campoMoneda.value}`;
}

function mostrarError(mensaje) {
    mensajeError.textContent = mensaje;
    mensajeError.hidden = false;
    resultado.hidden = true;
}

campoMoneda.addEventListener("change", actualizarTasa);

formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const dolares = Number(campoDolares.value);
    const moneda = monedas[campoMoneda.value];

    if (!Number.isFinite(dolares) || dolares < 0 || dolares > 1_000_000_000) {
        mostrarError("Ingresa un monto entre 0 y 1,000,000,000 dólares.");
        return;
    }

    mensajeError.hidden = true;
    document.querySelector("#montoResultado").textContent = `$${formato.format(dolares)} USD equivalen a`;
    document.querySelector("#valorResultado").textContent = `${moneda.simbolo} ${formato.format(dolares * moneda.tasa)}`;
    document.querySelector("#nombreResultado").textContent = moneda.nombre;
    resultado.hidden = false;
});

actualizarTasa();
