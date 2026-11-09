document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("formularioPresupuesto");
    const formularioEmergencia = document.getElementById("formularioEmergencia");
    const formatoMoneda = new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO", minimumFractionDigits: 2 });
    const leerNumero = (id) => Number(document.getElementById(id).value);
    const mostrarPorcentaje = (id, valor) => { document.getElementById(id).textContent = `${valor.toFixed(0)}%`; };

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();
        if (!formulario.checkValidity()) { formulario.reportValidity(); return; }
        const ingreso = leerNumero("ingresoMensual");
        const necesarios = leerNumero("gastosNecesarios");
        const personales = leerNumero("gastosPersonales");
        const ahorro = leerNumero("ahorroMensual");
        const total = necesarios + personales + ahorro;
        const mensaje = document.getElementById("mensajePresupuesto");
        if (![ingreso, necesarios, personales, ahorro].every(Number.isFinite) || total > ingreso) {
            mensaje.textContent = "La distribución no puede superar tu ingreso mensual.";
            mensaje.hidden = false;
            return;
        }
        mensaje.hidden = true;
        const porcentajes = [necesarios / ingreso * 100, personales / ingreso * 100, ahorro / ingreso * 100];
        ["barraNecesarios", "barraPersonales", "barraAhorro"].forEach((id, index) => { document.getElementById(id).style.width = `${porcentajes[index]}%`; });
        mostrarPorcentaje("porcentajeNecesarios", porcentajes[0]);
        mostrarPorcentaje("porcentajePersonales", porcentajes[1]);
        mostrarPorcentaje("porcentajeAhorro", porcentajes[2]);
        document.getElementById("resultadoIngreso").textContent = formatoMoneda.format(ingreso);
        document.getElementById("consejoPresupuesto").textContent = porcentajes[2] >= 20
            ? "Vas bien: tu ahorro o pago de deudas alcanza la referencia del 20%."
            : "Considera reservar al menos el 20% cuando sea posible, empezando con una cantidad sostenible.";
        document.getElementById("resultadoPresupuesto").hidden = false;
        guardarDatosUsuario("presupuesto", { ingreso, necesarios, personales, ahorro });
    });

    formularioEmergencia.addEventListener("submit", (evento) => {
        evento.preventDefault();
        if (!formularioEmergencia.checkValidity()) { formularioEmergencia.reportValidity(); return; }
        const gastos = leerNumero("gastosEmergencia");
        const meses = leerNumero("mesesEmergencia");
        document.getElementById("resultadoEmergencia").textContent = `Tu fondo de referencia para ${meses} meses es de ${formatoMoneda.format(gastos * meses)}.`;
    });

    const datos = obtenerDatosUsuario("presupuesto", null);
    if (datos) {
        document.getElementById("ingresoMensual").value = datos.ingreso;
        document.getElementById("gastosNecesarios").value = datos.necesarios;
        document.getElementById("gastosPersonales").value = datos.personales;
        document.getElementById("ahorroMensual").value = datos.ahorro;
        formulario.dispatchEvent(new Event("submit"));
    }
});