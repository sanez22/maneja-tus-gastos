# 🔧 Troubleshooting Avanzado & Cheat Sheet

---

## 🚨 Matrix de Errores Comunes

### Error 1: "Cannot GET /api/expenses net::ERR_NAME_NOT_RESOLVED"

#### Síntomas
```
POST http://backend:3000/api/expenses net::ERR_NAME_NOT_RESOLVED
```

#### Causa Raíz
Frontend dentro del contenedor Docker intenta conectarse a `backend:3000`, pero no resuelve.

**Razones:**
1. Backend no está corriendo
2. Backend no está en la misma red Docker
3. Frontend usa `localhost:3000` en lugar de `backend:3000`

#### Diagnóstico

```bash
# 1. Ver si backend está corriendo
docker-compose ps
# OUTPUT:
# NAME            STATUS
# gastos_backend  Up

# 2. Ver logs de backend
docker-compose logs backend
# Busca errores de conexión

# 3. Probar conectividad desde frontend
docker-compose exec frontend ping backend
# Debería responder

# 4. Revisar configuración API del frontend
docker-compose exec frontend cat /usr/share/nginx/html/main.*.js | grep backend
```

#### Solución

**Opción A: Revisar environment.ts del frontend**

```typescript
// frontend/src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://backend:3000'  // ✅ CORRECTO (nombre servicio)
};

// ❌ INCORRECTO:
// apiUrl: 'http://localhost:3000'  // NO funciona dentro de Docker
```

**Opción B: Verificar docker-compose.yml**

```yaml
services:
  backend:
    # ... config ...
    networks:
      - default  # DEBE estar en "default" network
```

**Opción C: Rebuild**

```bash
docker-compose down
docker-compose up --build --no-cache
```

---

### Error 2: "ECONNREFUSED 127.0.0.1:5432"

#### Síntomas
```
Backend no puede conectar a base de datos
Backend crashes con: ECONNREFUSED 127.0.0.1:5432
```

#### Causa Raíz
Backend intenta conectarse a `127.0.0.1:5432` (localhost), pero PostgreSQL está en otro contenedor.

#### Solución

**backend/src/db/index.js** - Cambiar host:

```javascript
// ❌ MAL (host local)
const pool = new Pool({
  host: 'localhost'  // No funciona en Docker
});

// ✅ BIEN (nombre servicio Docker)
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres'  // Nombre del servicio en docker-compose
});
```

**docker-compose.yml** - Verificar variables:

```yaml
backend:
  environment:
    DB_HOST: postgres      # ← Nombre del servicio
    DB_PORT: 5432
    DB_USER: postgres
    DB_PASS: postgres
    DB_NAME: gastos_db
```

---

### Error 3: "Port 3000 already in use"

#### Síntomas
```
Error: listen EADDRINUSE :::3000
```

#### Diagnóstico

```bash
# Qué proceso usa puerto 3000
lsof -i :3000

# Qué PID
sudo lsof -i :3000 -t | head -1

# Kill proceso
kill -9 $(sudo lsof -i :3000 -t)
```

#### Solución

**Opción A: Cambiar puerto en docker-compose.yml**

```yaml
backend:
  ports:
    - '3001:3000'  # Cambiar host port a 3001
```

**Opción B: Usar port diferente temporalmente**

```bash
docker-compose -f docker-compose.yml -p mi-proyecto-alt up
```

---

### Error 4: "npm ci can only install packages when package-lock.json is in sync"

#### Síntomas
```
npm error code EUSAGE
npm error Missing: webpack@5.105.4 from lock file
```

#### Causa Raíz
`package.json` y `package-lock.json` están desincronizados.

#### Solución

```bash
# 1. Regenerar lock file
cd frontend
rm package-lock.json
npm install --legacy-peer-deps

# 2. Verificar que se creó
ls -la package-lock.json

# 3. Commit y push
git add package-lock.json
git commit -m "Update package-lock.json"
git push
```

---

### Error 5: "Build Docker image fails: ng: not found"

#### Síntomas
```
sh: ng: not found
failed to solve: process '/bin/sh -c ng build' did not complete successfully
```

#### Causa Raíz
Angular CLI no está instalado en el contenedor.

