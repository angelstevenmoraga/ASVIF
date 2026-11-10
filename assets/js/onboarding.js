document.addEventListener("DOMContentLoaded", async () => {
    if (!haySesion()) {
        window.location.href = "login.html";
        return;
    }

    const formulario = document.getElementById("form-onboarding");
    const mensaje = document.getElementById("mensaje-onboarding");
    try {
        const datos = await solicitarApi("/api/auth/me");
        if (datos.usuario.usuario === "admin" || datos.usuario.perfilCompleto) {
            window.location.href = "panel.html";
            return;
        }
    } catch (error) {
        mensaje.textContent = error.message;
        return;
    }

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        mensaje.textContent = "Consultando tipo de cambio...";
        try {
            const datos = await solicitarApi("/api/auth/onboarding", {
                method: "PUT",
                body: JSON.stringify({
                    profesion: document.getElementById("profesion").value,
                    salario: document.getElementById("salario").value,
                    moneda: document.getElementById("moneda").value
                })
            });
            const sesion = obtenerSesion();
            sesion.perfilCompleto = true;
            sessionStorage.setItem(ASVIF_AUTH_KEY, JSON.stringify(sesion));
            mensaje.textContent = `Guardado: ${Number(datos.salarioLocal).toFixed(2)} ${datos.moneda} ≈ $${Number(datos.salarioUsd).toFixed(2)} USD.`;
            window.setTimeout(() => { window.location.href = "panel.html"; }, 700);
        } catch (error) {
            mensaje.textContent = error.message;
        }
    });
});
