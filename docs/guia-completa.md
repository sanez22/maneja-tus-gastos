
# ✅ Proyecto Completo: "Maneja tus Gastos"

## 📁 Estructura del Monorepo

```
maneja-tus-gastos/
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml   ← CI/CD Angular → Firebase
│       └── deploy-backend.yml    ← CI/CD Node.js → Render.com
├── frontend/                     ← Angular 19
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.component.ts          ← Componente raíz (CRUD completo)
│   │   │   ├── app.component.spec.ts     ← Tests del componente
│   │   │   ├── app.config.ts             ← provideHttpClient
│   │   │   ├── components/
│   │   │   │   ├── expense-form/         ← Formulario crear/editar
│   │   │   │   └── expense-list/         ← Tabla con acciones
│   │   │   ├── models/
│   │   │   │   └── expense.model.ts      ← Interface Expense
│   │   │   └── services/
│   │   │       ├── expense.service.ts    ← HTTP calls al backend
│   │   │       └── expense.service.spec.ts ← 3 unit tests
│   │   ├── environments/
│   │   │   ├── environment.ts            ← API local (localhost:3000)
│   │   │   └── environment.prod.ts       ← API Render.com URL
│   │   ├── index.html
│   │   └── styles.css
│   ├── Dockerfile                ← Multi-stage: Node build + nginx serve
│   ├── nginx.conf                ← SPA routing + gzip + cache
│   ├── firebase.json             ← Hosting config (dist/frontend/browser)
│   ├── .firebaserc               ← Project ID Firebase
│   ├── angular.json
│   ├── karma.conf.js
│   └── package.json
├── backend/                      ← Node.js + Express + Sequelize
│   ├── src/
│   │   ├── app.js                ← Express app + sync DB
│   │   ├── db/index.js           ← Conexión Sequelize (local + prod)
│   │   ├── models/expense.js     ← Modelo Sequelize (7 categorías)
│   │   ├── controllers/
│   │   │   └── expensesController.js ← GET, POST, PUT, DELETE
│   │   └── routes/expenses.js    ← Router Express
│   ├── tests/
│   │   └── expenses.test.js      ← 5 tests Jest + Supertest (DB mockeada)
│   ├── Dockerfile                ← Multi-stage node:20-alpine
│   ├── jest.config.js
│   ├── .env.example
│   └── package.json
├── docker-compose.yml            ← postgres + backend + frontend
├── .gitignore
└── README.md                     ← Guía completa integrada
```

---

## 🐳 Levantar en local (Docker)

```bash
# 1. Clonar el repo
git clone https://github.com/TU_USUARIO/maneja-tus-gastos.git
cd maneja-tus-gastos

# 2. Copiar variables de entorno
cp backend/.env.example backend/.env

# 3. Levantar todo
docker-compose up --build
```

| Servicio    | URL                          |
|-------------|------------------------------|
| 🌐 Frontend | http://localhost:4200        |
| ⚙️ Backend  | http://localhost:3000        |
| ❤️ Health   | http://localhost:3000/health |

```bash
# Bajar contenedores
docker-compose down

# Bajar + borrar volumen de DB
docker-compose down -v
```

---

## 🧪 Correr Tests localmente

```bash
# Backend (Jest + Supertest — sin DB real)
cd backend
npm install
npm test

# Frontend (Karma + Jasmine)
cd frontend
npm install
npm test
```

---

## 🔥 PASO A PASO: Firebase Hosting

### Paso 1 — Crear proyecto Firebase
1. Ir a https://console.firebase.google.com
2. **"Agregar proyecto"** → Nombre: `maneja-tus-gastos`
3. Desactivar Google Analytics → **"Crear proyecto"**

### Paso 2 — Instalar Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### Paso 3 — Inicializar Hosting
```bash
cd frontend
```
- "default": "maneja-tus-gastos" modificar esto en .firebaserc

```bash
firebase init hosting
```

Responder:
- **Project**: seleccionar `maneja-tus-gastos`
- **Public directory**: `dist/frontend/browser`
- **Single-page app**: `Yes`
- **GitHub automatic deploys**: `No`
- **Overwrite index.html**: `No`

