FROM node:20-alpine AS dev

WORKDIR /app

# Copiar package.json de todos los workspaces para instalar dependencias
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm install

# El código fuente se monta como volumen en dev
WORKDIR /app/apps/api

EXPOSE 3000

CMD ["npx", "tsx", "watch", "src/index.ts"]
