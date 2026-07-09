# 🛠️ Ejemplos Prácticos y Casos de Uso

Ejercicios hands-on.

---

## 📌 Ejemplo 1: Modificar Dockerfile del Backend

### Escenario
Necesitas agregar soporte para TypeScript compilado en el backend.

### Cambios

**Archivos a modificar:**
- `backend/Dockerfile`
- `docker-compose.yml` (opcionalmente)

**Nuevo Dockerfile:**

```dockerfile
# ======== ETAPA 1: BUILD ========
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY src ./src

# Compilar TypeScript → JavaScript
RUN npm run build

# ======== ETAPA 2: PRODUCCIÓN ========
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Solo necesitamos el código compilado
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar archivo compilado desde builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/app.js"]
```

### Explicación
- Etapa 1: Compila TypeScript → obtiene carpeta `dist/`
- Etapa 2: Copia solo `dist/`, no `src/` ni `node_modules` del builder
- Resultado: Imagen más pequeña y segura

### package.json necesario

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/app.js"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0"
  }
}
```

---

## 📌 Ejemplo 2: Agregar un Servicio Redis

### Escenario
Necesitas cache para optimizar consultas a BD.

### Cambios en `docker-compose.yml`

```yaml
services:
  # ... postgres, backend, frontend existentes ...

  # ======== NUEVO SERVICIO REDIS ========
  redis:
    image: redis:7-alpine
    container_name: gastos_cache
    ports:
      - '6379:6379'
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data:  # ← AGREGAR AQUÍ
```

### Cambios en Backend

```javascript
// src/config/redis.js
import redis from 'redis';

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'redis',  // 'redis' es el nombre del servicio en Docker
  port: process.env.REDIS_PORT || 6379,
});

client.connect();
export default client;
```

### docker-compose.yml - Actualizar Backend

```yaml
backend:
  # ... config existente ...
  environment:
    # ... vars existentes ...
    REDIS_HOST: redis
    REDIS_PORT: 6379
  depends_on:
    postgres:
      condition: service_healthy
    redis:  # ← AGREGAR
      condition: service_healthy  # ← AGREGAR
```

### Flujo Completo

```
Usuario solicita GET /api/gastos
    ↓
Backend verifica Redis cache
    ↓ (cache miss)
Consulta PostgreSQL
    ↓
Guarda en Redis (TTL 5 min)
    ↓
Retorna usuario
    
Siguiente usuario solicita GET /gastos
    ↓
Backend verifica Redis
    ↓ (cache hit!)
Retorna desde memoria (1ms vs 100ms en BD)
```

---

## 📌 Ejemplo 3: Workflow de GitHub Actions Personalizado

### Escenario
Necesitas notificaciones en Slack cuando el deploy falla.

### Workflow Nuevo: `notify-slack.yml`

```yaml
name: 📢 Deploy Notifications

on:
  workflow_run:
    workflows:
      - 'Deploy Backend → Render.com'
      - 'Deploy Frontend → Firebase Hosting'
    types:
      - completed

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Slack Notification - Success
        if: ${{ github.event.workflow_run.conclusion == 'success' }}
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": "✅ Deploy exitoso!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "✅ *Deploy Exitoso*\n*Rama:* ${{ github.ref }}\n*Commit:* ${{ github.sha }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK

      - name: Slack Notification - Failure
        if: ${{ github.event.workflow_run.conclusion == 'failure' }}
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": "❌ Deploy falló!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "❌ *Deploy Fallido*\n*Rama:* ${{ github.ref }}\n*Commit:* ${{ github.sha }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK
```

### Configuración Slack

1. Ve a https://api.slack.com/apps
2. Crea nueva app → Bot
3. Activa Incoming Webhooks
4. Copia URL webhook
5. En GitHub repo → Settings → Secrets → `SLACK_WEBHOOK_URL`

---

## 📌 Ejemplo 4: Docker Compose para Testing

### Escenario
Ejecutar tests con servicios reales (BD, cache).

```yaml
# docker-compose.test.yml
version: '3.9'

services:
  test-postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_pass
      POSTGRES_DB: test_db
    ports:
      - '5433:5432'  # Puerto diferente para no conflictuar
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U test_user']
      interval: 5s
      timeout: 3s
      retries: 3

  test-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.test
    environment:
      NODE_ENV: test
      DB_HOST: test-postgres
      DB_PORT: 5432
      DB_USER: test_user
      DB_PASS: test_pass
      DB_NAME: test_db
    depends_on:
      test-postgres:
        condition: service_healthy
    command: npm test
