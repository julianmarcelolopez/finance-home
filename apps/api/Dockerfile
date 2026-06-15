# ---- Base: copia package.json de todos los workspaces ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# ---- Deps: instala todas las dependencias (compartido entre dev y builder) ----
FROM base AS deps
RUN npm install

# ---- Dev: código fuente montado como volumen, hot reload con tsx ----
FROM deps AS dev
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["npx", "tsx", "watch", "src/index.ts"]

# ---- Builder: compila shared (tipos → JS vacío) y luego la API ----
FROM deps AS builder
COPY packages/shared/ ./packages/shared/
COPY apps/api/src/ ./apps/api/src/
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
RUN npx tsc -p packages/shared/tsconfig.json
RUN npm run build --workspace=apps/api

# ---- Production: imagen liviana, solo deps de producción ----
FROM node:20-alpine AS production
WORKDIR /app
# Solo copiamos package.json de la API (no del web) para que el workspace
# glob apps/* solo encuentre apps/api y npm no instale deps del frontend
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN npm install --omit=dev
# Código compilado desde el builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
ENV NODE_ENV=production
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/index.js"]
