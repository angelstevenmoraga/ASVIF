# ASVIF

ASVIF (Asistente Virtual Financiero) es una aplicación web frontend para organizar ingresos y gastos, proyectar ahorros y calcular el punto de equilibrio.

## Estructura

```text
ASVIF/
├── index.html              # Página principal
├── pages/                  # Páginas funcionales
│   ├── login.html
│   ├── ingresos-gastos.html
│   ├── ahorro.html
│   └── punto-equilibrio.html
└── assets/
    ├── css/                # Estilos por página y estilos compartidos
    ├── js/                 # Autenticación e interacciones
    └── img/                # Logotipos e imágenes
```

## Ejecutar localmente

Abre `index.html` en un navegador o utiliza una extensión de servidor local, como Live Server, para probar la navegación completa.

La autenticación actual es una demostración frontend y almacena sus datos en el navegador. No debe usarse para información financiera real hasta conectarla a un backend seguro.

## Publicar en GitHub Pages

1. En el repositorio, abre **Settings > Pages**.
2. Selecciona la rama `main` y la carpeta `/ (root)`.
3. Guarda la configuración.
4. GitHub generará una URL pública para `index.html`.
