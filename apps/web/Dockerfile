FROM node:20-alpine AS dev

WORKDIR /app

# Copiar package.json de todos los workspaces
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/

RUN npm install

# El código fuente se monta como volumen en dev
WORKDIR /app/apps/web

EXPOSE 5173

CMD ["npx", "vite", "--host", "0.0.0.0"]