Si no funciona el paso anterior modificar el archivo `.firebaserc` con lo siguiente

```
{
  "projects": {
    "default": "maneja-tus-gastos-[su apellido]"
  }
}

```

Esto actualiza `.firebaserc` con tu project ID real.

### Paso 4 — Service Account para GitHub Actions
- Ir a agregar app
- Poner el mismo nombre del proyecto
-  todo siguiente y siguiente hasta ir a consola

1. Firebase Console → ⚙️ **Configuración del proyecto** → **Cuentas de servicio**
2. **"Generar nueva clave privada"** → descarga el JSON
3. GitHub repo → **Settings → Secrets and variables → Actions → New secret**:
    - `FIREBASE_SERVICE_ACCOUNT` → pegar contenido completo del JSON
    - `FIREBASE_PROJECT_ID` → ej: `maneja-tus-gastos-abc12`

### Paso 5 — Actualizar URL del backend en producción
Editar `frontend/src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://TU-SERVICIO.onrender.com', // ← URL de Render
};
```

### Paso 6 — Primer deploy manual (opcional)
```bash
cd frontend
npm run build:prod
firebase deploy --only hosting
```

### ✅ Deploy automático
A partir de ahora, cada `git push` a `main` con cambios en `frontend/` dispara el workflow automáticamente.

---

## 🟢 PASO A PASO: Render.com

### Paso 1 — Crear cuenta
Ir a https://render.com → **Sign up with GitHub**

### Paso 2 — Crear PostgreSQL
1. Dashboard → **New → PostgreSQL**
2. Nombre: `gastos-db` | Plan: **Free** → **Create Database**
3. Copiar la **"External Database URL"** (la necesitarás en el paso 3)

### Paso 3 — Crear Web Service
1. Dashboard → **New → Web Service**
2. Conectar tu repositorio de GitHub
3. Configurar:
    - **Name**: `maneja-tus-gastos-api`
    - **Root Directory**: `backend`
    - **Runtime**: `Docker` ← usa tu Dockerfile
    - **Plan**: **Free**
4. **Environment Variables**:
    - `DATABASE_URL` → pegar la URL de PostgreSQL del paso 2
    - `NODE_ENV` → `production`
    - `PORT` → `3000`
5. **Create Web Service** → esperar ~5 min
6. Copiar la URL del servicio: `https://maneja-tus-gastos-api.onrender.com`

### Paso 4 — Deploy Hook para GitHub Actions
1. Web Service → **Settings → Deploy Hook**
2. Copiar la URL (algo como `https://api.render.com/deploy/srv-xxx?key=yyy`)
3. GitHub repo → **Settings → Secrets → New secret**:
    - `RENDER_DEPLOY_HOOK_URL` → pegar la URL

### Paso 5 — Actualizar URL en el frontend
Usar la URL del paso 3 en `environment.prod.ts` (ver Paso 5 de Firebase).

### ✅ Deploy automático
Cada `git push` a `main` con cambios en `backend/` dispara el workflow.

> ⚠️ **Nota para alumnos**: El free tier de Render "duerme" el servicio
> tras 15 min de inactividad. La primera request puede tardar ~30 seg.

---

## ⚙️ GitHub Actions — Resumen de Secrets

| Secret | Para qué sirve |
|--------|---------------|
| `FIREBASE_SERVICE_ACCOUNT` | Autenticar deploy a Firebase Hosting |
| `FIREBASE_PROJECT_ID` | Identificar el proyecto Firebase |
| `RENDER_DEPLOY_HOOK_URL` | Disparar deploy en Render.com |

---

## 📡 API REST — Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/expenses` | Listar todos los gastos |
| GET | `/api/expenses/:id` | Obtener gasto por ID |
| POST | `/api/expenses` | Crear nuevo gasto |
| PUT | `/api/expenses/:id` | Actualizar gasto |
| DELETE | `/api/expenses/:id` | Eliminar gasto |

**Body ejemplo:**
```json
{
  "description": "Supermercado",
  "amount": 50.00,
  "category": "Alimentación",
  "date": "2026-03-08"
}
```
