# 📚 Material Educativo Completo: Docker, Compose & GitHub Actions

## 🎯 Bienvenida

¡Hola estudiantes! Este material ha sido diseñado **específicamente para ustedes** para entender:

1. **¿Por qué Docker?** — El problema que resuelve
2. **Conceptos fundamentales** — Las piezas del rompecabezas
3. **Arquitectura real** — Cómo funciona nuestro proyecto
4. **GitHub Actions** — Automatización CI/CD profesional
5. **Problemàtica técnica común** — Cómo debuggear

---

## 📖 Estructura del Material

Este material está dividido en **3 documentos principales**:

### 1️⃣ **GUIA-DOCKER-GITHUB-ACTIONS.md** (45 min)
**Versión extendida y educativa. Comienza aquí.**

Contiene:
- ✅ Concepto: ¿Por qué Docker?
- ✅ Fundamentos: Imagen vs Contenedor
- ✅ Dockerfile: Línea por línea del backend y frontend
- ✅ Docker Compose: Cómo se comunican los servicios
- ✅ GitHub Actions: Workflows profesionales
- ✅ Ejecución local: Comandos prácticos
- ✅ Mejores prácticas: Lo que el industry usa
- ✅ Ejercicios: Para practicar

**Tiempo estimado:** 45 minutos de lectura activa  
**Pre-requisitos:** Ninguno (desde cero)  
**Interactividad:** Alta (incluye ejercicios)

---

### 2️⃣ **EJEMPLOS-PRACTICOS.md** (30 min)
**12 ejemplos hands-on para implementar.**

Contiene:
- ✅ Agregar servicios (Redis, MongoDB)
- ✅ Logging centralizado
- ✅ Health checks avanzados
- ✅ GitHub Actions personalizado
- ✅ Testing con servicios reales
- ✅ Optimización de builds
- ✅ Multi-stage builds con TypeScript
- ✅ Entrypoint scripts
- ✅ Resource limits
- ✅ Docker networks avanzado
- ✅ GitHub Actions matrix

**Cuándo usar:** Después de entender lo básico  
**Dificultad:** ⭐⭐ (intermedio)  
**Formato:** Copy-paste pero ENTIENDE qué hace cada línea

---

### 3️⃣ **TROUBLESHOOTING-CHEATSHEET.md** (15 min)
**Referencia rápida: Errores comunes + comandos**

Contiene:
- ✅ 10 errores críticos con soluciones paso a paso
- ✅ Cheat sheet de comandos Docker
- ✅ Cheat sheet de comandos Docker Compose
- ✅ Debugging techniques
- ✅ Monitoreo & observabilidad
- ✅ Performance tips
- ✅ Deployment checklist

**Cuándo usar:** Cuando algo no funciona  
**Formato:** Siempre busca tu error aquí primero
**Valor:** Ahorra 2 horas de "¿por qué no funciona?"

---

## 🗺️ Roadmap Recomendado

### Día 1: Fundamentos
```
1. Lee: GUIA-DOCKER-GITHUB-ACTIONS.md (Secciones 1-4)
2. Entiende: Por qué Docker, conceptos de imagen/contenedor
3. Analiza: Dockerfile backend vs frontend (¿Cuál es más grande? ¿Por qué?)
4. Intenta: docker-compose up en tu máquina
```

### Día 2: Docker Compose & Redes
```
1. Lee: GUIA-DOCKER-GITHUB-ACTIONS.md (Secciones 5-6)
2. Entiende: Cómo se comunican backend, frontend, BD
3. Experimenta: Ejercicio 1 del cheat sheet (cambiar puerto)
4. Debuggea: docker-compose logs para ver qué pasa
```

### Día 3: GitHub Actions
```
1. Lee: GUIA-DOCKER-GITHUB-ACTIONS.md (Sección 7)
2. Analiza: Workflows del proyecto (deploy-frontend.yml, deploy-backend.yml)
3. Entiende: npm ci vs npm install (¿Por qué importante?)
4. Intenta: Haz un commit y mira GitHub Actions ejecutar
```

### Día 4: Casos Avanzados
```
1. Lee: EJEMPLOS-PRACTICOS.md (Ej. 1, 2, 5)
2. Implementa: Al menos 3 ejemplos en tu repo práctica
3. Commit: Cada cambio con mensaje claro
4. Observa: GitHub Actions pasando todos los tests
```

