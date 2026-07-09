# 👨‍🏫 Guía Docente - Proyecto "Maneja Tus Gastos"

---

## 📊 Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (NAVEGADOR)                      │
│              Aplicación Angular Standalone                      │
│          (Componentes reactivos, standalone components)         │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP REST API
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND APIs                              │
│         Node.js/Express + CORS + Validation                    │
│         Rutas: GET, POST, PUT, DELETE /api/expenses             │
└────────────────────┬────────────────────────────────────────────┘
                     │ SQL Queries
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BASE DE DATOS                                  │
│             PostgreSQL 16 Alpine Docker                        │
│          Tabla: expenses (id, amount, date, etc)               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT                                  │
│    Frontend: Firebase Hosting (CDN global, HTTPS automático)   │
│    Backend: Render.com (hosteado, auto-deploya con GitHub)    │
│    CI/CD: GitHub Actions (test → build → deploy automático)    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 FRONTEND: Angular 19 + Firebase

### 1. Estructura

```
frontend/
├── src/
│   ├── main.ts                    # Entrada (bootstrap)
│   ├── app/
│   │   ├── app.component.ts       # Componente root
│   │   ├── app.config.ts          # Providers, config
│   │   ├── components/
│   │   │   ├── expense-form/      # Formulario crear/editar
│   │   │   └── expense-list/      # Tabla de gastos
│   │   ├── services/
│   │   │   └── expense.service.ts # Llamadas API
│   │   └── models/
│   │       └── expense.model.ts   # Interfaz Expense
│   ├── environments/              # Config por ambiente
│   │   ├── environment.ts         # Desarrollo
│   │   └── environment.prod.ts    # Producción (Firebase)
│   └── styles.css
├── Dockerfile                      # Multi-stage: Node + Nginx
├── nginx.conf                      # Config servidor web
├── firebase.json                   # Config Firebase Hosting
├── package.json
└── angular.json
```

### 2. Conceptos Clave: Standalone Components

**¿Qué es standalone?**
Angular 14+ permite componentes independientes (sin NgModule).

**Anterior (Module-based):**
```typescript
// app.module.ts
@NgModule({
  declarations: [AppComponent],
  imports: [CommonModule, FormsModule]
})
export class AppModule {}
```

**Ahora (Standalone - Mejor):**
```typescript
// app.component.ts
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],  // ← Define dependencias aquí
  template: `...`
})
export class AppComponent {}
```

**Ventajas:**
- No necesita NgModule
- Más pequeño el bundle (~30% menos)
- Más fácil de razonar (dependencias locales)
- Mejor para componentes reutilizables

### 3. Flujo de Datos: Expense Form → Service → API → BD

**Componente Form (crear/editar gasto):**
```typescript
// expense-form.component.ts
@Component({ standalone: true })
export class ExpenseFormComponent {
  form = this.fb.group({
    amount: ['', [Validators.required, Validators.min(0)]],
    category: ['', Validators.required],
    date: [new Date()]
  });

  constructor(private expenseService: ExpenseService) {}

  onSubmit() {
    if (this.form.valid) {
      const data = this.form.value;
      this.expenseService.createExpense(data).subscribe(
        (response) => console.log('✅ Creado:', response),
        (error) => console.error('❌ Error:', error)
      );
    }
  }
}
```

**Service (llamadas API):**
```typescript
// expense.service.ts
@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private apiUrl = environment.apiUrl + '/api/expenses';

  constructor(private http: HttpClient) {}

  createExpense(expense: Expense): Observable<Expense> {
    return this.http.post<Expense>(this.apiUrl, expense);
  }

  getExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(this.apiUrl);
  }

  updateExpense(id: number, expense: Expense): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/${id}`, expense);
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

**Modelo:**
```typescript
// expense.model.ts
export interface Expense {
  id?: number;
  amount: number;
  category: string;
  date: Date;
  description?: string;
}
```

### 4. Integración Firebase

**firebase.json (Hosting config):**
```json
{
  "hosting": {
    "public": "dist/frontend/browser",  // Carpeta compilada
    "rewrites": [
      { "source": "**", "destination": "/index.html" }  // SPA routing
    ]
  }
}
```

**Component usando Firebase Auth (futuro):**
```typescript
// app.component.ts (si agregan autenticación)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  projectId: "tu-proyecto",
  // ...
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
```

**Flujo Firebase:**
```
1. npm run build:prod
   ↓ Compila Angular → carpeta dist/frontend/browser
   
2. firebase deploy
   ↓ Sube archivos a Firebase Hosting
   
3. Automático: Obtiene HTTPS, CDN global, certificado SSL
   ↓
4. Accesible en: https://tu-proyecto.web.app
```

