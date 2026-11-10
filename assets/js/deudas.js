document.addEventListener("DOMContentLoaded", async () => {
    if (!haySesion()) { window.location.href = "login.html"; return; }
    const lista = document.getElementById("lista-deudas");
    const formulario = document.getElementById("form-deuda");
    const mensaje = document.getElementById("mensaje-deuda");
    const fechaSiguiente = (fecha, frecuencia, hoy) => {
        const siguiente = new Date(`${fecha}T00:00:00`);
        const diasPeriodo = frecuencia === "semanal" ? 7 : frecuencia === "quincenal" ? 15 : 30;
        while (siguiente < hoy) siguiente.setDate(siguiente.getDate() + diasPeriodo);
        return siguiente;
    };
    const renderizar = (deudas) => {
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        lista.innerHTML = deudas.length ? "" : "<p>Aún no tienes deudas registradas.</p>";
        deudas.forEach((deuda) => {
            const fecha = fechaSiguiente(deuda.fecha_inicio, deuda.frecuencia, hoy);
            const dias = Math.ceil((fecha - hoy) / 86400000);
            const alerta = dias === 0
                ? "Cuota vence hoy: registra el abono"
                : dias <= Number(deuda.dias_recordatorio)
                    ? `Recordatorio: abona en ${dias} día${dias === 1 ? "" : "s"}`
                    : `Próxima cuota en ${dias} día${dias === 1 ? "" : "s"}`;
            const tarjeta = document.createElement("article");
            tarjeta.className = "deuda-card";
            tarjeta.innerHTML = `<h3>${escapar(deuda.nombre)}</h3><div class="deuda-meta"><span>Saldo: ${Number(deuda.saldo_pendiente).toFixed(2)}</span><span>Cuota: ${Number(deuda.cuota).toFixed(2)}</span><span>${deuda.frecuencia}</span></div><div class="deuda-alerta">${alerta}</div><form class="abono-form" data-id="${deuda.id}"><label>Registrar abono<input name="monto" type="number" min="0.01" max="${deuda.saldo_pendiente}" step="0.01" required></label><button type="submit">Abonar</button></form>`;
            tarjeta.querySelector("form").addEventListener("submit", async (evento) => {
                evento.preventDefault();
                try { await solicitarApi(`/api/deudas/${deuda.id}/abonos`, { method: "POST", body: JSON.stringify({ monto: evento.target.monto.value }) }); await cargar(); } catch (error) { mensaje.textContent = error.message; }
            });
            lista.append(tarjeta);
        });
    };
    const escapar = (valor) => { const span = document.createElement("span"); span.textContent = valor; return span.innerHTML; };
    const cargar = async () => { const datos = await solicitarApi("/api/deudas"); renderizar(datos.deudas); };
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault(); mensaje.textContent = "";
        try { await solicitarApi("/api/deudas", { method: "POST", body: JSON.stringify({ nombre: document.getElementById("deuda-nombre").value, saldoInicial: document.getElementById("deuda-saldo").value, cuota: document.getElementById("deuda-cuota").value, fechaInicio: document.getElementById("deuda-fecha").value, frecuencia: document.getElementById("deuda-frecuencia").value, diasRecordatorio: document.getElementById("deuda-recordatorio").value }) }); formulario.reset(); mensaje.textContent = "Deuda guardada."; await cargar(); } catch (error) { mensaje.textContent = error.message; }
    });
    try { await cargar(); } catch (error) { lista.textContent = error.message; }
});