#### Solución

**frontend/Dockerfile - Verificar npm install:**

```dockerfile
# ❌ MAL
FROM node:20-alpine
COPY . .
RUN npx ng build  # ng no existe aún

# ✅ BIEN
FROM node:20-alpine
COPY package*.json ./
RUN npm install --legacy-peer-deps  # Instala @angular/cli
COPY . .
RUN npx ng build  # Ahora ng existe
```

---

### Error 6: "connection refused to Redis"

#### Síntomas
```
Error: getaddrinfo ENOTFOUND redis
```

#### Causa Raíz
Redis no está corriendo o no está en docker-compose.yml.

#### Solución

**Agregar a docker-compose.yml:**

```yaml
services:
  backend:
    # ... existing ...
    environment:
      REDIS_URL: redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    container_name: gastos_cache
    ports:
      - '6379:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
```

---

### Error 7: "Database migration fails on startup"

#### Síntomas
```
Backend starts pero no crea tablas
Queries retornan "table not found"
```

#### Solución

**Crear archivo de migraciones:**

```javascript
// backend/scripts/migrate.js
import { pool } from '../src/db/index.js';

const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

pool.query(createTablesSQL)
  .then(() => console.log('✅ Migrations completed'))
  .catch(err => {
    console.error('❌ Migration error:', err);
    process.exit(1);
  });
```

**Ejecutar en entrypoint:**

```bash
# backend/entrypoint.sh
#!/bin/sh
set -e

echo "Running migrations..."
node scripts/migrate.js

echo "Starting server..."
exec node src/app.js
```

---

### Error 8: "Frontend shows blank page"

#### Síntomas
```
localhost:4200 carga pero está en blanco
Inspector browser muestra errores de console
```

#### Diagnóstico

```bash
# 1. Ver logs de Nginx
docker-compose logs frontend

# 2. Ver si archivos compilados existen
docker-compose exec frontend ls -la /usr/share/nginx/html

# 3. Ver contenido index.html
docker-compose exec frontend cat /usr/share/nginx/html/index.html
```

#### Solución

**Verificar nginx.conf:**

```nginx
# frontend/nginx.conf
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;  # ← CRÍTICO para SPA Angular
    }
}
```

**Rebuild:**

```bash
docker-compose down
docker-compose up --build --no-cache
```

---

### Error 9: "GitHub Actions fails with timeout"

#### Síntomas
```
workflow timeout after 360 minutes
npm install stuck
```

#### Solución

**Check logs:**

```bash
# En GitHub, ve a Actions → workflow que falla
# Click en "Run npm install" step
# Verifica si se quedó descargando paquetes
```

**Agregar timeout:**

```yaml
- name: 📦 Install dependencies
  working-directory: frontend
  run: npm ci
  timeout-minutes: 10  # ← Falla explícitamente si toma >10min
```

---

### Error 10: "Volumes not persisting data"

#### Síntomas
```
Borras contenedor: docker-compose down
Inicias de nuevo: docker-compose up
Datos desaparecieron 😱
```

#### Causa Raíz
Usaste `docker-compose down -v` que elimina volúmenes.

#### Solución

```bash
# ❌ INCORRECTO (borra volúmenes)
docker-compose down -v

# ✅ CORRECTO (preserva volúmenes)
docker-compose down

# Verificar volúmenes
docker volume ls
docker volume inspect gastos_postgres_data
```

---

## 📋 Cheat Sheet: Comandos Esenciales

### 🚀 Inicio Rápido

```bash
# Primer inicio (compila imágenes)
docker-compose up --build

# Reinicio rápido (usa imágenes cached)
docker-compose up

# Parar todos los servicios
docker-compose down

# Ver estado
docker-compose ps

# Ver logs en vivo
docker-compose logs -f

# Ver logs de servicio específico
docker-compose logs -f backend
```

### 🐳 Gestión de Imágenes

```bash
# Listar imágenes
docker images

# Construir imagen
docker build -t nombre:tag .

# Eliminar imagen
docker rmi nombre:tag

# Ver historial de capas
docker history nombre:tag

# Inspeccionar imagen
docker inspect nombre:tag
```

### 📦 Gestión de Contenedores

