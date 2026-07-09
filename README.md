# 💰 Maneja tus Gastos — Guía de Clase

Proyecto full-stack para aprender, paso a paso, a **dockerizar** una app, montar **CI/CD con GitHub Actions** y **publicarla en producción** (backend en Render.com, frontend en Firebase Hosting).

> 📚 Las guías de apoyo teóricas (Docker a fondo, troubleshooting, ejemplos, material del docente) están en la carpeta [`docs/`](./docs). Este README es **la guía práctica que seguiremos en clase de principio a fin**.

---

## 🗺️ Ruta de la clase

Seguiremos este orden. Cada parte se apoya en la anterior:

| Parte | Qué haremos | Resultado |
|-------|-------------|-----------|
| **0** | Conocer el proyecto y correrlo | La app funciona en tu máquina |
| **1** | 🐳 Dockerizar (Dockerfiles + Docker Compose) | Todo levanta con un solo comando |
| **2** | ⚙️ Subir a tu repo + GitHub Actions (CI/CD) | Cada `push` corre tests y despliega solo |
| **3** | 🟢 Publicar el **backend** en Render.com | API pública con base de datos |
| **4** | 🔥 Publicar el **frontend** en Firebase Hosting | App online conectada a la API |

> ⚠️ **Importante sobre el orden:** publicamos el **backend primero**. El frontend necesita la URL pública del backend (de Render) para poder conectarse, así que la conseguimos antes de desplegar el frontend.

---

## 🏗️ Arquitectura

```
maneja-tus-gastos/
├── frontend/                    → Angular 19  → Firebase Hosting
│   ├── Dockerfile               → Multi-stage: build Angular + servir con nginx
│   ├── nginx.conf               → Routing SPA + gzip + cache
│   ├── firebase.json            → Config de Firebase Hosting
│   └── src/environments/        → URL de la API (local y producción)
├── backend/                     → Node.js + Express + PostgreSQL (Sequelize)
│   ├── Dockerfile               → Multi-stage node:20-alpine
│   └── .env.example             → Variables de entorno de ejemplo
├── docker-compose.yml           → postgres + backend + frontend juntos
├── .github/workflows/
│   ├── deploy-frontend.yml      → CI/CD → Firebase Hosting
│   └── deploy-backend.yml       → CI/CD → Render.com
└── docs/                        → Guías de apoyo teóricas
```

### Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Angular 19 (Standalone Components) |
| Backend | Node.js 20 + Express 4 |
| Base de datos | PostgreSQL 16 + Sequelize ORM |
| Contenedores | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Hosting Frontend | Firebase Hosting |
| Hosting Backend | Render.com |
| Tests | Jest + Supertest (back) · Karma + Jasmine (front) |

---

## Parte 0 — Conocer y correr el proyecto

