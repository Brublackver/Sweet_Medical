# Guía de Despliegue — Sweet Medical

## Arquitectura

```
Usuario → Render (Frontend Next.js) → Render (Backend Express) → MongoDB Atlas
```

Dos servicios separados en **Render**, ambos construidos con el `Dockerfile` de la
raíz del repo y desplegados desde la rama `main`.

| Servicio | URL | Comando de inicio |
|---|---|---|
| Frontend | `https://sweet-medical-front.onrender.com` | `npm run start:front` |
| Backend  | `https://sweet-medical-vjwx.onrender.com`  | `node backend/server.js` (CMD del Dockerfile) |

> El backend quedó con el sufijo `-vjwx` porque Render lo agrega cuando el nombre
> pedido ya está tomado. **No es la URL que uno esperaría** — copiala del
> dashboard, no la deduzcas.

---

## Variables de entorno

### Backend
| Variable | Descripción |
|---|---|
| `MONGODB_URI` | Connection string de MongoDB Atlas |
| `JWT_SECRET` | Clave para firmar tokens JWT |
| `ADMIN_PASSWORD` | Contraseña del administrador |

### Frontend
| Variable | Descripción |
|---|---|
| `BACKEND_URL` | URL pública del backend, **sin barra final** |

---

## ⚠️ `BACKEND_URL` se resuelve en tiempo de BUILD

Esto ya rompió producción una vez, así que leelo antes de tocar nada.

Next evalúa `rewrites()` durante `next build` y escribe el destino como **texto
fijo** en `.next/routes-manifest.json`. No se lee en cada request.

Consecuencias:

1. **Cambiar la variable en el dashboard y reiniciar NO alcanza.** Hay que
   reconstruir: *Manual Deploy → Clear build cache & deploy*.
2. **En un build de Docker, las variables del dashboard no entran solas.** Tienen
   que declararse como `ARG` en el `Dockerfile` (ya está hecho para `BACKEND_URL`).
3. Si no llega ningún build arg, el valor sale de **`frontend/.env.production`**,
   que está versionado. Ese archivo es hoy la fuente efectiva de la URL: si
   cambia el hosting del backend, **hay que actualizarlo y commitearlo**.

Si `BACKEND_URL` falta en un build de producción, el build **falla a propósito**
(`frontend/next.config.mjs`). Antes caía en silencio a `http://localhost:3000`,
que dentro del contenedor no es el backend sino la nada: desplegaba verde y no
funcionaba nada.

---

## Primer despliegue

### 1. MongoDB Atlas
1. Crear cuenta en [mongodb.com/atlas](https://www.mongodb.com/atlas) y un cluster M0 (gratuito).
2. **Database Access** → crear usuario con contraseña.
3. **Network Access** → agregar `0.0.0.0/0`.
4. Copiar la connection string (`mongodb+srv://...`).

### 2. Render — Backend
1. **New → Web Service** → conectar el repo `ddsw-mn/2026-1c-backend-mn-grupo-02`.
2. **Runtime**: Docker. **Branch**: `main`.
3. **Environment** → `MONGODB_URI`, `JWT_SECRET`, `ADMIN_PASSWORD`.
4. Desplegar y **copiar la URL pública real** del dashboard.
5. Verificar: `GET <url-backend>/healthcheck` → **exactamente** `{"status":"ok"}`.

> Si devuelve cualquier otra cosa, estás mirando un deploy viejo o el servicio
> equivocado. Ese string es el termómetro.

### 3. Render — Frontend
1. **New → Web Service** → mismo repo, **Runtime**: Docker, **Branch**: `main`.
2. **Start Command**: `npm run start:front`.
3. **Environment** → `BACKEND_URL = <url-backend>` (sin barra final).
4. Actualizar `frontend/.env.production` con la misma URL y commitear.
5. Desplegar.

### 4. Verificación de punta a punta
```bash
curl https://<url-frontend>/backend/healthcheck    # → {"status":"ok"}
curl -X POST https://<url-frontend>/backend/auth/demo   # → 201 + sesión
```

Chequeá **el proxy**, no solo el backend directo. La falla típica está justo en
ese salto: el backend anda perfecto y el frontend no llega hasta él.

---

## Diagnóstico rápido

Cuando algo falla, lo primero es identificar **quién** devolvió el error:

| Respuesta | Quién la generó | Significa |
|---|---|---|
| `{"status":"error","code":404,...,"request_id":...}` | Infraestructura de **Railway** | El proxy apunta a una app de Railway que no existe |
| `{"message":"Página no encontrada"}` | **Tu Express** | La request llegó a la app, pero esa ruta no existe |
| `{"status":"ok"}` | Tu `healthCheck.js` | Backend sano y en la versión actual |

La API **no tiene ruta raíz**: abrir la URL del backend pelada devuelve
`Cannot GET /`. Eso es normal, no es un deploy roto. Usá `/healthcheck`.

---

## Datos iniciales (obligatorio en un entorno nuevo)

Los catálogos de **sedes** y **obras sociales** se siembran solos en cada arranque
del backend. El **plantel médico y su agenda**, no: sin eso la búsqueda no
devuelve nada y la app parece rota.

Con `MONGODB_URI` apuntando a la base del entorno nuevo:

```bash
npm run seed:disponibilidades            # plantel + 7 meses de agenda
MESES=12 npm run seed:disponibilidades   # horizonte a medida
```

Crea los médicos que falten (contraseña inicial = su usuario), les completa
especialidades, prácticas y sedes, y les carga agenda de lunes a sábado según el
patrón semanal de cada uno.

Es **idempotente**: se puede correr las veces que haga falta. No duplica médicos
(los busca por `usuario`), no pisa servicios existentes y saltea las fechas que ya
tienen agenda cargada.

> **Reejecutar cada tantos meses.** La agenda es un horizonte móvil desde el día
> que se corre el seed. Cuando se acerque el final del horizonte, volver a correrlo
> para extenderlo — solo agrega las fechas nuevas.

---

## Nueva release

Render redespliega automáticamente con cada push a `main`.

```bash
git checkout -b feature/mi-cambio
# ... commits ...
git push origin feature/mi-cambio

git checkout main
git merge feature/mi-cambio
git push origin main
# Render detecta el push y redespliega ambos servicios.
```

**Rollback:** Render → el servicio → Deploys → elegir un deploy anterior → Redeploy.

---

## Acceso de administrador

El rol Admin no aparece en el selector del login. Se revela entrando a
`/login?admin=1` (o `?rol=admin`) y pide solo contraseña — la de `ADMIN_PASSWORD`.

Esconder el botón es **presentación, no seguridad**: `POST /auth/login` sigue
aceptando `rol: "admin"`. Lo que protege el panel es `requireAdmin` en
`backend/middleware/authMiddleware.js`.

> **Pendiente:** `backend/routes/authRoutes.js` cae a `"123456"` si falta
> `ADMIN_PASSWORD`. Asegurate de que la variable esté cargada en Render.

---

## Tests antes de deploy

```bash
npm test                  # unitarios
npm run test:integration  # integración (controladores + MongoDB en memoria)
npm run test:e2e          # E2E con Cypress (requiere frontend en localhost:3001)
```