```bash
# Listar activos
docker ps

# Listar todos
docker ps -a

# Entrar a contenedor
docker exec -it gastos_backend bash

# Ejecutar comando
docker exec gastos_backend npm test

# Ver logs
docker logs gastos_backend

# Monitorear recursos
docker stats

# Parar contenedor
docker stop gastos_backend

# Iniciar contenedor
docker start gastos_backend

# Eliminar contenedor
docker rm gastos_backend
```

### 🔗 Docker Compose Específico

```bash
# Información detallada
docker-compose config

# Ver vars de entorno
docker-compose exec backend env

# Validar docker-compose.yml
docker-compose config --quiet

# Stats de servicios
docker-compose stats

# Reiniciar un servicio
docker-compose restart backend

# Rebuild servicio específico
docker-compose up --build backend

# Rebuild sin caché
docker-compose up --build --no-cache

# Rebuild e iniciar solo algunos servicios
docker-compose up --build postgres backend

# Ver puerto mapeado
docker-compose port backend 3000

# Ejecutar comando one-off
docker-compose run backend npm test
```

### 🔍 Debugging

```bash
# Inspeccionar red
docker network ls
docker network inspect gastos_default

# Inspeccionar volumen
docker volume ls
docker volume inspect gastos_postgres_data

# Ver procesos en contenedor
docker exec gastos_backend ps aux

# Ver historial de comandos del contenedor
docker exec gastos_backend history

# Ping entre contenedores
docker-compose exec frontend ping backend

# Curl desde contenedor
docker-compose exec frontend curl http://backend:3000/health

# Ver variables de entorno
docker-compose exec backend env
```

### 🧹 Limpieza (⚠️ Destructivo)

```bash
# Parar y eliminar TODO
docker-compose down

# ... más agresivo: elimina volúmenes
docker-compose down -v

# ... VERY agresivo: elimina también redes
docker-compose down -v --remove-orphans

# Eliminar imágenes no usadas
docker image prune

# Eliminar volúmenes no usados
docker volume prune

# Limpieza completa (CUIDADO)
docker system prune -a --volumes
```

---

## 🧪 Testing & QA

### Test Unitarios

```bash
# Frontend
docker-compose exec frontend npm test -- --watch=false --browsers=ChromeHeadless

# Backend
docker-compose exec backend npm test
```

### Test de Integración

```bash
# Backend con BD real
docker-compose -f docker-compose.test.yml up

# Frontend E2E
docker-compose exec frontend npm run e2e
```

### Test de Carga

```bash
# Instalar herramienta
npm install -g loadtest

# Test backend
loadtest -n 1000 -c 100 http://localhost:3000/api/expenses

# Ver resultados
# RPS: requests per second
# Latency: tiempo promedio respuesta
```

---

## 📊 Monitoreo & Observabilidad

### Ver Recursos en Tiempo Real

```bash
# Stats en vivo
docker stats

# Formato tabla
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Guardar histórico
docker stats > docker-stats.log &
```

### Logs Estructurados

```bash
# Ver últimas 50 líneas
docker-compose logs --tail 50

# Último día
docker-compose logs --since 24h

# Con timestamps
docker-compose logs --timestamps

# Solo errors
docker-compose logs frontend | grep -i error
```

---

## 🚀 Deployment Checklist

Antes de hacer push a producción:

- [ ] ✅ `docker-compose up --build` funciona localmente
- [ ] ✅ Todos los tests pasan (`npm test`)
- [ ] ✅ No hay warnings en build
- [ ] ✅ `package-lock.json` está actualizado
- [ ] ✅ Revisar logs de contenedores (`docker-compose logs`)
- [ ] ✅ Health endpoints responden (curl http://localhost:3000/health)
- [ ] ✅ Base de datos conectada (`docker-compose exec backend npm run migrate`)
- [ ] ✅ Frontend carga en http://localhost:4200
- [ ] ✅ API endpoint accesible desde frontend
- [ ] ✅ Commit message claro y descriptivo
- [ ] ✅ Push a rama correcta (main)
- [ ] ✅ GitHub Actions workflow ejecutándose
- [ ] ✅ No hay errores en workflow logs
- [ ] ✅ Deploy completado (Firebase, Render)
- [ ] ✅ Testing en producción

---

## 🎓 Preguntas de Conceptual Understanding

Para que los estudiantes verifiquen si realmente entienden:

**P1:** "¿Qué pasa si elimino `docker-compose down -v`?"
- A) Contenedores se detienen
- B) Contenedores se detienen Y volúmenes se borran
- C) Todo se borra incluyendo imágenes
- **R: B** ✅

