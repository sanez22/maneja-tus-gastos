# 📁 Pega aquí el contenido del README → Parte 1.1

# Etapa 1: Build (instala TODO, incl. dependencias de desarrollo)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Etapa 2: Producción (solo dependencias de producción → imagen liviana)
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/src ./src
EXPOSE 3000
CMD ["node", "src/app.js"]