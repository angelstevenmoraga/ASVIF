document.addEventListener("DOMContentLoaded", async () => {
    const formulario = document.getElementById("formularioPerfil");
    const mensaje = document.getElementById("mensajePerfil");
    try {
        const datos = await solicitarApi("/api/auth/me");
        const usuario = datos.usuario;
        document.getElementById("perfilNombre").value = usuario.nombre;
        document.getElementById("perfilCorreo").value = usuario.correo;
        document.getElementById("perfilTelefono").value = usuario.telefono;
        document.getElementById("perfilNacionalidad").value = usuario.nacionalidad;
    } catch (error) {
        mensaje.textContent = "No se pudo cargar el perfil.";
    }

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        try {
            await solicitarApi("/api/auth/profile", {
                method: "PUT",
                body: JSON.stringify({
                    nombre: document.getElementById("perfilNombre").value,
                    telefono: document.getElementById("perfilTelefono").value,
                    nacionalidad: document.getElementById("perfilNacionalidad").value
                })
            });
            mensaje.textContent = "Cambios guardados correctamente.";
            const sesion = obtenerSesion();
            if (sesion) {
                sesion.nombre = document.getElementById("perfilNombre").value.trim();
                sessionStorage.setItem("asvifSesion", JSON.stringify(sesion));
            }
        } catch (error) {
            mensaje.textContent = error.message;
        }
    });
});