### 5. Diferencia: Desarrollo vs Producción

**environment.ts (desarrollo):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'  // Backend local
};
```

**environment.prod.ts (Firebase):**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.render.com'  // Backend hostdeado (Render)
};
```

**Build automático usa correcto:**
```bash
# Desarrollo
ng serve  # Usa environment.ts

# Producción
ng build --configuration production  # Usa environment.prod.ts
```
---

## 🔧 BACKEND: Node.js/Express + PostgreSQL

### 1. Estructura

```
backend/
├── src/
│   ├── app.js                      # Express app setup
│   ├── db/
│   │   └── index.js                # Conexión PostgreSQL (Sequelize)
│   ├── models/
│   │   └── expense.js              # Modelo ORM Sequelize
│   ├── controllers/
│   │   └── expensesController.js   # Lógica de rutas
│   ├── routes/
│   │   └── expenses.js             # Definición de rutas
│   └── tests/
│       └── expenses.test.js        # Tests Jest
├── Dockerfile                       # Multi-stage build
├── package.json
└── .env                            # Variables de entorno
```

### 2. Creación Automática de Base de Datos

**¿Cómo se crea la base de datos?** Es un proceso automático de 4 pasos cuando ejecutas `docker-compose up`:

#### Paso 1️⃣: PostgreSQL Crea Base (contenedor postgres)
```yaml
# docker-compose.yml
postgres:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: gastos_db      # ← Auto-crea DB vacía al iniciar
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
  volumes:
    - postgres_data:/var/lib/postgresql/data  # ← Persiste datos
```
**Resultado:** Contenedor PostgreSQL inicia y crea automáticamente `gastos_db` (base de datos vacía).

#### Paso 2️⃣: Backend Conecta (db/index.js)
```javascript
// backend/src/db/index.js
const sequelize = new Sequelize(
  process.env.DB_NAME || 'gastos_db',         // Nombre BD
  process.env.DB_USER || 'postgres',          // Usuario
  process.env.DB_PASS || 'postgres',          // Contraseña
  {
    host: process.env.DB_HOST || 'postgres',  // Host servicio Docker
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres'
  }
);

module.exports = sequelize;
```
**Resultado:** Sequelize se conecta a `postgres:5432/gastos_db` usando credenciales del `.env`.

#### Paso 3️⃣: Define Estructura (models/expense.js)
```javascript
// backend/src/models/expense.js
const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  description: { type: DataTypes.STRING(255), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  category: { 
    type: DataTypes.ENUM('Comida', 'Transporte', 'Ocio', 'Otros'), 
    allowNull: false, 
    defaultValue: 'Otros' 
  },
  date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW }
}, { 
  tableName: 'expenses',
  timestamps: true  // Agrega createdAt, updatedAt automáticamente
});

module.exports = Expense;
```
**Resultado:** Define estructura de tabla, pero NO la crea aún.

#### Paso 4️⃣: Crea/Actualiza Tabla (app.js)
```javascript
// backend/src/app.js
const express = require('express');
const sequelize = require('./db');

const app = express();

// ← ESTO ES LO IMPORTANTE:
if (process.env.NODE_ENV !== 'test') {
  sequelize.sync({ alter: true })  // ← Crea tabla si no existe
    .then(() => {
      console.log('✅ Base de datos sincronizada');
      app.listen(PORT, () => {
        console.log(`🚀 Backend escuchando en puerto ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ Error conectando BD:', err);
      process.exit(1);
    });
}
```

**`sequelize.sync({ alter: true })` hace:**
- Comprueba si tabla `expenses` existe
- Si NO existe → la crea con estructura del modelo
- Si existe → actualiza columnas (útil en desarrollo)

#### Visualización del Flujo Completo

```
docker-compose up
    ↓
[1] PostgreSQL inicia
    └→ Crea: gastos_db (vacía)
    
[2] Backend inicia
    └→ db/index.js conecta a postgres:5432/gastos_db
    
[3] Backend carga modelos
    └→ models/expense.js define: 8 campos + tabla 'expenses'
    
[4] Backend ejecuta app.js
    └→ sequelize.sync() verifica/crea tabla expenses
       └→ CREATE TABLE expenses (
          id SERIAL PRIMARY KEY,
          description VARCHAR(255) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          category ENUM NOT NULL DEFAULT 'Otros',
          date DATE NOT NULL DEFAULT NOW(),
          createdAt TIMESTAMP,
          updatedAt TIMESTAMP,
          ...
       );
       └→ ✅ Tabla lista para recibir datos