### Día 5: Debugging & Troubleshooting
```
1. Lee: TROUBLESHOOTING-CHEATSHEET.md
2. Memoriza: Comandos de docker-compose más comunes
3. Practica: Recrea deliberadamente 3 errores (luego arregla)
4. Prepárate: Para cuando algo no funcione en producción
```

---

## 🎓 Niveles de Aprendizaje

### Nivel 1: Constructor (Beginner)
**Objetivo:** "Puedo crear y ejecutar contenedores"

**Debes saber:**
- [ ] Qué es un Dockerfile
- [ ] Qué es docker-compose
- [ ] `docker-compose up --build`
- [ ] `docker-compose logs` para debuggear
- [ ] Diferencia entre imagen y contenedor

**Lectura:** GUIA-DOCKER-GITHUB-ACTIONS.md (Secciones 1-6)

---

### Nivel 2: Arquitecto (Intermediate)
**Objetivo:** "Puedo diseñar y modificar arquitecturas completas"

**Debes saber:**
- [ ] Multi-stage builds
- [ ] Health checks
- [ ] Volúmenes y redes
- [ ] Git workflow con Docker
- [ ] GitHub Actions workflow básico

**Lectura:** GUIA-DOCKER-GITHUB-ACTIONS.md (Completo) + EJEMPLOS-PRACTICOS.md

---

### Nivel 3: DevOps (Advanced)
**Objetivo:** "Production-ready systems"

**Debes saber:**
- [ ] Logging centralizado
- [ ] Monitoring & observability
- [ ] Resource limits
- [ ] Security best practices
- [ ] Multi-environment setup
- [ ] Matrix builds en GitHub Actions

**Lectura:** EJEMPLOS-PRACTICOS.md (Todos) + TROUBLESHOOTING-CHEATSHEET.md

---

## ❓ FAQ: Cómo Navegar Este Material

**P: "No sé por dónde empezar"**
R: Comienza con GUIA-DOCKER-GITHUB-ACTIONS.md. Está escrito como un tutorial lineal. No saltes secciones.

**P: "Tengo un error"**
R: Busca el error en TROUBLESHOOTING-CHEATSHEET.md. Si no está, busca por palabra clave.

**P: "Quiero implementar algo nuevo (Redis, logging, etc.)"**
R: Verifica si está en EJEMPLOS-PRACTICOS.md. Si no, googlea y luego documenta para compartir con clase.

**P: "Tengo poco tiempo, ¿qué debo leer?"**
R: GUIA (Secciones 1-3-4-5) + CHEATSHEET (Troubleshooting)

**P: "Esto es mucho, no puedo leerlo todo"**
R: Eso es normal. Los profesionales también usan Google. Domina los conceptos → cuando necesites detalles, busca en estos docs.

---

## 🚀 Ejercicios Prácticos Por Nivel

### ⭐ NIVEL 1: Principiante

**Ejercicio 1.1: Modificar docker-compose.yml**
```
Objetivo: Cambiar puerto backend de 3000 a 3001
Pasos:
1. Abre docker-compose.yml
2. Busca línea de "ports" en backend
3. Cambia '3000:3000' → '3001:3000'
4. docker-compose down && docker-compose up
5. ¿De qué portapuede acceder localhost?
Respuesta esperada: localhost:3001
Conceptos: Port mapping
```

**Ejercicio 1.2: Ver logs de servicio**
```
Objetivo: Debuggear con logs
Pasos:
1. En terminal 1: docker-compose up
2. En terminal 2: docker-compose logs backend
3. Haz un request: curl http://localhost:3000/api/expenses
4. ¿Qué ves en los logs?
Conceptos: Monitoring, debugging
```

**Ejercicio 1.3: Entrar a contenedor**
```
Objetivo: Ejecutar comandos dentro del contenedor
Pasos:
1. docker-compose exec backend bash
2. Dentro: ls -la (¿Dónde estás?)
3. Dentro: npm list (¿Qué packages?)
4. Dentro: env (¿Cuáles son variables?)
5. Dentro: exit (salir)
Conceptos: Container internals, variables
```

### ⭐⭐ NIVEL 2: Intermedio

**Ejercicio 2.1: Agregar un servicio Redis**
```
Objetivo: Ampliar docker-compose.yml
Referencia: EJEMPLOS-PRACTICOS.md Ejemplo 2
Pasos:
1. Copia el servicio redis de ejemplo
2. Agrega a docker-compose.yml
3. Agrega dependencia en backend
4. docker-compose up --build
5. Verifica: docker-compose ps (¿3 o 4 servicios?)
Conceptos: Service dependencies, networking
```

