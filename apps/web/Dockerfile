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

# ---- Dev: código fuente montado como volumen, hot reload con Vite ----
FROM deps AS dev
WORKDIR /app/apps/web
EXPOSE 5173
CMD ["npx", "vite", "--host", "0.0.0.0"]

# ---- Builder: compila la SPA con Vite ----
FROM deps AS builder
# Variables VITE_* se hornean en el bundle en tiempo de build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV VITE_API_URL=${VITE_API_URL}
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/
RUN npm run build --workspace=apps/web

# ---- Production: nginx sirve los archivos estáticos ----
FROM nginx:alpine AS production
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
# La imagen nginx:alpine >= 1.19 procesa *.template con envsubst antes de iniciar
COPY apps/web/nginx.conf /etc/nginx/templates/default.conf.template
# API_URL se puede sobreescribir como env var en EasyPanel
ENV API_URL=http://api:3000
EXPOSE 80