```

#### Verificar Que Funcionó

```bash
# Acceso a contenedor PostgreSQL
docker-compose exec postgres psql -U postgres -d gastos_db

# Una vez dentro (prompt=gastos_db=#):
\dt                          # Lista todas las tablas
                             # Resultado: expenses ← ✅ creada

\d expenses                  # Ver estructura completa
                             # Muestra 8 columnas

SELECT * FROM expenses;      # Ver datos
                             # Vacío inicialmente ✅

\q                           # Salir de psql
```

#### Persistencia: La Carpeta `postgres_data`

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```

- **En `docker-compose up`:** Datos se guardan en `postgres_data/`
- **Si haces `docker-compose down`:** Contenedor se detiene pero carpeta `postgres_data/` persiste
- **Si haces `docker-compose up` nuevamente:** PostgreSQL reutiliza datos existentes (tabla ya existe, no se recrea)
- **Si haces `docker-compose down -v`:** Elimina todo incluyendo `postgres_data/` → próximo up es como la primera vez (tabla vacía)

#### Notas importantes

| Concepto | Enseñanza |
|----------|-----------|
| **POSTGRES_DB en docker-compose** | "Esto dice a PostgreSQL qué BD crear al iniciar" |
| **db/index.js (Sequelize)** | "Aquí nos conectamos a la BD, como un 'puente' entre Node y BD" |
| **models/expense.js** | "Definimos cómo se ven nuestros datos (campos, tipos, validaciones)" |
| **sequelize.sync()** | "Esto 'traduce' nuestro modelo a tabla SQL real en la BD" |
| **postgres_data volume** | "Sin esto, cada `docker-compose down` borra datos. Con esto, persisten" |
| **{alter: true}** | "Permite cambiar modelo en desarrollo sin perder datos" |

---

### 4. Flujo Request → Response

**Cliente (Frontend):**
```
POST /api/expenses
{
  "amount": 50,
  "category": "Comida",
  "date": "2025-03-09"
}
```

**Express Router (routes/expenses.js):**
```javascript
const router = express.Router();

router.post('/', expensesController.createExpense);
router.get('/', expensesController.getExpenses);
router.put('/:id', expensesController.updateExpense);
router.delete('/:id', expensesController.deleteExpense);

module.exports = router;
```

**Controlador (controllers/expensesController.js):**
```javascript
exports.createExpense = async (req, res) => {
  try {
    const { amount, category, date } = req.body;
    
    // Validación
    if (!amount || !category) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    
    // Crear en BD
    const expense = await Expense.create({
      amount,
      category,
      date: date || new Date()
    });
    
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Modelo (models/expense.js - Sequelize ORM):**
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Expense;
```

**Base de datos (db/index.js - Sequelize):**
```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
);

module.exports = sequelize;
```

### 5. CORS: Permitir Llamadas desde Frontend

**Frontend intenta acceder:** `https://expenses.web.app` → `http://localhost:3000`
**CORS bloquea por defecto** (seguridad)

**Solución en Express:**
```javascript
const cors = require('cors');

// Permitir solo dominio específico (producción)
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:4200'
}));

// O permitir todos (desarrollo)
app.use(cors());
```

### 6. Variables de Entorno

**.env (no versionar):**
```
NODE_ENV=production
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=gastos_db
DB_USER=postgres
DB_PASS=postgres
ALLOWED_ORIGIN=https://expenses.web.app
```

**Uso en código:**
```javascript
const PORT = process.env.PORT || 3000;
const dbName = process.env.DB_NAME;
```

### 7. Testing con Jest