**Ejercicio 2.2: Entender multi-stage builds**
```
Objetivo: Analizar por qué usamos dos etapas
Referencia: GUIA Sección 4 (Dockerfile Backend)
Pasos:
1. Lee línea por línea el Dockerfile
2. Explica (en tu propia palabras):
   - ¿Qué instala etapa 1?
   - ¿Qué instala etapa 2?
   - ¿Por qué dos etapas?
3. Compara con frontend (¿Diferencias?)
Conceptos: Build optimization, image size
```

**Ejercicio 2.3: Modificar health check**
```
Objetivo: Personalizar healthcheck
Pasos:
1. En docker-compose.yml, busca healthcheck de postgres
2. Cambia interval de 10s → 5s
3. docker-compose down && docker-compose up
4. docker-compose ps (¿Qué ves?)
5. Espera 30 segundos
6. docker-compose ps (¿Cambió status?)
Conceptos: Service health, readiness probes
```

### ⭐⭐⭐ NIVEL 3: Avanzado

**Ejercicio 3.1: Escribir Dockerfile desde cero**
```
Objetivo: Crear Dockerfile completamente nuevo
Pasos:
1. Crea servicio nuevo: `scheduler/` (Node.js cron)
2. Crea Dockerfile completo:
   - Multi-stage build
   - Alpine base
   - npm ci
   - Health check
3. Agrega a docker-compose.yml
4. docker-compose up --build
5. ¿Compiled sin errores?
Conceptos: Dockerfile best practices
```

**Ejercicio 3.2: GitHub Actions workflow personalizado**
```
Objetivo: Crear workflow con notificaciones
Referencia: EJEMPLOS-PRACTICOS.md Ejemplo 3
Pasos:
1. Copia workflow ejemplo de Slack
2. Crea `.github/workflows/notify-slack.yml`
3. Configura webhook de Slack
4. Haz push
5. ¿Recibes notificación en Slack?
Conceptos: CI/CD, webhooks, notifications
```

**Ejercicio 3.3: Optimizar builds Docker**
```
Objetivo: Reducir tiempo de build
Referencia: EJEMPLOS-PRACTICOS.md Ejemplo 10
Pasos:
1. Ejecuta `time docker build .` en backend (nota tiempo)
2. Modifica Dockerfile (cambiar orden copiar)
3. docker build --no-cache . (limpia caché)
4. Ejecuta `time docker build .` (nota nuevo tiempo)
5. Modifica backend/src/app.js
6. Ejecuta `time docker build .` (¿Mais rápido ahora?)
Conceptos: Docker layer caching, build optimization
```

---

## 💼 Competencias Profesionales

Al completar este material, tendrás competencias que el industry valora:

| Competencia | Mercado Value | Dificultad | Material |
|---|---|---|---|
| Containerizar apps | ⭐⭐⭐⭐⭐ | Fácil | GUIA 1-4 |
| Orquestar servicios | ⭐⭐⭐⭐⭐ | Media | GUIA 5-6 |
| CI/CD automation | ⭐⭐⭐⭐⭐ | Media | GUIA 7 |
| Troubleshooting | ⭐⭐⭐⭐ | Fácil | CHEATSHEET |
| Optimización de builds | ⭐⭐⭐⭐ | Difícil | EJEMPLOS 10 |
| Production deployment | ⭐⭐⭐⭐⭐ | Muy Difícil | EJEMPLOS 1-12 |

---

## 🎯 Objetivos Finales

### Después de Semana 1
✅ Entiendes por qué Docker (problema resuelto)  
✅ Puedes escribir un Dockerfile simple  
✅ Sabes qué hace docker-compose up  

### Después de Semana 2
✅ Entiendes cómo se comunican contenedores  
✅ Puedes debuggear con logs  
✅ Entiendes GitHub Actions básico  

### Después de Semana 3
✅ Writes dockerfiles production-ready  
✅ Diseñas arquitecturas multi-servicio  
✅ Entiendes CI/CD completo  
✅ Sabes optimizar para production  

---

## 📞 Ayuda & Soporte

### Cuando Algo No Funciona

**1. Primero busca en:**
```
TROUBLESHOOTING-CHEATSHEET.md → Sección "Matrix de Errores"
```

**2. Luego intenta:**
```bash
docker-compose logs -f
# Busca "Error", "Failed", "ECONNREFUSED"
```

**3. Si sigue sin funcionar:**
```bash
# Comparte esto:
docker-compose ps
docker-compose config
docker-compose logs | head -100
```

