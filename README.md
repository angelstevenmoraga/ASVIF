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
├── db.js                   # Conexión y esquema PostgreSQL
├── server.js               # API y servidor local
└── package.json            # Dependencias del servidor
```

## Ejecutar localmente

Requiere Node.js 22 o superior y una base de datos PostgreSQL accesible, como Neon. Antes de iniciar, configura la cadena de conexión:

```bash
export DATABASE_URL='postgresql://usuario:contraseña@host/base_de_datos?sslmode=require'
```

Al iniciar, la aplicación crea las tablas necesarias en PostgreSQL, incluido el catálogo `paises`, y agrega el usuario demo si no existe. No guardes `DATABASE_URL` en el repositorio.

Después de iniciar sesión, las cuentas nuevas deben completar profesión, moneda y salario mensual. Esa moneda se usa como referencia en el panel y el equivalente en USD se consulta mediante el servicio público de tipos de cambio de ExchangeRate-API.

La recuperación de contraseña requiere configurar un proveedor de correo mediante SMTP o Resend. Sin esa configuración, la aplicación no envía enlaces y devuelve un error explícito.

Ejecuta:

```bash
npm start
```

Después abre `http://localhost:3000`. Este servidor es necesario para usar registro, inicio de sesión, perfil, historial, metas y persistencia en Neon. Live Server puede seguir usándose para revisar estilos estáticos, pero no reemplaza la API.

### Conversor de monedas

El conversor está integrado en [pages/conversor-moneda.html](pages/conversor-moneda.html) y funciona directamente con el servidor Node de ASVIF. Las tasas de referencia están declaradas en [assets/js/conversor-moneda.js](assets/js/conversor-moneda.js) para poder actualizarlas o reemplazarlas posteriormente por una API de tasas de cambio.

La aplicación usa PostgreSQL, sesiones mediante cookies `HttpOnly` y contraseñas derivadas con `scrypt`. Para producción todavía sería necesario configurar HTTPS, gestión de secretos y protección contra abuso.

## Publicar en GitHub Pages

1. En el repositorio, abre **Settings > Pages**.
2. Selecciona la rama `main` y la carpeta `/ (root)`.
3. Guarda la configuración.
4. GitHub generará una URL pública para `index.html`.