**P2:** "¿Por qué usamos `npm ci` en CI/CD y no `npm install`?"
- A) Es más rápido
- B) Garantiza versiones exactas desde package-lock.json
- C) Usa menos disco
- **R: B** ✅

**P3:** "Si cambio un archivo en `frontend/src/`, ¿cuánto tarda en ver el cambio?"
- A) 30 segundos (rebuild)
- B) 1-2 segundos (hot-reload con volumen)
- C) No se refleja automáticamente
- **R: B** ✅

**P4:** "¿Desde dónde se comunican frontend y backend en Docker?"
- A) `localhost:3000` (frontend llama a `http://localhost:3000`)
- B) `backend:3000` (por Docker internal DNS)
- C) Por IP: 172.20.0.2:3000
- **R: B** ✅

**P5:** "¿Qué hace el healthcheck en docker-compose.yml?"
- A) Monitorea que servicio esté corriendo
- B) Reinicia servicio si falla
- C) Otros servicios esperan a que esté HEALTHY antes de iniciar
- **R: C** ✅

---

## 🎯 Performance Tips

### Acelerar Docker Local

```bash
# 1. Usar volúmenes con mejor performance (Mac/Windows)
# En docker-compose.yml:
volumes:
  - 'backend-src:/app/src:cached'  # ← :cached optimiza lectura

# 2. Prellenar caché de npm
# Si node_modules en repo (no ideal):
docker build --cache-from=mi-imagen .

# 3. Usar BuildKit (mejor caché)
export DOCKER_BUILDKIT=1
docker build .

# 4. Monitorear compilación
docker build --progress=plain .
```

### Bajar Tamaño de Imágenes

```dockerfile
# Usar Alpine (no ubuntu/debian)
FROM node:20-alpine  # 40MB vs 900MB

# Multi-stage (descartar build tools)
FROM node AS builder
RUN npm install ...

FROM node:20-alpine
COPY --from=builder /app/node_modules ./node_modules

# 60% más pequeña!
```

---

## 📞 Cuando Pedir Ayuda

**Buena pregunta:**
```
"Ejecuté docker-compose up pero backend falla con:
[Error: connect ECONNREFUSED 127.0.0.1:5432]
¿Cómo arreglo que no encuentre la BD?"
```

**Mala pregunta:**
```
"Docker no funciona"
```

**Información útil compartir:**
```
- Output de `docker-compose ps`
- Output de `docker-compose logs backend | tail -50`
- Output de `docker-compose config`
- Cambios recientes en Dockerfile/docker-compose.yml
- Sistema operativo (Mac/Windows/Linux)
```

---

## 📚 Recursos Adicionales

- [Docker Docs Oficial](https://docs.docker.com/engine/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/compose-file-v3/)
- [Best practices Node Docker](https://snyk.io/blog/10-docker-image-security-best-practices/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

## ✅ Validación de Aprendizaje

Has dominado si puedes:

- [ ] Explicar por qué `backend:3000` funciona pero `localhost:3000` no
- [ ] Modificar docker-compose.yml para agregar Redis
- [ ] Escribir un Dockerfile multi-stage desde cero
- [ ] Resolver "package-lock.json not in sync" error
- [ ] Entender flujo completo: code → Docker → GitHub Actions → Deploy
- [ ] Debuggear con `docker-compose logs` cuando algo falla
- [ ] Entrar a contenedor y ejecutar comandos (`docker exec`)
- [ ] Explicar diferencia entre volúmenes, bind mounts, tmpfs
- [ ] Crear workflow de GitHub Actions personalizado
- [ ] Optimizar build times

**Si marcaste todo → ¡Felicidades! Ya eres un DevOps Junior! 🚀**

---

**Última actualización:** Marzo 2025
**Versión:** 2.0