### Pre-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ábrelo y déjalo corriendo)
- [Git](https://git-scm.com/)
- [Node.js 20](https://nodejs.org/) (solo si quieres correr los tests fuera de Docker)

### 1. Descomprimir el proyecto
Descomprime el `.zip` que te entrego y entra a la carpeta:
```bash
cd maneja-tus-gastos
```

> Este proyecto base trae el código de la app **sin** Docker ni CI/CD: eso lo vamos a construir juntos en las Partes 1 y 2.

### 2. Copiar las variables de entorno del backend
```bash
cp backend/.env.example backend/.env
```

> El archivo `.env` **no se sube a Git** (está en `.gitignore`). Guarda credenciales locales.

---

## Parte 1 — 🐳 Dockerizar

La meta: pasar de "corre en mi máquina" a "corre igual en cualquier máquina". Lo logramos con **3 piezas**.

> 💡 **Los archivos ya existen vacíos en su lugar.** No tienes que crearlos: solo abre cada uno y **pega** el contenido que te doy abajo. En cada bloque verás un 📁 con la ruta exacta del archivo que debes abrir.

### 1.1 — El `Dockerfile` del backend

Usa **multi-stage build**: una etapa instala todo y otra se queda solo con lo necesario para producción (imagen más liviana).

📁 **Abre y pega en:** `backend/Dockerfile`

```dockerfile
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
```

### 1.2 — El `Dockerfile` del frontend

También multi-stage: la etapa 1 **compila** Angular, la etapa 2 sirve los archivos estáticos con **nginx** (mucho más liviano que dejar Node corriendo).

📁 **Abre y pega en:** `frontend/Dockerfile`

```dockerfile
# Etapa 1: Build de Angular
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx ng build --configuration development

# Etapa 2: Servir el build con nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 1.3 — El `docker-compose.yml`

Orquesta los **3 servicios** (base de datos, backend, frontend) y los conecta.

📁 **Abre y pega en:** `docker-compose.yml` (en la raíz del proyecto)

```yaml
services:
  # ─── Base de datos PostgreSQL ───
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

  # ─── Backend Node.js + Express ───
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
      - ./backend/src:/app/src   # hot-reload en desarrollo
    restart: unless-stopped

  # ─── Frontend Angular (con nginx) ───
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

volumes:
  postgres_data:
```

Puntos clave a explicar en clase:

- **`healthcheck`** en postgres → el backend no arranca hasta que la DB está lista.
- **`depends_on: condition: service_healthy`** → orden de arranque garantizado.
- **`volumes: postgres_data`** → los datos sobreviven a reinicios del contenedor.
- **`volumes: ./backend/src:/app/src`** → hot-reload: editas código y se refleja sin rebuild.
- El backend se conecta a la DB usando `DB_HOST: postgres` (el nombre del servicio, no `localhost`).

### 1.4 — Levantar todo con un solo comando

```bash
docker-compose up --build
```

| Servicio    | URL                          |
|-------------|------------------------------|
| 🌐 Frontend | http://localhost:4200        |
| ⚙️ Backend  | http://localhost:3000        |
| ❤️ Health   | http://localhost:3000/health |

✅ **Checkpoint:** abre http://localhost:4200 y crea un gasto. Debe guardarse y aparecer en la lista.

### 1.5 — Comandos útiles de Docker

```bash
docker-compose down       # baja los contenedores
docker-compose down -v    # baja + BORRA el volumen de la base de datos
docker-compose logs -f    # ver logs en vivo
docker ps                 # ver contenedores corriendo
```

---

## Parte 2 — ⚙️ GitHub: tu repositorio + Actions (CI/CD)

### 2.0 — Crear tu repositorio y subir el proyecto

GitHub Actions (y luego Render) trabajan sobre **tu** repositorio, así que primero súbelo. Crea un repo **vacío** en tu cuenta:

1. En [github.com](https://github.com) → **New repository** → nombre `maneja-tus-gastos` → **sin** README ni `.gitignore` (el proyecto ya los trae) → **Create repository**.
2. Desde la carpeta del proyecto, súbelo:

```bash
git init
git add .
git commit -m "Proyecto base"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/maneja-tus-gastos.git
git push -u origin main
```

> Reemplaza `TU_USUARIO` por tu usuario de GitHub. A partir de aquí, cada `git push` a `main` disparará los workflows.

### 2.1 — Crear los workflows

La meta: cada vez que hagamos `push` a `main`, GitHub **corre los tests solo** y, si pasan, **despliega automáticamente**.

Los dos workflows ya existen vacíos en la carpeta `.github/workflows/`. Ábrelos y pega el contenido de cada bloque de abajo.

> 💡 La carpeta `.github` empieza con punto, así que a veces queda oculta en el explorador de archivos; en VS Code se ve sin problema. Cada uno se activa solo cuando cambian archivos de su carpeta:

- **`deploy-backend.yml`** → se dispara con cambios en `backend/**`
- **`deploy-frontend.yml`** → se dispara con cambios en `frontend/**`

### Patrón común de un workflow

1. 📥 Descarga el código (`checkout`)
2. ⚙️ Configura Node.js 20
3. 📦 Instala dependencias (`npm ci`)
4. 🧪 Corre los tests
5. 🏗️ Construye (build de Angular / build de imagen Docker)
6. 🚀 Despliega (Firebase / Render)

📁 **Abre y pega en:** `.github/workflows/deploy-backend.yml`

```yaml
name: 🚀 Deploy Backend → Render.com

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-backend.yml'

jobs:
  test-and-deploy:
    name: Test, Build Docker & Deploy Backend
    runs-on: ubuntu-latest
    steps:
      - name: 📥 Checkout código
        uses: actions/checkout@v4

      - name: ⚙️ Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: 📦 Instalar dependencias
        working-directory: backend
        run: npm ci

      - name: 🧪 Correr unit tests
        working-directory: backend
        run: npm test

      - name: 🐳 Build Docker image
        working-directory: backend
        run: docker build -t maneja-tus-gastos-backend:latest .

      - name: 🚀 Deploy a Render.com
        run: curl -s -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
```

📁 **Abre y pega en:** `.github/workflows/deploy-frontend.yml`

```yaml
name: 🚀 Deploy Frontend → Firebase Hosting

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy-frontend.yml'

jobs:
  test-and-deploy:
    name: Test, Build & Deploy Angular
    runs-on: ubuntu-latest
    steps:
      - name: 📥 Checkout código
        uses: actions/checkout@v4

      - name: ⚙️ Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: 📦 Instalar dependencias
        working-directory: frontend
        run: npm ci

      - name: 🧪 Correr unit tests
        working-directory: frontend
        run: npm test -- --watch=false --browsers=ChromeHeadless

      - name: 🏗️ Build producción
        working-directory: frontend
        run: npm run build:prod

      - name: 🔥 Deploy a Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
          entryPoint: ./frontend
```

> El paso de **deploy** de cada workflow necesita los **secrets** que configuramos en las Partes 3 y 4. Sin ellos, los tests y el build corren igual, pero el deploy falla. Por eso primero armamos los workflows y luego, al publicar, agregamos los secrets.

### Probar los tests localmente antes de hacer push

```bash
# Backend
cd backend && npm install && npm test

# Frontend
cd frontend && npm install && npm test
```

---

## Parte 3 — 🟢 Publicar el Backend en Render.com

> Hacemos esto **antes** que el frontend, porque necesitamos la URL pública del backend para configurar el frontend.

### 1. Crear cuenta
Ve a [render.com](https://render.com) → **Sign up with GitHub**.

### 2. Crear la base de datos PostgreSQL
1. Dashboard → **New → PostgreSQL**
2. **Name:** `gastos-db` · **Plan:** `Free` → **Create Database**
3. Espera a que quede en estado *Available*.
4. Copia el **"Internal Database URL"** (la usarás en el siguiente paso).

### 3. Crear el Web Service del backend
1. Dashboard → **New → Web Service**
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Name:** `maneja-tus-gastos-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Docker` ← usa tu Dockerfile automáticamente
   - **Plan:** `Free`
4. En **Environment Variables** agrega:
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | la Internal Database URL del paso anterior |
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` |
5. **Create Web Service** → espera al primer deploy (~5 min).
6. Copia la URL pública del servicio, ej: `https://maneja-tus-gastos-api.onrender.com`

✅ **Checkpoint:** abre `https://TU-SERVICIO.onrender.com/health` → debe responder `{"status":"OK",...}`.

### 4. Deploy Hook para GitHub Actions
1. Web Service → **Settings** → sección **Deploy Hook**
2. Copia la URL (algo como `https://api.render.com/deploy/srv-xxx?key=yyy`)
3. En GitHub → tu repo → **Settings → Secrets and variables → Actions → New repository secret**
4. Nombre: `RENDER_DEPLOY_HOOK_URL` · Valor: la URL copiada

> ⚠️ **Nota:** el plan Free de Render "duerme" el servicio tras 15 min de inactividad. La primera request después puede tardar ~30 segundos. Es normal.

---

## Parte 4 — 🔥 Publicar el Frontend en Firebase Hosting

### 1. Conectar el frontend con el backend de producción
Edita `frontend/src/environments/environment.prod.ts` y pon la URL de Render (Parte 3, paso 3):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://maneja-tus-gastos-api.onrender.com', // ← TU URL de Render
};
```

### 2. Crear proyecto en Firebase
1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. **"Agregar proyecto"** → Nombre: `maneja-tus-gastos-TUAPELLIDO` (debe ser único a nivel global)
3. Desactiva Google Analytics → **"Crear proyecto"**
4. Anota el **Project ID** real que te asigna Firebase (aparece bajo el nombre, ej: `maneja-tus-gastos-tuapellido`).

### 3. Instalar Firebase CLI e iniciar sesión
```bash
npm install -g firebase-tools
firebase login
```

### 4. Inicializar Hosting
```bash
cd frontend
firebase init hosting
```
Responde:
- **Project:** selecciona el que creaste
- **Public directory:** `dist/frontend/browser`
- **Single-page app (SPA):** `Yes`
- **GitHub automatic deploys:** `No` (lo haremos con Actions)
- **Overwrite index.html:** `No`

> Si el CLI no lista tu proyecto, edita manualmente `frontend/.firebaserc` con tu Project ID real:
> ```json
> { "projects": { "default": "maneja-tus-gastos-tuapellido" } }
> ```

### 5. Primer deploy manual (para verificar que todo funciona)
```bash
cd frontend
npm run build:prod
firebase deploy --only hosting
```
✅ **Checkpoint:** abre la URL que te da Firebase (`https://TU-PROYECTO.web.app`). La app debe cargar y conectarse a la API de Render.

### 6. Configurar el deploy automático (Secrets)
1. Firebase Console → ⚙️ **Configuración del proyecto → Cuentas de servicio**
2. **"Generar nueva clave privada"** → descarga el JSON
3. En GitHub → repo → **Settings → Secrets and variables → Actions**, crea:
   | Secret | Valor |
   |--------|-------|
   | `FIREBASE_SERVICE_ACCOUNT` | **todo** el contenido del JSON descargado |
   | `FIREBASE_PROJECT_ID` | tu Project ID real (ej: `maneja-tus-gastos-tuapellido`) |

✅ A partir de ahora, cada `git push` a `main` con cambios en `frontend/` despliega solo.

---

## 🔑 Resumen de Secrets de GitHub Actions

`Settings → Secrets and variables → Actions`:

| Secret | Para qué sirve | Se obtiene en |
|--------|----------------|---------------|
| `RENDER_DEPLOY_HOOK_URL` | Disparar el deploy del backend | Render → Web Service → Settings → Deploy Hook |
| `FIREBASE_SERVICE_ACCOUNT` | Autenticar el deploy del frontend | Firebase → Cuentas de servicio → Clave privada |
| `FIREBASE_PROJECT_ID` | Identificar el proyecto Firebase | Firebase → Configuración del proyecto |

---

## 📡 API REST (referencia)

Base URL local: `http://localhost:3000/api`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/expenses` | Listar todos los gastos |
| GET | `/expenses/:id` | Obtener gasto por ID |
| POST | `/expenses` | Crear nuevo gasto |
| PUT | `/expenses/:id` | Actualizar gasto |
| DELETE | `/expenses/:id` | Eliminar gasto |

**Body ejemplo (POST/PUT):**
```json
{
  "description": "Supermercado",
  "amount": 50.00,
  "category": "Alimentación",
  "date": "2026-03-08"
}
```

**Categorías válidas:**
`Alimentación` · `Transporte` · `Entretenimiento` · `Salud` · `Educación` · `Hogar` · `Otros`

---

## 🆘 ¿Algo falla?

Consulta [`docs/TROUBLESHOOTING-CHEATSHEET.md`](./docs/TROUBLESHOOTING-CHEATSHEET.md) — cubre los errores más comunes de Docker, Actions, Render y Firebase.
