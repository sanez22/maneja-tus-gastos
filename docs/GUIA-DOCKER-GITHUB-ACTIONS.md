# 📚 Guía Completa: Docker, Docker Compose y GitHub Actions
## Proyecto: Maneja Tus Gastos

**Versión:** 1.0  
**Audiencia:** Estudiantes de desarrollo full-stack  

---

## 📋 Tabla de Contenidos

1. [¿Por qué Docker?](#por-qué-docker)
2. [Conceptos Fundamentales](#conceptos-fundamentales)
3. [Componentes del Proyecto](#componentes-del-proyecto)
4. [Dockerfile del Backend](#dockerfile-del-backend)
5. [Dockerfile del Frontend](#dockerfile-del-frontend)
6. [Docker Compose](#docker-compose)
7. [GitHub Actions Workflows](#github-actions-workflows)
8. [Ejecución Local](#ejecución-local)
9. [Troubleshooting](#troubleshooting)
10. [Mejores Prácticas](#mejores-prácticas)

---

## 🐳 ¿Por qué Docker?

### El Problema Sin Docker

Imagina que trabajas en un proyecto con tu equipo. Tienes:
- **Tu computadora:** Ubuntu 22.04, Node 20, PostgreSQL 14, npm 10
- **Computadora del compañero:** Windows 11, Node 18, PostgreSQL 15, npm 9
- **Servidor de producción:** CentOS 7, Node 19, PostgreSQL 13, npm 8

¿Resultado? **"En mi máquina funciona, pero en la del otro no"** ☠️

### La Solución: Docker

Docker **empaqueta tu aplicación completa** con todas sus dependencias en un **contenedor**. Es como una caja sellada que incluye:
- Sistema operativo (Linux Alpine)
- Runtime (Node.js 20)
- Dependencias npm
- Código de la aplicación
- Variables de configuración
- Puerto expuesto

**Garantía:** Si funciona en el contenedor Docker de tu máquina, funcionará igual en:
- Computadora de compañeros
- Servidor de producción
- GitHub Actions (CI/CD)
- Cloud (AWS, Google Cloud, Render, etc.)

### Ventajas de Docker en Este Proyecto

| Ventaja | Beneficio |
|---------|-----------|
| **Isolation** | Cada servicio (Backend, Frontend, BD) en su propio contenedor sin conflictos |
| **Reproducibilidad** | Mismo ambiente en desarrollo y producción |
| **Facilidad de onboarding** | Nuevos estudiantes: `docker-compose up` y listo |
| **CI/CD** | GitHub Actions construye la misma imagen que usas localmente |
| **Deployable** | Listo para Render.com, AWS, Google Cloud, etc. |

---

## 🔧 Conceptos Fundamentales

### 1. **Imagen Docker**
Es el **blueprint** o **molde** de un contenedor. Define:
- Sistema base (Linux)
- Qué instalar
- Qué archivos copiar
- Qué comando ejecutar

**Analogía:** Es como una clase en programación.

```dockerfile
FROM node:20-alpine          # Base
WORKDIR /app                  # Directorio
COPY package*.json ./         # Archivos
RUN npm ci                    # Instrucción
CMD ["node", "app.js"]       # Comando por defecto
```

### 2. **Contenedor Docker**
Es la **instancia en ejecución** de una imagen.

**Analogía:** Es una instancia de un objeto (creado desde la clase Imagen).

```bash
# Crear contenedor desde imagen
docker run -p 3000:3000 mi-imagen

# Es como: 
# crear_contenedor = new Imagen()
```

### 3. **Dockerfile**
Archivo de instrucciones que define cómo construir una imagen.

### 4. **Docker Compose**
Permite definir y ejecutar múltiples contenedores. En lugar de:

```bash
# Tedioso 😫
docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
docker run -p 3000:3000 --link postgres backend
docker run -p 4200:80 frontend
```

Haces simplemente:

```bash
# Fácil 😊
docker-compose up
```

### 5. **Volúmenes**
Persisten datos entre contenedores. Sin volúmenes, al eliminar un contenedor se pierden los datos.

```yaml
volumes:
  postgres_data:  # Volumen nombrado
  ./backend/src:/app/src  # Mount de directorio local
```

### 6. **Redes**
Los contenedores en Docker Compose se comunican automáticamente por nombre:

```yaml
backend:
  # Otros contenedores llaman a este como "backend:3000"
```

---

## 🏗️ Componentes del Proyecto

Este proyecto tiene **3 servicios interconectados:**

```
┌─────────────────────────────────────────────────────────────────┐
│                     DOCKER COMPOSE NETWORK                      │
├─────────────┬──────────────────┬─────────────────────────────────┤
│ PostgreSQL  │   Backend API    │      Frontend (Nginx)           │
│ :5432       │   Node + Express │      Angular Compilado          │
│             │   :3000          │      :4200 (puerto host)        │
│ (gastos_db) │ (gastos_backend) │      (gastos_frontend)          │
└─────────────┴──────────────────┴─────────────────────────────────┘
```

---

## 📦 Dockerfile del Backend

### Ubicación
`/backend/Dockerfile`

### Código
```dockerfile
# ======== ETAPA 1: BUILD ========
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# ======== ETAPA 2: PRODUCCIÓN ========
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/src ./src
EXPOSE 3000
CMD ["node", "src/app.js"]
```

### Explicación Línea por Línea

#### Etapa 1: BUILD (Multi-stage build)

```dockerfile
FROM node:20-alpine AS builder
```
- **`FROM`**: Imagen base (Linux Alpine + Node.js 20)
- **`Alpine`**: Versión muy ligera de Linux (~40MB vs 900MB de versión completa)
- **`AS builder`**: Nombre esta etapa como "builder" para referencia posterior

**¿Por qué Alpine?** Reduce tamaño de imagen → deploy más rápido → ahorra espacio/dinero.

```dockerfile
WORKDIR /app
```
- Crea y entra al directorio `/app` **dentro del contenedor**
- Todos los comandos siguientes se ejecutan aquí

```dockerfile
COPY package*.json ./
```
- Copia `package.json` y `package-lock.json` (el `*` es wildcard)
- Del sistema local a `/app` en el contenedor
- ✅ Se copia **antes** del código para aprovechar caché de Docker

```dockerfile
RUN npm ci
```
- **Ejecuta comando** en el contenedor
- **`npm ci`** (clean install): Instala exactamente las versiones en `package-lock.json`
- Diferencia con `npm install`:
  - `npm install`: Instala versiones compatibles (puede variar)
  - `npm ci`: Reproducible, determinístico (¡mejor para Docker!)

```dockerfile
COPY . .
```
- Copia todo el código del proyecto al contenedor

#### Etapa 2: PRODUCCIÓN

```dockerfile
FROM node:20-alpine
```
- **Nueva imagen base** (descarta Etapa 1)
- **Multi-stage build:** Tomamos solo lo necesario del builder

**¿Por qué dos etapas?** 
- Build necesita herramientas (npm, compilar, etc.) = imagen grande
- Producción solo necesita el app compilado = imagen pequeña
- **Resultado:** Imagen 60% más pequeña

```dockerfile
ENV NODE_ENV=production
```
- Variable de entorno para que Express/Node sepa que está en producción
- Desactiva código de debug, activa optimizaciones

```dockerfile
RUN npm ci --omit=dev
```
- **`--omit=dev`**: No instala dependencias de desarrollo (devDependencies)
- Qué NO entra: `jest`, `@types/*`, herramientas de build
- Imagen aún más pequeña

```dockerfile
COPY --from=builder /app/src ./src
```
- **`--from=builder`**: Copia desde la etapa 1
- Solo el código compilado `/app/src`
- No copia `node_modules` grandes del builder

```dockerfile
EXPOSE 3000
```
- **Documenta** que el contenedor escucha en puerto 3000
- No publica el puerto (lo hace Docker Compose)

```dockerfile
CMD ["node", "src/app.js"]
```
- **Comando por defecto** al iniciar contenedor
- Ejecuta `node src/app.js`
- **Diferencia CMD vs RUN:**
  - `RUN`: Ejecuta al **construir** la imagen
  - `CMD`: Ejecuta al **iniciar** el contenedor

---

## 🎨 Dockerfile del Frontend

### Ubicación
`/frontend/Dockerfile`

### Código
```dockerfile
# ======== ETAPA 1: BUILD DE ANGULAR ========
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx ng build --configuration development

# ======== ETAPA 2: SERVIDOR NGINX ========
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### ¿Por qué es diferente del Backend?

#### Etapa 1: Build Angular
```dockerfile
RUN npm install --legacy-peer-deps
```
- **`--legacy-peer-deps`**: Resuelve conflictos de versiones de Angular
- Necesario porque Angular 19 tiene dependencias estrictas

```dockerfile
RUN npx ng build --configuration development
```
- **`ng build`**: Compila código TypeScript → JavaScript estático
- **`--configuration development`**: Build optimizado para desarrollo
- **Resultado:** Carpeta `/app/dist/frontend/browser/` con HTML, JS, CSS estáticos

#### Etapa 2: Servidor Nginx
```dockerfile
FROM nginx:alpine
```
- **Nueva imagen base**: Nginx (web server ultraligero)
- **¿Por qué Nginx en lugar de Node?**
  - Frontend es HTML/CSS/JS estático
  - Node.js es overkill (Node es para backend dinámico)
  - Nginx es 10x más rápido, 10x menor recursos

```dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf
```
- Configuración de Nginx desde `frontend/nginx.conf`
- Define cómo servir archivos estáticos

```dockerfile
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
```
- **`/usr/share/nginx/html`**: Directorio por defecto de Nginx
- Solo copia archivos compilados, no `node_modules`

```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```
- **`daemon off`**: Nginx se ejecuta en foreground
- Permite que Docker monitoree el proceso

### Diferencia: Backend vs Frontend

| Aspecto | Backend | Frontend |
|---------|---------|----------|
| **Base** | Node.js | Nginx |
| **En producción** | Ejecuta JavaScript | Sirve HTML/CSS/JS |
| **Lógica** | Dinámico (BD, APIs) | Estático (compilado) |
| **Build** | npm ci | ng build |
| **Tamaño** | ~250MB | ~50MB |

---

## 🔗 Docker Compose

### Concepto
Orquestador de contenedores. Define **cómo los servicios se relacionan y comunican**.

### Archivo
`/docker-compose.yml`

### Servicios Definidos

#### 1️⃣ PostgreSQL (Base de Datos)

```yaml
postgres:
  image: postgres:16-alpine
  container_name: gastos_db
  environment:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    POSTGRES_DB: gastos_db
  ports:
    - '5432:5432'
  volumes:
    - postgres_data:/var/lib/postgresql/data
  healthcheck:
    test: ['CMD-SHELL', 'pg_isready -U postgres']
    interval: 10s
    timeout: 5s
    retries: 5
```

**Explicación:**

```yaml
image: postgres:16-alpine
```
- **Descarga imagen precompilada** de PostgreSQL
- No construye un Dockerfile, usa imagen oficial

```yaml
environment:
```
- Variables de entorno que PostgreSQL lee
- `POSTGRES_DB: gastos_db` crea base de datos automáticamente

```yaml
ports:
  - '5432:5432'
```
- **`5432` (host) → `5432` (contenedor)**
- Mapeo de puertos: accedes a BD en `localhost:5432` desde tu máquina

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```
- **Volumen nombrado** `postgres_data`
- Persiste datos incluso si borras contenedor
- Se define al final del archivo: `volumes:`

```yaml
healthcheck:
```
- **Monitorea salud** de PostgreSQL
- Ejecuta `pg_isready` cada 10s
- Otros servicios esperan `service_healthy` antes de iniciar

#### 2️⃣ Backend (Node.js + Express)

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  container_name: gastos_backend
  environment:
    NODE_ENV: development
    PORT: 3000
    DB_HOST: postgres
    DB_PORT: 5432
    DB_NAME: gastos_db
    DB_USER: postgres
    DB_PASS: postgres
  ports:
    - '3000:3000'
  depends_on:
    postgres:
      condition: service_healthy
  volumes:
    - ./backend/src:/app/src
  restart: unless-stopped
```

**Explicación:**

```yaml
build:
  context: ./backend
  dockerfile: Dockerfile
```
- **Construye imagen** desde Dockerfile en `./backend/`
- No descarga precompilada, compila localmente

```yaml
DB_HOST: postgres
```
- **¡Docker magic!** Dentro del contenedor, "postgres" resuelve a 172.20.0.2 (IP del contenedor postgres)
- No es `localhost`, es **nombre de servicio en Docker network**

```yaml
depends_on:
  postgres:
    condition: service_healthy
```
- **Backend espera** a que PostgreSQL esté listo
- No solo que inicie, que esté **HEALTHY**

```yaml
volumes:
  - ./backend/src:/app/src
```
- **Mount de directorio:** Cambios locales = cambios en contenedor **en vivo**
- Permite Hot-reload durante desarrollo
- No persiste entre contenedores, es solo para desarrollo

```yaml
restart: unless-stopped
```
- Si el proceso falla, reinicia automáticamente
- Excepto si lo detienes manualmente (`docker-compose down`)

#### 3️⃣ Frontend (Angular + Nginx)

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: gastos_frontend
  ports:
    - '4200:80'
  depends_on:
    - backend
  restart: unless-stopped
```

**Explicación:**

```yaml
ports:
  - '4200:80'
```
- Host: **4200** (puerto Angular estándar)
- Contenedor: **80** (puerto Nginx estándar)

```yaml
depends_on:
  - backend
```
- Frontend espera a backend (no necesita healthcheck)

### Volúmenes (Sección Final)

```yaml
volumes:
  postgres_data:
```
- Define volumen **nombrado** `postgres_data`
- Administrado por Docker
- Persiste datos entre `docker-compose stops` y `docker-compose up`

### Flujo de Comunicación

```
Frontend (nginx:80)
    ↓ (solicitudes HTTP)
Backend (express:3000)
    ↓ (consultas SQL)
PostgreSQL (:5432)
```

**Importante:** Todo ocurre dentro de Docker network privada. Desde tu máquina solo accedes a:
- `localhost:4200` → Frontend
- `localhost:3000` → Backend
- `localhost:5432` → BD

---

## ⚙️ GitHub Actions Workflows

### ¿Qué es CI/CD?

**CI** = Continuous Integration: Pruebas automáticas cada push
**CD** = Continuous Deployment: Deploy automático si pruebas pasan

### Flujo General

```
Haces commit → GitHub detecta cambios → 
→ Ejecuta workflow automático → 
→ Construye/Testea/Deploya
```

### Workflow Frontend: `deploy-frontend.yml`

#### Disparador (Trigger)

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy-frontend.yml'
```

- **Ejecuta cuando:** Haces push a `main` Y cambias archivos en `frontend/`
- No ejecuta si solo cambias backend (ahorra tiempo/dinero)

#### Paso 1: Checkout

```yaml
- name: 📥 Checkout código
  uses: actions/checkout@v4
```

- Descarga el código del repositorio
- GitHub Actions se ejecuta en servidor remoto, necesita tu código

#### Paso 2: Setup Node.js

```yaml
- name: ⚙️ Setup Node.js 20
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: frontend/package-lock.json
```

- **`node-version: '20'`**: Instala Node.js 20 en la máquina virtual
- **`cache: 'npm'`**: ⚡ Cachea `node_modules` de build anterior
  - Primera ejecución: descarga 950 paquetes (5 min)
  - Siguientes: usa caché (30 seg)

#### Paso 3: Instalar Dependencias

```yaml
- name: 📦 Instalar dependencias
  working-directory: frontend
  run: npm ci
```

- **`npm ci`**: Clean install desde `package-lock.json`
- Garantiza versiones exactas (reproducible)
- Si `package-lock.json` está desactualizado → **ERROR**
  - (¡Este era tu error anterior!)

**Importante:** `npm ci` vs `npm install`:
- `npm ci`: Exacto (lo que usamos en CI/CD)
- `npm install`: Flexible (lo que usas localmente en desarrollo)

#### Paso 4: Ejecutar Tests

```yaml
- name: 🧪 Correr unit tests
  working-directory: frontend
  run: npm test -- --watch=false --browsers=ChromeHeadless
```

- **Jasmine + Karma**: Framework de testing
- **`--watch=false`**: No espera cambios (CI/CD necesita terminar)
- **`--browsers=ChromeHeadless`**: Usa browser headless (sin interfaz gráfica)

**Falla si:** Algún test no pasa → GitHub rechaza el deploy ✅

#### Paso 5: Build Producción

```yaml
- name: 🏗️ Build producción (ng build)
  working-directory: frontend
  run: npm run build:prod
```

- Script definido en `package.json`:
  ```json
  {
    "scripts": {
      "build:prod": "ng build --configuration production"
    }
  }
  ```
- **Resultado:** Carpeta `dist/` con HTML/CSS/JS optimizados
- Falla si hay errores de TypeScript → Deploy rechazado ✅

#### Paso 6: Deploy a Firebase

```yaml
- name: 🔥 Deploy a Firebase Hosting
  uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    repoToken: ${{ secrets.GITHUB_TOKEN }}
    firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
    channelId: live
    projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
```

- **`${{ secrets.* }}`**: Variables secretas guardadas en GitHub
- Credenciales NO aparecen en logs
- Deploy la carpeta `dist/` a Firebase Hosting

---

### Workflow Backend: `deploy-backend.yml`

Similar al frontend, pero con diferencias:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'
```

- Solo se dispara con cambios en `backend/`

#### Pasos Específicos

```yaml
- name: 🐳 Build Docker image
  working-directory: backend
  run: docker build -t maneja-tus-gastos-backend:latest .
```

- **Valida que el Dockerfile compila** correctamente
- Crea imagen con nombre `maneja-tus-gastos-backend:latest`

```yaml
- name: 🚀 Deploy a Render.com
  run: |
    curl -s -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}" \
      -H "Accept: application/json" | jq .
```

- **Webhook**: URL que Render monitorea
- Cuando recibe POST → Render despliega automáticamente
- `jq`: Formatea respuesta JSON

---

## 🚀 Ejecución Local

### Con Docker Compose

```bash
# Ir al proyecto
cd /ruta/del/proyecto

# Construir e iniciar servicios
docker-compose up --build

# En otra terminal, ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Eliminar volúmenes (¡borra datos de BD!)
docker-compose down -v
```

### Acceso a Servicios

| Servicio | URL |
|----------|-----|
| **Frontend** | http://localhost:4200 |
| **Backend API** | http://localhost:3000 |
| **PostgreSQL** | `localhost:5432` (desde app) |

### Ejecutar Comandos en Contenedores

```bash
# Bash en el contenedor backend
docker-compose exec backend bash

# Dentro del contenedor
npm test
npm run serve

# Ver logs en vivo
docker-compose logs backend -f

# Bash en base de datos
docker-compose exec postgres psql -U postgres -d gastos_db

# Ver tablas
\dt
```

---

## 🔍 Troubleshooting

### Error: "npm ci can only install when package-lock.json is in sync"

**Causa:** `package.json` y `package-lock.json` están desincronizados

**Solución:**
```bash
cd frontend
npm install --legacy-peer-deps
git add package-lock.json
git commit -m "Update dependencies"
git push
```

**¿Por qué pasa?**
- Actualizaste `package.json` manualmente
- Otro miembro cambió versiones
- Npm versiones diferentes generan lock files distintos

---

### Error: "Backend cannot connect to database"

**Causa:** BD no está lista cuando backend inicia

**Solución:** Ya manejado en `docker-compose.yml`:
```yaml
depends_on:
  postgres:
    condition: service_healthy
```

Pero si falla:
```bash
# Ver logs de postgres
docker-compose logs postgres

# Ver si está healthy
docker-compose ps
```

---

### Error: "Hot-reload not working"

**Causa:** Volumen local no está correctamente mapeado

```bash
# Verifica volumen
docker-compose exec backend ls -la src/

# Edita archivo localmente y espera (nodemon lo debería detectar)
```

---

### Error: "Port 3000 already in use"

**Causa:** Otro proceso usa puerto 3000 (redis, otro servidor, etc.)

**Solución:**
```bash
# Encuentra proceso
lsof -i :3000

# Mata proceso
kill -9 <PID>

# O usa otro puerto
docker-compose -f docker-compose.yml up -e PORT=3001
```

---

### Error: "Cannot access backend from frontend"

**Causa:** Frontend intenta conectarse a `localhost:3000` en lugar de `backend:3000`

**Archivos a revisar:**
- `frontend/src/environments/environment.ts`
- `frontend/src/environments/environment.prod.ts`

**Debe ser:**
```typescript
// Dentro de contenedor Docker
apiUrl: 'http://backend:3000'

// En producción (fuera de Docker)
apiUrl: 'https://tu-backend-render.onrender.com'
```

---

### Docker Compose se queda "hanged"

**Causa:** build largo que parece congelado

**Solución:**
```bash
# Ver progreso en tiempo real
docker-compose up --build

# En otra terminal
docker-compose logs -f

# Aumenta timeout
docker-compose --timeout 0 down
```

---

## 📚 Mejores Prácticas

### 1. **Siempre usa `npm ci` en CI/CD**

```yaml
# ❌ MAL (inconsistente)
run: npm install

# ✅ BIEN (reproducible)
run: npm ci
```

### 2. **Multi-stage builds para reducir tamaño**

```dockerfile
# ❌ Contiene todo
FROM node:20
RUN npm install
# Resultado: 900MB

# ✅ Descarta lo innecesario
FROM node:20 AS builder
RUN npm install

FROM node:20-alpine
COPY --from=builder /app/src ./src
# Resultado: 250MB
```

### 3. **Versiona `package-lock.json`**

Siempre commit:
```bash
git add package-lock.json
```

**Por qué:** Sin lock file, `npm ci` falla en CI/CD.

### 4. **Usa healthchecks en servicios críticos**

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
  interval: 10s
  timeout: 5s
  retries: 3
```

### 5. **Variables de entorno por ambiente**

```yaml
# docker-compose.yml (desarrollo)
environment:
  NODE_ENV: development

# GitHub Actions (producción)
env:
  NODE_ENV: production
```

### 6. **Documenta todas tus imágenes**

```dockerfile
# Dockerfile
# Este contenedor ejecuta backend de Node.js/Express
# Construye con: docker build -t mi-backend .
# Ejecuta con: docker run -p 3000:3000 mi-backend

FROM node:20-alpine
...
```

### 7. **.dockerignore para evitar archivos innecesarios**

```
node_modules
npm-debug.log
dist
.git
.env.local
```

**Resultado:** Imagen más pequeña, build más rápido.

### 8. **Logs claros en CI/CD**

```yaml
- name: 📦 Build process
  run: npm run build
  # Si falla, logs aparecen automáticamente
```

Los emojis (📦, 🚀, ❌) son visibles en GitHub UI, facilita debugging visual.

---

## 📖 Referencia Rápida

### Comandos Docker Esenciales

```bash
# Imágenes
docker images                    # Listar imágenes
docker build -t nombre .        # Construir imagen
docker rmi nombre               # Eliminar imagen

# Contenedores
docker ps                       # Contenedores activos
docker ps -a                    # Todos los contenedores
docker run -p 8080:80 imagen   # Ejecutar contenedor
docker exec -it nombre bash     # Entrar a contenedor
docker logs nombre              # Ver logs
docker stop nombre              # Detener
docker rm nombre                # Eliminar

# Docker Compose
docker-compose up --build      # Iniciar y construir
docker-compose down            # Detener todo
docker-compose down -v         # Detener y borrar volúmenes
docker-compose logs -f         # Ver logs en vivo
docker-compose ps              # Ver estado servicios
docker-compose exec svc bash   # Bash en servicio
```

### Conceptos Clave Resumidos

| Concepto | Qué es | Analogía |
|----------|--------|----------|
| **Dockerfile** | Instrucciones | Receta de cocina |
| **Imagen** | Empaquetado | Caja cerrada con producto |
| **Contenedor** | Ejecución | Producto usando la caja |
| **Docker Compose** | Orquestador | Cocina completa |
| **Volumen** | Almacenamiento | Refrigerador que persiste |
| **Red Docker** | Comunicación | Red privada entre contenedores |
| **Healthcheck** | Monitoreo | Doctor revisando salud |
| **CI/CD** | Automatización | Robot que testea y deploya |

---

## 🎓 Ejercicios para Estudiantes

### Ejercicio 1: Entender Docker Compose
**Objetivo:** Modificar `docker-compose.yml`

1. Cambia puerto del backend de 3000 a 3001
2. Ejecuta `docker-compose up`
3. Accede a `http://localhost:3001`
4. ¿Qué pasa? ¿Por qué?

**Respuesta esperada:** El backend está en 3001, pero el nginx del frontend sigue buscando `http://backend:3000` → error de conexión.

---

### Ejercicio 2: Hot-reload en Desarrollo
**Objetivo:** Entender volúmenes

1. En `backend/src/app.js` cambia un console.log
2. ¿Cuánto tiempo tarda en actualizar?
3. ¿Por qué es instantáneo?

**Respuesta esperada:** Volumen mapea `./backend/src` → reconoce cambios → nodemon reinicia automáticamente.

---

### Ejercicio 3: Fallar CI/CD Deliberadamente
**Objetivo:** Entender workflows

1. Rompe propósitamente un test en `frontend/src/`
2. Haz commit y push a `main`
3. Observa GitHub Actions → verás el workflow falla
4. Arregla el test y vuelve a hacer push
5. Workflow pasa y deploy automático 🚀

---

### Ejercicio 4: Analizar Capas de Docker
**Objetivo:** Entender multi-stage builds

```bash
# Build imagen
docker build -t gastos-backend ./backend

# Ver capas
docker history gastos-backend

# ¿Cuántas capas?
# ¿Cuál es la más grande?
# ¿Por qué?
```

---

### Ejercicio 5: Escribir un Nuevo Dockerfile
**Objetivo:** Crear Dockerfile desde cero

Dado un servicio Redis nuevo, escribe su Dockerfile considerando:
- Base: `redis:7-alpine`
- Puerto: 6379
- Exposición de puerto
- CMD correcto
- Agrega a docker-compose.yml

---

## 🔗 Recursos Externos

- [Documentación Docker Oficial](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Best Practices for Node.js Docker](https://snyk.io/blog/10-docker-image-security-best-practices/)


---

## 📞 Preguntas Frecuentes

**P: ¿Por qué no usamos `docker run` en lugar de `docker-compose`?**
R: `docker run` requiere escribir comandos muy largos para cada contenedor y manejar redes manualmente. `docker-compose` simplifica todo con un YAML.

**P: ¿Los volúmenes entre contenedores son automáticos?**
R: Sí, están en la misma red Docker. Pueden conectarse por nombre de servicio (`postgres`, `backend`).

**P: ¿Qué pasa si los tests fallan en GitHub Actions?**
R: El workflow se detiene, no hace deploy, GitHub notifica al PR. Debes arreglar el código.

**P: ¿Puedo tener múltiples ambientes (dev, staging, prod)?**
R: Sí, crea `docker-compose.dev.yml`, `docker-compose.prod.yml` y usa `-f` flag.

**P: ¿Por qué `npm ci` en lugar de `npm install` en Docker?**
R: `npm ci` es determinístico y usa versiones exactas del `package-lock.json`. Más predecible en CI/CD.

---

## 📝 Notas Finales

Este proyecto es una **plantilla educativa** que demuestra:
- ✅ Containerización profesional
- ✅ Orquestación de múltiples servicios
- ✅ Automatización CI/CD  
- ✅ Deployments reproducibles

**Todos estos conceptos te abrirán puertas en entrevistas técnicas y trabajos reales.** Docker es el estándar de la industria en 2025. 🚀

---
