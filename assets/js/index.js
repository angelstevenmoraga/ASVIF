document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-anio]").forEach((elemento) => {
        elemento.textContent = new Date().getFullYear();
    });

    const elementos = document.querySelectorAll(".bloque-revelar");
    if ("IntersectionObserver" in window) {
        const observador = new IntersectionObserver((entradas, observer) => {
            entradas.forEach((entrada) => {
                if (!entrada.isIntersecting) return;
                entrada.target.classList.add("visible");
                observer.unobserve(entrada.target);
            });
        }, { threshold: 0.12 });
        elementos.forEach((elemento) => observador.observe(elemento));
    } else {
        elementos.forEach((elemento) => elemento.classList.add("visible"));
    }

    document.querySelectorAll("[aria-disabled='true']").forEach((elemento) => {
        elemento.addEventListener("click", () => {
            elemento.classList.remove("aviso-proximamente");
            void elemento.offsetWidth;
            elemento.classList.add("aviso-proximamente");
        });
    });

    const enlaces = document.querySelectorAll(".menu-desplegable a[href]");
    const paginaActual = window.location.pathname.split("/").pop() || "index.html";
    enlaces.forEach((enlace) => {
        if (enlace.getAttribute("href") === paginaActual) {
            enlace.classList.add("enlace-activo");
            enlace.setAttribute("aria-current", "page");
        }
    });

    const menuBoton = document.querySelector(".menu-boton");
    const menuCerrar = document.querySelector(".menu-cerrar");
    const menu = document.querySelector(".menu-desplegable");
    const fondo = document.querySelector(".menu-fondo");
    if (menuBoton && menu && fondo) {
        const cerrarMenu = () => {
            menuBoton.setAttribute("aria-expanded", "false");
            menu.setAttribute("aria-hidden", "true");
            menu.classList.remove("abierto");
            menu.hidden = true;
            fondo.hidden = true;
        };
        if (menuCerrar) menuCerrar.addEventListener("click", cerrarMenu);
        menu.querySelectorAll("a").forEach((enlace) => enlace.addEventListener("click", cerrarMenu));
    }
});
