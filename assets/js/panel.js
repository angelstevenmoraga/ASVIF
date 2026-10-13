document.addEventListener("DOMContentLoaded", async () => {
    const bienvenida = document.querySelector("[data-bienvenida]");
    const elementos = {
        ingresos: document.querySelector("[data-resumen-ingresos]"),
        gastos: document.querySelector("[data-resumen-gastos]"),
        saldo: document.querySelector("[data-resumen-saldo]"),
        movimientos: document.querySelector("[data-resumen-movimientos]"),
        metas: document.querySelector("[data-resumen-metas]")
    };
    const formatoMoneda = new Intl.NumberFormat("es-NI", {
        style: "currency",
        currency: "NIO",
        minimumFractionDigits: 2
    });

    try {
        const [perfil, resumen] = await Promise.all([
            solicitarApi("/api/auth/me"),
            solicitarApi("/api/dashboard/summary")
        ]);
        if (bienvenida) bienvenida.textContent = `Hola, ${perfil.usuario.nombre}. Revisa tu panorama financiero.`;
        elementos.ingresos.textContent = formatoMoneda.format(resumen.ingresos);
        elementos.gastos.textContent = formatoMoneda.format(resumen.gastos);
        elementos.saldo.textContent = formatoMoneda.format(resumen.saldo);
        elementos.movimientos.textContent = `${resumen.movimientos} movimiento${resumen.movimientos === 1 ? "" : "s"}`;
        elementos.metas.textContent = resumen.metas.cantidad ? `${resumen.metas.cantidad} meta${resumen.metas.cantidad === 1 ? "" : "s"}` : "Sin metas todavía";
    } catch (error) {
        if (bienvenida) bienvenida.textContent = "Tu información aparecerá aquí cuando registres tus primeros datos.";
        Object.values(elementos).forEach((elemento) => {
            if (elemento) elemento.textContent = "Sin datos";
        });
    }
});