```

### Ejecutar Tests

```bash
# Con servicios reales
docker-compose -f docker-compose.test.yml up

# Con volumen para ver cobertura
docker-compose -f docker-compose.test.yml up -v coverage:/app/coverage
```

---

## 📌 Ejemplo 5: Definir Limites de Recursos

### Escenario
Evitar que contenedores usen todos los recursos de la máquina.

```yaml
services:
  postgres:
    image: postgres:16-alpine
    # ... resto config ...
    deploy:
      resources:
        limits:
          cpus: '1'          # Max 1 CPU
          memory: 512M       # Max 512MB RAM
        reservations:
          cpus: '0.5'        # Resuelto 0.5 CPU
          memory: 256M       # Reservado 256MB

  backend:
    # ... resto config ...
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '1'
          memory: 512M

  frontend:
    # ... resto config ...
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 256M
```

### Monitorear Recursos

```bash
# Ver consumo en tiempo real
docker stats

# Ver historia
docker system df
```

---

## 📌 Ejemplo 6: Logging Centralizado

### Escenario
Agregar logging a todos los contenedores de forma centralizada.

```yaml
services:
  postgres:
    # ... config ...
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=database"

  backend:
    # ... config ...
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=backend"
      environment:
        LOG_LEVEL: debug

  frontend:
    # ... config ...
    logging:
      driver: "json-file"
      options:
        max-size: "5m"
        max-file: "3"
        labels: "service=frontend"
```

### Ver Logs

```bash
# Logs con etiquetas
docker-compose logs --follow backend

# Logs con timestamps
docker-compose logs --timestamps backend

# Última hora de logs
docker-compose logs --since 1h backend
```

---

## 📌 Ejemplo 7: Variables de Entorno por Ambiente

### Escenario
Diferentes configuraciones para dev, staging, production.

```bash
# Archivos
.env.development
.env.staging
.env.production
```

**`.env.development`**
```
NODE_ENV=development
DB_HOST=postgres
DB_PORT=5432
LOG_LEVEL=debug
API_TIMEOUT=30000
```

**`.env.production`**
```
NODE_ENV=production
DB_HOST=prod-db.internal
DB_PORT=5432
LOG_LEVEL=error
API_TIMEOUT=10000
```

### docker-compose.yml

```yaml
backend:
  # ... config ...
  env_file:
    - .env.${NODE_ENV}  # ← Carga según NODE_ENV
  environment:
    NODE_ENV: ${NODE_ENV}
```

### Ejecutar

```bash
# Desarrollo
NODE_ENV=development docker-compose up

# Producción
NODE_ENV=production docker-compose up
```

---

## 📌 Ejemplo 8: Dockerfile con Scripts Iniciales

### Escenario
Ejecutar migraciones de BD automáticamente al iniciar.

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts
COPY entrypoint.sh ./

# Hacer script ejecutable
RUN chmod +x entrypoint.sh

EXPOSE 3000

# Ejecutar script en lugar de node directo
CMD ["./entrypoint.sh"]
```

### `backend/entrypoint.sh`

```bash
#!/bin/sh
set -e

echo "🔧 Ejecutando migraciones de BD..."
npm run migrate

echo "🚀 Iniciando servidor..."
node src/app.js
```

### `backend/package.json`

```json
{
  "scripts": {
    "migrate": "node scripts/migrate.js",
    "seed": "node scripts/seed.js"
  }
}
```

---

## 📌 Ejemplo 9: Health Checks Personalizados

### Backend con Health Endpoint

**`src/routes/health.js`**
```javascript
export const healthRouter = Router();

healthRouter.get('/health', async (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    database: 'UP',
    redis: 'UP'
  };

  // Verificar BD
  try {
    await db.query('SELECT 1');
  } catch (err) {
    health.database = 'DOWN';
    return res.status(503).json(health);
  }

  // Verificar Redis
  try {
    await redis.ping();
  } catch (err) {
    health.redis = 'DOWN';
    return res.status(503).json(health);
  }

  res.json(health);
});
```

### docker-compose.yml Health Check

```yaml
backend:
  # ... config ...
  healthcheck:
    test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
    interval: 10s
    timeout: 5s
    retries: 3
    start_period: 30s  # Espera 30s antes de empezar a checkear
```

---

## 📌 Ejemplo 10: Docker Build Optimization

