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
│   ├── punto-equilibrio.html
│   └── conversor-moneda.html
└── assets/
    ├── css/                # Estilos por página y estilos compartidos
    ├── js/                 # Autenticación e interacciones
    └── img/                # Logotipos e imágenes
├── db.js                   # Conexión y esquema SQL Server
├── server.js               # API y servidor local
└── package.json            # Dependencias del servidor
```

## Ejecutar localmente

Requiere Node.js 22 o superior y una base de datos SQL Server accesible. Antes de iniciar, configura las variables de conexión:

```bash
export DB_SERVER=localhost
export DB_PORT=1433
export DB_USER=sa
export DB_PASSWORD='tu-contraseña'
export DB_NAME=ASVIF
export DB_TRUST_SERVER_CERTIFICATE=true
```

La base de datos `ASVIF` debe existir en SQL Server. Al iniciar, la aplicación crea las tablas necesarias, incluido el catálogo `paises`, y agrega el usuario demo si no existe.

Ejecuta:

```bash
npm start
```

Después abre `http://localhost:3000`. Este servidor es necesario para usar registro, inicio de sesión, perfil, historial, metas y persistencia SQL Server. Live Server puede seguir usándose para revisar estilos estáticos, pero no reemplaza la API.

### Conversor de monedas

El conversor está integrado en [pages/conversor-moneda.html](pages/conversor-moneda.html) y funciona directamente con el servidor Node de ASVIF. Las tasas de referencia están declaradas en [assets/js/conversor-moneda.js](assets/js/conversor-moneda.js) para poder actualizarlas o reemplazarlas posteriormente por una API de tasas de cambio.

La aplicación usa SQL Server, sesiones mediante cookies `HttpOnly` y contraseñas derivadas con `scrypt`. Para producción todavía sería necesario configurar HTTPS, gestión de secretos y protección contra abuso.

## Publicar en GitHub Pages

1. En el repositorio, abre **Settings > Pages**.
2. Selecciona la rama `main` y la carpeta `/ (root)`.
3. Guarda la configuración.
4. GitHub generará una URL pública para `index.html`.