**expenses.test.js:**
```javascript
describe('Expenses API', () => {
  test('POST /api/expenses crea nuevo gasto', async () => {
    const response = await request(app)
      .post('/api/expenses')
      .send({ amount: 50, category: 'Food' });
    
    expect(response.status).toBe(201);
    expect(response.body.amount).toBe(50);
  });

  test('GET /api/expenses retorna lista', async () => {
    const response = await request(app).get('/api/expenses');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

**Ejecutar tests:**
```bash
npm test
# En Docker:
docker-compose exec backend npm test
```

### 8. Health Check para Monitoreo

```javascript
// app.js
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});
```

**Uso:** GitHub Actions y monitoring servicios verifican este endpoint.

---

## 🐳 DOCKER: Containerización Local

### 1. ¿Por qué Docker?

**Sin Docker:**
```
Dev entiende:  Ubuntu 22, Node 20, PostgreSQL 14, npm 9
Compañero:     Windows 11, Node 18, PostgreSQL 15, npm 8
Producción:    CentOS 7, Node 19, PostgreSQL 13
Resultado:     "¡En mi máquina funciona!" ☠️
```

**Con Docker:**
```
TODO en contenedor:  Mismo OS, mismo Node, mismo npm, mismo PostgreSQL
Resultado:           Funciona igualmente en todo lado ✅
```

### 2. Los 3 Usos de Docker en el Proyecto

Docker no solo es para local. Está presente en **3 niveles**:

#### 🖥️ Local Development (`docker-compose.yml`)
```bash
docker-compose up --build
```
Levanta 3 servicios en tu máquina:
- **postgres**: base de datos PostgreSQL 16
- **backend**: Node.js/Express API local
- **frontend**: Angular + Nginx local

Ambiente: `http://localhost:4200` (frontend) ↔ `http://localhost:3000` (backend)

#### ✅ GitHub Actions (CI/CD Validation)
```yaml
# En deploy-backend.yml
- run: docker build -t backend:latest .
  working-directory: backend
```

**Propósito:** Validar que el Dockerfile compila sin errores
- Compila imagen Docker
- Verifica sintaxis y dependencias
- Si falla → rechaza el push
- Si pasa → continúa workflow

**NO pushea** a ningún registro (es solo validación).

#### 🚀 Producción (Render.com - Backend)
```
Tu repo (push)
    ↓
GitHub Actions (CI: valdación + webhook)
    ↓
Render.com detecta cambios
    ↓
Render: docker build + docker run
    ↓
Backend corriendo 24/7 en producción ✅
    ↓ 
API disponible en: https://api.render.com
```

Render automáticamente:
1. Detecta `Dockerfile` en repo
2. Ejecuta `docker build` en su infraestructura
3. Corre el contenedor resultante
4. Expone en URL pública con HTTPS

#### 📋 Tabla Resumen

| Nivel | ¿Usa Docker? | Herramienta | Propósito |
|-------|-------------|-------------|----------|
| **Local** | ✅ | docker-compose | Desarrollo: BD + backend + frontend juntos |
| **CI/CD** | ✅ | GitHub Actions | Validar Dockerfile compila (no pushea) |
| **Producción Backend** | ✅ | Render.com | Ejecutar contenedor 24/7 en la nube |
| **Producción Frontend** | ❌ | Firebase Hosting | Solo archivos estáticos (sin Docker) |

**Nota:** El frontend NO usa Docker en producción porque Firebase Hosting solo sirve archivos estáticos compilados (HTML/CSS/JS).

---

### 3. docker-compose.yml: Three Services

**postgres (base de datos):**
```yaml
postgres:
  image: postgres:16-alpine  # Descargar BD lista
  environment:
    POSTGRES_PASSWORD: postgres
    POSTGRES_DB: gastos_db
  volumes:
    - postgres_data:/var/lib/postgresql/data  # Persiste datos
  healthcheck:
    test: ['CMD-SHELL', 'pg_isready -U postgres']
```

**backend (Node.js/Express):**
```yaml
backend:
  build:                        # Compila desde Dockerfile
    context: ./backend
  environment:
    DB_HOST: postgres           # Nombre del servicio en red Docker
    DB_PORT: 5432
    DB_NAME: gastos_db
  depends_on:
    postgres:
      condition: service_healthy  # Espera a que BD esté lista
  volumes:
    - ./backend/src:/app/src    # Hot-reload en desarrollo
  ports:
    - '3000:3000'              # Mapeo puerto host:contenedor
```

**frontend (Angular + Nginx):**
```yaml
frontend:
  build:
    context: ./frontend
  ports:
    - '4200:80'               # Acceso via localhost:4200
  depends_on:
    - backend
```

### 4. Dockerfile Backend: Multi-stage

**Etapa 1 (Build):**
```dockerfile
FROM node:20-alpine AS builder
COPY package*.json ./
RUN npm ci                    # Instala dependencias exactas
COPY src ./src
# build es automático en Node, solo copia src
```

**Etapa 2 (Producción):**
```dockerfile
FROM node:20-alpine
RUN npm ci --omit=dev         # Solo dependencias runtime
COPY --from=builder /app/src ./src
EXPOSE 3000
CMD ["node", "src/app.js"]
```

**¿Por qué dos etapas?**
- Etapa 1: Necesita npm, git, herramientas build
- Etapa 2: Descarta todo → imagen 60% más pequeña