**4. Pide ayuda con contexto:**
```
"Ejecuté X, esperaba Y, pero pasó Z.
Error: [copiar exacto del output]
Sistema: [Mac/Windows/Linux]
Versión Docker: [docker --version]"
```

---

## 🏆 Certificaciones Relacionadas

Con el conocimiento de este material puedes prepararte para:

- 🎓 **Docker Certified Associate (DCA)** - Docker Official
- 🎓 **Kubernetes Administrator (CKA)** - CNCF (nivel avanzado)
- 🎓 **AWS Solutions Architect** - Amazon (CI/CD focus)
- 🎓 **GitOps Fundamentals** - Linux Foundation

---

## 📈 Trayectoria Profesional

```
Junior (Docker Basics)
    ↓ (3-6 meses)
Intermediate (Kubernetes, Advanced CI/CD)
    ↓ (1-2 años)
Senior DevOps (Architecture, Mentoring)
    ↓ (3+ años)
Staff/Principal (Strategy, Investment)
```

**Sueldo promedio (2025):**
- Junior DevOps: $60-80k USD/año
- Senior DevOps: $120-160k USD/año
- Staff DevOps: $160-220k USD/año

---

## ✅ Antes de Culminar

Verifica que puedes responder:

1. **"¿Por qué Docker?"**
   - Respuesta: Envuelve app + dependencias → reproducibilidad

2. **"Diferencia imagen vs container"**
   - Respuesta: Imagen = template, Contenedor = instancia (como clase vs objeto)

3. **"¿Qué hace docker-compose?"**
   - Respuesta: Orquesta múltiples contenedores, define redes, volúmenes

4. **"¿Por qué multi-stage builds?"**
   - Respuesta: Primera etapa compila, segunda descarta lo innecesario → imagen pequeña

5. **"¿Qué es CI/CD?"**
   - Respuesta: Automatiza testing y deployment → confiable, consistente

6. **"¿Cuándo usar healthchecks?"**
   - Respuesta: Para que otros servicios esperen a que esté listo

7. **"¿Paso a paso del proyecto?"**
   - Respuesta: Code → Dockerfile → docker-compose → GitHub → Actions → Deploy

Si respondiste todas correctamente → **¡Felicidades! 🎉 Entiendes Docker & DevOps!**

---

## 🚀 Próximos Pasos

### Inmediato (Este Mes)
- [ ] Lee todo el material
- [ ] Implementa todos los ejemplos
- [ ] Practica troubleshooting

### Corto Plazo (Próximos 3 Meses)
- [ ] Containeriza tu proyecto personal
- [ ] Deploy a Render, AWS, Google Cloud
- [ ] Contribuye a proyecto open-source con Docker

### Largo Plazo (Próximos 12 Meses)
- [ ] Aprende Kubernetes
- [ ] Especialízate en DevOps/SRE
- [ ] Busca trabajo como DevOps Junior

---

## 📚 Índice de Archivos Educativos

| Archivo | Propósito | Tiempo | Dificultad |
|---------|-----------|--------|-----------|
| GUIA-DOCKER-GITHUB-ACTIONS.md | Tutorial completo | 45 min | ⭐⭐ |
| EJEMPLOS-PRACTICOS.md | Casos reales | 30 min | ⭐⭐⭐ |
| TROUBLESHOOTING-CHEATSHEET.md | Referencia rápida | 15 min | ⭐ |

---

## 📝 Feedback & Mejoras

¿Encontraste un error en este material? ¿Quieres sugerir cambios?

```
Por favor crea un issue o envía un pull request:
https://github.com/tu-usuario/maneja-tus-gastos/issues
```

Este material se mantiene actualizado según:
- Feedback de estudiantes
- Cambios en Docker/GitHub
- Nuevas best practices

---

**Creado con ❤️ para la educación en DevOps**

Última actualización: Marzo 2025  
Versión: 1.0  
Licencia: CC BY-SA (Compartir, modificar, atribuir)

---

## 🎓 Créditos Educativos

Material diseñado para enseñar:
- Containerización moderna
- Orquestación de servicios
- CI/CD automation
- Production deployment
- DevOps best practices

Basado en:
- Casos reales de industria
- Docker Official documentation
- CNCF best practices
- Experiencia pedagogía

---

## 🌟 Éxito a Todos

> "La mejor manera de aprender a programar es PROGRAMANDO.
> La mejor manera de aprender DevOps es DEPLOYANDO."

¡Adelante! Ya tienen todo lo necesario. 🚀
