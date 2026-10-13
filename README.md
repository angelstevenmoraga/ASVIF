# ASVIF

ASVIF (Asistente Virtual Financiero) es una aplicación web para organizar ingresos y gastos, proyectar ahorros, calcular el punto de equilibrio y dar seguimiento a metas financieras.

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
├── db.js                   # Esquema SQLite
├── server.js               # API y servidor local
└── data/asvif.sqlite       # Base local generada automáticamente
```

## Ejecutar localmente

Requiere Node.js 22 o superior. Ejecuta:

```bash
npm start
```

Después abre `http://localhost:3000`. Este servidor es necesario para usar registro, inicio de sesión, perfil, historial, metas y persistencia SQLite. Live Server puede seguir usándose para revisar estilos estáticos, pero no reemplaza la API.

La aplicación usa SQLite local, sesiones mediante cookies `HttpOnly` y contraseñas derivadas con `scrypt`. Para producción todavía sería necesario configurar HTTPS, gestión de secretos, protección contra abuso y una base de datos administrada.

## Publicar en GitHub Pages

1. En el repositorio, abre **Settings > Pages**.
2. Selecciona la rama `main` y la carpeta `/ (root)`.
3. Guarda la configuración.
4. GitHub generará una URL pública para `index.html`.