### 5. Dockerfile Frontend: Node + Nginx

**Etapa 1 (Build Angular):**
```dockerfile
FROM node:20-alpine AS builder
RUN npm install --legacy-peer-deps
RUN npx ng build --configuration development
# Resultado: dist/frontend/browser/ con HTML/CSS/JS
```

**Etapa 2 (Servir con Nginx):**
```dockerfile
FROM nginx:alpine
COPY dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
```

**¿Por qué Nginx?**
- Frontend = archivos estáticos (HTML, CSS, JS)
- Node.js es overkill (para apps dinámicas)
- Nginx = 10x más rápido, 10x menos memoria

### 6. Comandos Esenciales

```bash
# Arrancar todo
docker-compose up --build

# Ver logs
docker-compose logs -f backend    # Backend en vivo
docker-compose logs postgres      # BD

# Entrar a contenedor
docker-compose exec backend bash
docker-compose exec postgres psql -U postgres

# Ejecutar tests
docker-compose exec backend npm test

# Parar todo
docker-compose down

# Parar + eliminar datos
docker-compose down -v
```
---

## 🚀 GITHUB ACTIONS: CI/CD Automatizado

### 1. ¿Qué es CI/CD?

```
Haces push código
    ↓
GitHub detecta cambios
    ↓
CI (Continuous Integration):
  - npm ci (instalar dependencias exactas)
  - npm test (correr pruebas)
  - npm run build (compilar)
    ↓
¿Pasó todo? 
  - SÍ → CD (Continuous Deployment): push automático a producción ✅
  - NO → Rechaza el deploy, brinda errores ❌
```

### 2. Frontend Workflow: deploy-frontend.yml

```yaml
name: 🚀 Deploy Frontend → Firebase Hosting

on:
  push:
    branches: [main]
    paths: ['frontend/**']  # Solo si cambias frontend

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      # 1. Descargar código desde GitHub
      - uses: actions/checkout@v4

      # 2. Instalar Node.js 20
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      # 3. npm ci (clean install = reproducible)
      - run: npm ci
        working-directory: frontend

      # 4. npm test (frena deploy si test falla)
      - run: npm test -- --watch=false --browsers=ChromeHeadless
        working-directory: frontend

      # 5. ng build --configuration production
      - run: npm run build:prod
        working-directory: frontend

      # 6. Deploy a Firebase (artefacto de build)
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: tu-proyecto
```

**Flujo:**
```
1. npm ci instala exactamente versiones en package-lock.json
   ↓ (Si falla → detiene)
2. npm test ejecuta tests (Jasmine + Karma)
   ↓ (Si alguno falla → rechaza)
3. npm run build:prod compila TypeScript + minificar
   ↓ (Si error compilación → rechaza)
4. Firebase deploy sube archivos compilados
   ↓ ✅ EN PRODUCCIÓN
```

### 3. Backend Workflow: deploy-backend.yml

```yaml
name: 🚀 Deploy Backend → Render.com

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      # Tests backend: Jest
      - run: npm test
        working-directory: backend

      # Build Docker image (valida Dockerfile compila)
      - run: docker build -t backend:latest .
        working-directory: backend

      # Deploy a Render (via webhook)
      - run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
```

**Flujo:**
```
1. npm ci → npm test (Jest)
   ↓ (Si falla → rechaza)
2. docker build (valida que Dockerfile compila)
   ↓ (Si error → rechaza)
3. curl webhook a Render
   ↓ ✅ Render detecta push automático → redeploya
```

### 4. Secrets: Variables Protegidas

**En GitHub (Settings → Secrets):**
```
FIREBASE_SERVICE_ACCOUNT  = JSON credential (no mostrar)
FIREBASE_PROJECT_ID       = tu-proyecto
RENDER_DEPLOY_HOOK_URL    = URL webhook Render
```

**En workflow usan:**
```yaml
${{ secrets.FIREBASE_SERVICE_ACCOUNT }}  # No aparece en logs
```

---

## 💻 Comandos Esenciales Estudiantes

```bash
# Frontend local
cd frontend
npm install --legacy-peer-deps
npm start  # localhost:4200

# Backend local
cd backend
npm install
npm start  # localhost:3000

# Full project Docker
docker-compose up --build

# Testing
docker-compose exec backend npm test
docker-compose exec frontend npm test

# Debugging
docker-compose logs -f backend
docker-compose exec backend bash

# Deploy local
npm run build:prod

# Deploy producción
git push  # GitHub Actions se encarga
```

---