### Problema
Build toma 5 minutos cada commit.

### Dockerfile Ineficiente

```dockerfile
# ❌ LENTO: Copia TODO antes de instalar
FROM node:20-alpine
COPY . .                    # ← Invalida caché con CUALQUIER cambio
RUN npm ci                  # ← Se re-ejecuta SIEMPRE
COPY src ./src
CMD ["node", "src/app.js"]
```

### Dockerfile Optimizado

```dockerfile
# ✅ RÁPIDO: Orden inteligente de capas
FROM node:20-alpine

# Capa 1: NO CAMBIA (reutiliza caché)
COPY package*.json ./
RUN npm ci

# Capa 2: CAMBIA (invalida solo aquí)
COPY . .

CMD ["node", "src/app.js"]
```

### .dockerignore (CRÍTICO)

```
node_modules
npm-debug.log
dist
.git
.gitignore
README.md
.env.local
.DS_Store
coverage
jest.config.js
```

### Impacto

```
❌ Sin optimización: 300MB, 5min build
✅ Con optimización: 250MB, 30seg prim build, 5seg rebuild
```

---

## 📌 Ejemplo 11: GitHub Actions Matrix

### Escenario
Testear app en múltiples versiones de Node.

```yaml
name: Test Multi-Node

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version:
          - 18.x
          - 20.x
          - 22.x

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
```

**Resultado:**
- 3 jobs paralelos
- Cada uno testa con versión diferente
- Garantiza compatibilidad

---

## 📌 Ejemplo 12: Docker Network Avanzado

### Escenario
Múltiples aplicaciones necesitan comunicarse.

```yaml
# docker-compose.yml
version: '3.9'

networks:
  # Red privada personalizada
  gastos_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16

services:
  postgres:
    networks:
      - gastos_network
    # Accesible como "postgres:5432" desde otros contenedores

  backend:
    networks:
      - gastos_network
    # Accesible como "backend:3000"

  cache:
    networks:
      - gastos_network
    # Accesible como "cache:6379"
```

### Ventajas
- Aislamiento de red (más seguro)
- DNS automático entre contenedores
- Easier debugging

---

## 🎯 Checklist de Implementación

Para cada modificación:

- [ ] ¿Entiendo qué problema resuelve?
- [ ] ¿He probado localmente con `docker-compose up`?
- [ ] ¿Funciona el hot-reload?
- [ ] ¿Chequeo los logs busca errores?
- [ ] ¿Reinicio limpio: `docker-compose down -v`?
- [ ] ¿El tamaño de imagen es razonable?
- [ ] ¿Documento cambios en README?
- [ ] ¿Push a repo con commit message claro?
- [ ] ¿GitHub Actions pasa?

---

## 📚 Referencias de los Ejemplos

| Ejemplo | Concepto Clave | Dificultad |
|---------|---|---|
| 1 | Multi-stage builds con TypeScript | ⭐⭐ |
| 2 | Agregar servicios (Redis) | ⭐⭐ |
| 3 | GitHub Actions avanzado (Slack) | ⭐⭐⭐ |
| 4 | Testing con servicios | ⭐⭐ |
| 5 | Resource limits | ⭐ |
| 6 | Logging centralizado | ⭐⭐ |
| 7 | Variables por ambiente | ⭐⭐ |
| 8 | Entrypoint scripts | ⭐⭐ |
| 9 | Health checks avanzados | ⭐⭐ |
| 10 | Build optimization | ⭐⭐⭐ |
| 11 | GitHub Actions matrix | ⭐⭐ |
| 12 | Docker networks | ⭐⭐⭐ |

---

## 🏆 Mini-Proyecto: Sistema Completo

### Objetivo
Implementar todos los conceptos avanzados.

### Requisitos
1. Backend Node.js + TypeScript
2. Base de datos PostgreSQL
3. Cache Redis
4. Frontend Angular
5. Health checks
6. GitHub Actions con notifications
7. Resource limits
8. Logging centralizado
9. Multiple environments

### Pasos
1. Comienza desde `GUIA-DOCKER-GITHUB-ACTIONS.md`
2. Implementa Ejemplo 1 (TypeScript)
3. Implementa Ejemplo 2 (Redis)
4. Implementa Ejemplo 5 (Recursos)
5. Implementa Ejemplo 8 (Entrypoint)
6. Implementa Ejemplo 9 (Health)
7. Implementa Ejemplo 12 (Networks)

**Resultado:** Sistema production-ready 🚀
