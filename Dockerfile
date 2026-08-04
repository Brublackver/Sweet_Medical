FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# El rewrite /backend/* del frontend se resuelve en TIEMPO DE BUILD: Next lo
# escribe en .next/routes-manifest.json. Por eso BACKEND_URL tiene que estar
# presente ACÁ y no alcanza con definirla en el entorno de ejecución.
#
# Si no llega como build arg, next build usa frontend/.env.production. Se
# exporta SOLO cuando trae valor: una variable vacía tapa al .env y el rewrite
# terminaría apuntando a localhost dentro del contenedor.
ARG BACKEND_URL
RUN if [ -n "$BACKEND_URL" ]; then export BACKEND_URL="$BACKEND_URL"; fi && npm run build
EXPOSE 3000
CMD ["node", "backend/server.js"]
