# Guía de Despliegue — Sweet Medical

## Arquitectura

```
Usuario → Railway (Frontend Next.js) → Railway (Backend Express) → MongoDB Atlas
```

Ambos servicios están desplegados en Railway como dos servicios separados dentro del mismo proyecto.

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
| `BACKEND_URL` | URL pública del servicio backend en Railway |

---

## Primer despliegue

### 1. MongoDB Atlas
1. Crear cuenta en [mongodb.com/atlas](https://www.mongodb.com/atlas) y crear un cluster M0 (gratuito).
2. **Database Access** → crear usuario con contraseña.
3. **Network Access** → agregar `0.0.0.0/0`.
4. Copiar la connection string (`mongodb+srv://...`).

### 2. Railway — Backend
1. Crear cuenta en [railway.app](https://railway.app) y crear un nuevo proyecto.
2. **New Service → GitHub repo** → seleccionar el repositorio.
3. **Settings → Build** → comando de inicio: `node backend/server.js`.
4. **Variables** → agregar `MONGODB_URI`, `JWT_SECRET` y `ADMIN_PASSWORD`.
5. **Settings → Networking** → generar dominio público y copiarlo.
6. Verificar: `GET https://<url-backend>/healthcheck` → `{ "status": "ok" }`.

### 3. Railway — Frontend
1. En el mismo proyecto: **New Service → GitHub repo** (mismo repositorio).
2. **Settings → Build** → comando de inicio: `npm run start:front`.
3. **Variables** → agregar `BACKEND_URL = https://<url-backend>`.
4. Generar dominio público y verificar abriendo el browser.

---

## Nueva release

Railway redespliega automáticamente con cada push a la rama `Entrega-3-v2`.

```bash
git checkout -b feature/mi-cambio
# ... commits ...
git push origin feature/mi-cambio

git checkout Entrega-3-v2
git merge feature/mi-cambio
git push origin Entrega-3-v2
# Railway detecta el push y redespliega ambos servicios.
```

**Rollback:** Railway → Deployments → seleccionar deploy anterior → Redeploy.

---

## Tests antes de deploy

```bash
npm test                  # unitarios
npm run test:integration  # integración (controladores + MongoDB en memoria)
npm run test:e2e          # E2E con Cypress (requiere frontend en localhost:3001)
```
