# Guía de Despliegue — Sweet Medical

## Arquitectura en producción

```
Usuario
  │
  ▼
Netlify (Frontend — Next.js)
  │  NEXT_PUBLIC_API_URL
  ▼
Railway (Backend — Node.js / Express)
  │  MONGODB_URI
  ▼
MongoDB Atlas (Base de datos)
```

---

## Variables de entorno

### Backend (Railway)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `MONGODB_URI` | Conexión a MongoDB Atlas | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Clave para firmar tokens JWT (obligatorio en prod) | `una-clave-larga-y-aleatoria` |
| `ADMIN_PASSWORD` | Contraseña del administrador | `admin-seguro-2024` |
| `PORT` | Railway lo setea automáticamente | `3000` |

### Frontend (Netlify)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL pública del backend en Railway | `https://sweet-medical.up.railway.app` |

---

## Primer despliegue

### Paso 1 — MongoDB Atlas (base de datos)

> Si ya tenés la URI de Atlas configurada en `.env`, este paso ya está hecho.

1. Ir a [mongodb.com/atlas](https://www.mongodb.com/atlas) y crear una cuenta gratuita.
2. Crear un **Cluster** (la opción M0 Free es suficiente).
3. En **Database Access** → crear un usuario con contraseña.
4. En **Network Access** → agregar `0.0.0.0/0` para permitir acceso desde Railway/Netlify.
5. Copiar la **Connection String** (formato `mongodb+srv://...`).

---

### Paso 2 — Railway (Backend)

1. Ir a [railway.app](https://railway.app) y crear una cuenta (puede usarse con GitHub).

2. Crear un nuevo proyecto: **New Project → Deploy from GitHub repo**.

3. Seleccionar el repositorio `2026-1c-backend-mn-grupo-02-v2`.

4. Railway detecta el `Dockerfile` automáticamente. Verificar que el comando de inicio sea:
   ```
   node backend/server.js
   ```

5. En la pestaña **Variables**, agregar las variables de entorno del backend:
   ```
   MONGODB_URI   = <tu connection string de Atlas>
   JWT_SECRET    = <clave secreta larga y aleatoria>
   ADMIN_PASSWORD = <contraseña del admin>
   ```

6. Hacer clic en **Deploy**. Railway construye la imagen Docker y despliega.

7. Una vez desplegado, ir a **Settings → Networking → Public domain** y copiar la URL pública. Tiene el formato:
   ```
   https://sweet-medical-production.up.railway.app
   ```
   Guardar esta URL — la necesitamos para el paso 3.

8. Verificar que el backend está funcionando:
   ```
   GET https://<tu-url>.up.railway.app/healthcheck
   → { "status": "ok" }
   ```

---

### Paso 3 — Netlify (Frontend)

1. Ir a [netlify.com](https://www.netlify.com) y crear una cuenta (puede usarse con GitHub).

2. Hacer clic en **Add new site → Import an existing project → GitHub**.

3. Seleccionar el repositorio `2026-1c-backend-mn-grupo-02-v2`.

4. Configurar los ajustes de build:
   | Campo | Valor |
   |---|---|
   | Build command | `npm install && npm run build` |
   | Publish directory | `frontend/.next` |

5. En **Environment variables**, agregar:
   ```
   NEXT_PUBLIC_API_URL = https://<tu-url>.up.railway.app
   ```
   (usar la URL del paso 2, paso 7)

6. Hacer clic en **Deploy site**.

7. Una vez finalizado, Netlify asigna una URL del tipo:
   ```
   https://sweet-medical.netlify.app
   ```

8. Verificar abriendo la URL en el navegador y haciendo login.

---

## Nueva release (actualizaciones en producción)

El flujo de deploy automático está configurado via GitHub. Cualquier push a la rama principal dispara un redeploy tanto en Railway como en Netlify.

### Flujo estándar

```bash
# 1. Mergear los cambios a la rama main
git checkout main
git merge feature/mi-feature
git push origin main

# Railway y Netlify detectan el push y redesplegan automáticamente.
# No es necesario ningún paso manual.
```

### Verificación post-deploy

Después de cada release, verificar:

1. **Backend funcionando:**
   ```
   GET https://<railway-url>/healthcheck
   → { "status": "ok" }
   ```

2. **Frontend cargando:**  
   Abrir la URL de Netlify en el navegador y hacer login.

3. **Integración funcionando:**  
   Realizar una búsqueda de turno en el frontend y verificar que responde.

### Rollback (en caso de error)

**Railway:** En el dashboard → pestaña **Deployments** → seleccionar el deploy anterior → **Redeploy**.

**Netlify:** En el dashboard → pestaña **Deploys** → seleccionar el deploy anterior → **Publish deploy**.

---

## Correr los tests antes de hacer deploy

```bash
# Tests unitarios (servicios y dominio)
npm test

# Tests de integración (controladores HTTP + MongoDB en memoria)
npm run test:integration

# Tests E2E (flujos de usuario en el browser — requiere el frontend corriendo)
npm run dev          # en una terminal
npm run test:e2e     # en otra terminal
```

Los tests de integración y unitarios no requieren ningún servicio externo.  
Los tests E2E requieren tener el frontend corriendo en `http://localhost:3001`.

---

## Resolución de problemas comunes

### El backend en Railway no arranca
- Verificar que `MONGODB_URI` esté correctamente seteado en las variables de Railway.
- Revisar los logs en Railway: **Deployments → Ver logs**.

### El frontend muestra "Error al conectar con el servidor"
- Verificar que `NEXT_PUBLIC_API_URL` apunte a la URL correcta de Railway (sin `/` al final).
- Verificar que la variable de entorno esté seteada en Netlify (no solo en `.env` local).
- Confirmar que el backend esté corriendo con el healthcheck.

### Netlify falla el build con error de Next.js
- En el dashboard de Netlify → **Site settings → Build & deploy → Environment** → agregar:
  ```
  NODE_VERSION = 22
  ```
- Verificar que el plugin `@netlify/plugin-nextjs` está listado en `netlify.toml`.
