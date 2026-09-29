document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-volver]").forEach((enlace) => {
        enlace.addEventListener("click", (evento) => {
            if (window.history.length > 1) {
                evento.preventDefault();
                document.body.classList.add("saliendo");
                window.setTimeout(() => window.history.back(), 180);
            }
        });
    });

    const elementos = document.querySelectorAll(".bloque-revelar");

    if (!("IntersectionObserver" in window)) {
        elementos.forEach((elemento) => elemento.classList.add("visible"));
        return;
    }

    const observador = new IntersectionObserver((entradas, observer) => {
        entradas.forEach((entrada) => {
            if (!entrada.isIntersecting) return;
            entrada.target.classList.add("visible");
            observer.unobserve(entrada.target);
        });
    }, { threshold: 0.1 });

    elementos.forEach((elemento) => observador.observe(elemento));
});
