# Benzan Auto - Audit Production Hardening

## Objetivo
Ejecutar la auditoria y el endurecimiento del portal con metodologia controlada, sin tocar `main` directamente y sin hacer cambios improvisados sobre produccion.

Esta Fase 0 deja:
- baseline tecnico reproducible
- reglas de trabajo
- evidencia de build, smoke y audit
- revision inicial de variables
- checklist de rutas, endpoints, formularios y flujos criticos
- matriz simple de riesgos
- backlog priorizado por fases

## Reglas activas de esta auditoria
- Rama de trabajo: `audit/production-hardening`
- Rama protegida de referencia: `main`
- Produccion: no intervenida directamente en esta fase
- Dominio final del cliente: pendiente, no bloquea el avance
- Toda URL publica, origin y configuracion de despliegue debe salir de variables de entorno

## Baseline del repositorio
- Fecha baseline: `2026-06-28`
- Rama baseline: `audit/production-hardening`
- Commit base: `7dded07b4dc35e53df45d31e99f1d341d8d4a495`
- Estado inicial del arbol antes de esta documentacion: limpio

### Ultimos commits observados
1. `7dded07` fix: redirect forced password changes to dashboard
2. `d0d7780` fix: clarify admin user validation errors
3. `0c4871a` fix: regenerate backend lockfile for railway
4. `4b81910` feat: harden admin auth and recovery flows
5. `977ab81` Fix public inventory request loop and rate limiting
6. `7609fed` Fix publish state and public vehicle visibility
7. `725c614` Harden admin publish auth flow
8. `455c43d` Fix admin image upload state handling

## Stack actual identificado

### Frontend
- Vite
- React 18
- React Router DOM 6
- Tailwind CSS
- Framer Motion

### Backend
- Node.js
- Express 5
- MongoDB + Mongoose
- JWT admin auth
- S3 compatible storage
- Nodemailer SMTP
- Zod validation
- Helmet + HPP + rate limit + sanitizacion

### Infraestructura observada
- Frontend desplegado en Railway
- Backend desplegado en Railway
- MongoDB administrado externamente
- Imagenes servidas por S3 + CloudFront
- Dominio final del cliente aun no conectado

## Comandos ejecutados en la Fase 0

### Control de version
```bash
git status --short
git branch --show-current
git checkout -b audit/production-hardening
git rev-parse HEAD
git log --oneline -8
```

### Baseline tecnico
```bash
npm run build
npm --prefix backend run smoke
npm audit --omit=dev --json
npm --prefix backend audit --omit=dev --json
```

## Resultados del baseline

### 1. Build frontend
Resultado: `PASS`

Salida relevante:
```text
dist/index.html                   1.07 kB | gzip:   0.57 kB
dist/assets/index-TQiG_PW3.css   63.75 kB | gzip:  10.68 kB
dist/assets/index-Cxs2CH6h.js   569.71 kB | gzip: 163.66 kB
```

Hallazgo:
- el bundle principal supera 500 kB minificado
- requiere code splitting en Fase 4

### 2. Smoke test backend
Resultado: `PASS`

Cobertura observada del smoke:
- login admin
- creacion de usuario
- password reset
- bloqueo y desbloqueo de usuario
- creacion de vehiculo
- subida multiple de imagenes
- seleccion de portada
- publicacion
- listado publico
- detalle publico
- flujo de chat

Nota:
- con `EMAIL_PROVIDER=disabled`, los correos se validan de forma simulada en test y no como entrega real

### 3. Audit frontend
Resultado: `FAIL CONTROLADO`

Hallazgo actual:
- vulnerabilidad moderada en `react-router` / `react-router-dom`
- advisory: `GHSA-2j2x-hqr9-3h42`
- impacto: open redirect via protocol-relative path reinterpretation
- correccion prevista: Fase 1

### 4. Audit backend
Resultado: `PASS`

Hallazgo actual:
- sin vulnerabilidades productivas reportadas por `npm audit --omit=dev`

## Estado tecnico actual por area

### Frontend
Fortalezas:
- rutas publicas y admin operativas
- inventario ya conectado a API real
- detalle publico por slug
- chat conectado al inventario actual
- admin funcional con flujo de vehiculos, usuarios, auditoria y seguridad

Debilidades baseline:
- sin metadata SEO dinamica por ruta
- sin `robots.txt`
- sin `sitemap.xml`
- sin `canonical`
- sin `Open Graph`
- sin `JSON-LD`
- sin carga diferida de rutas
- bundle principal pesado
- sin CI de frontend

### Backend
Fortalezas:
- validaciones Zod
- middlewares de seguridad
- readiness y health endpoints
- auditoria admin
- smoke test funcional
- rate limiting separado para login y catalogo

Debilidades baseline:
- sesion admin todavia consumida desde token en `localStorage` del frontend
- observabilidad limitada a `console.*`
- SMTP preparado pero no cerrado operativamente
- sin pipeline CI/CD
- indices Mongo mejorables para crecimiento del catalogo

### Operacion
Fortalezas:
- arquitectura clara
- separacion razonable entre frontend y backend
- despliegue actual funcionando con Railway

Debilidades baseline:
- sin staging formal documentado dentro del repo
- sin plan de rollback documentado hasta esta fase
- sin workflow automatizado de validacion antes del deploy

## Revision de variables actuales necesarias

### Frontend - variables actuales
Archivo de referencia: `.env.example`

Variables activas hoy:
- `VITE_API_URL`
- `VITE_DEV_PROXY_TARGET`

### Backend - variables actuales
Archivo de referencia: `backend/.env.example`

Variables nucleares:
- `NODE_ENV`
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `FRONTEND_URL`
- `FRONTEND_ADMIN_URL`
- `FRONTEND_URLS`
- `TRUST_PROXY`
- `STORAGE_DRIVER`

Rate limit y auth:
- `API_RATE_LIMIT_WINDOW_MS`
- `API_RATE_LIMIT_MAX`
- `PUBLIC_CATALOG_RATE_LIMIT_WINDOW_MS`
- `PUBLIC_CATALOG_RATE_LIMIT_MAX`
- `LOGIN_RATE_LIMIT_WINDOW_MS`
- `LOGIN_RATE_LIMIT_MAX`
- `FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS`
- `FORGOT_PASSWORD_RATE_LIMIT_MAX`
- `RESET_PASSWORD_RATE_LIMIT_WINDOW_MS`
- `RESET_PASSWORD_RATE_LIMIT_MAX`
- `MAX_FAILED_LOGIN_ATTEMPTS`
- `ACCOUNT_LOCK_MINUTES`
- `PASSWORD_MIN_LENGTH`
- `PASSWORD_RESET_TOKEN_TTL_MINUTES`
- `PASSWORD_RESET_REQUEST_MIN_INTERVAL_MS`

Payload e imagenes:
- `JSON_BODY_LIMIT`
- `URLENCODED_LIMIT`
- `UPLOAD_MAX_FILE_SIZE_MB`
- `UPLOAD_MAX_FILES`
- `MAX_IMAGE_WIDTH`
- `MAX_IMAGE_HEIGHT`
- `SHARP_LIMIT_INPUT_PIXELS`

Storage:
- `UPLOADS_BASE_URL`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_FORCE_PATH_STYLE`
- `S3_PUBLIC_BASE_URL`

Superadmin:
- `SUPERADMIN_NAME`
- `SUPERADMIN_USERNAME`
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PASSWORD`
- `SEED_DEMO_VEHICLES`

Correo:
- `EMAIL_PROVIDER`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`

AI:
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `AI_TIMEOUT_MS`
- `CHAT_INVENTORY_CACHE_MS`

### Variables a introducir o formalizar en fases siguientes
Estas variables todavia no se implementan en el codigo como parte de la Fase 0, pero deben existir como objetivo de configuracion:
- `SITE_URL`
- `FRONTEND_PUBLIC_URL`
- `API_PUBLIC_URL`
- `ALLOWED_ORIGINS`
- `COOKIE_DOMAIN`
- `CANONICAL_BASE_URL`
- `SITEMAP_BASE_URL`

Objetivo:
- que el dominio temporal de Railway sea solo un valor provisional configurable
- que el dominio final del cliente requiera solo cambios de variables y DNS

## Checklist de rutas criticas

### Rutas publicas
- `/`
- `/inventario`
- `/vehiculo/:slug`
- `/taller`
- `/bar-grill`
- `/bomba-gasolina`
- `/nosotros`
- `/contacto`

### Rutas admin
- `/admin-login`
- `/admin`
- `/admin/users`
- `/admin/audit`
- `/admin/security`
- `/admin/forgot-password`
- `/admin/reset-password`

## Checklist de endpoints criticos

### Publicos
- `GET /health`
- `GET /ready`
- `GET /api/vehicles`
- `GET /api/vehicles/featured`
- `GET /api/vehicles/:slug`
- `POST /api/vehicles/:slug/contact`
- `GET /api/vehicle-data/*`
- `POST /api/chat`

### Admin auth
- `POST /api/admin/auth/login`
- `GET /api/admin/auth/me`
- `POST /api/admin/auth/logout`
- `POST /api/admin/auth/forgot-password`
- `POST /api/admin/auth/reset-password/validate`
- `POST /api/admin/auth/reset-password`
- `POST /api/admin/auth/change-password`

### Admin users
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id/block`
- `PATCH /api/admin/users/:id/unblock`
- `PATCH /api/admin/users/:id/password`

### Admin vehiculos
- `GET /api/admin/vehicles`
- `GET /api/admin/vehicles/:id`
- `POST /api/admin/vehicles`
- `PUT /api/admin/vehicles/:id`
- `DELETE /api/admin/vehicles/:id`
- `POST /api/admin/vehicles/:id/images`
- `DELETE /api/admin/vehicles/:id/images/:imageId`
- `PATCH /api/admin/vehicles/:id/publish`
- `PATCH /api/admin/vehicles/:id/unpublish`
- `PATCH /api/admin/vehicles/:id/featured`
- `PATCH /api/admin/vehicles/:id/sold`

### Admin soporte operativo
- `GET /api/admin/dashboard`
- `GET /api/admin/audit`

## Checklist de formularios criticos

### Publicos
- busqueda y filtros de inventario
- apertura de detalle por slug
- contacto / CTA a WhatsApp
- widget de Benzan IA

### Admin
- login admin
- password reset request
- password reset completion
- forced password change
- creacion de usuario admin
- bloqueo y desbloqueo de usuario
- cambio de password por admin
- creacion y edicion de vehiculo
- subida multiple de imagenes
- seleccion de portada
- reordenamiento de imagenes
- publicar / guardar borrador / marcar vendido

## Flujos principales a validar en QA
1. Navegacion publica completa
2. Inventario -> detalle -> contacto
3. Chat IA -> recomendacion -> detalle
4. Login admin -> dashboard
5. Primer acceso con cambio forzado de password
6. Alta de nuevo usuario admin
7. Recuperacion de password
8. Crear vehiculo -> subir imagenes -> portada -> publicar
9. Vehiculo publicado visible en inventario publico
10. Logout + expiracion de sesion + reingreso

## Matriz simple de riesgos

| ID | Riesgo | Severidad | Impacto | Estado | Mitigacion/Fase |
| --- | --- | --- | --- | --- | --- |
| R1 | Vulnerabilidad moderada en `react-router-dom` | Alta | Riesgo de redireccion no deseada | Abierto | Corregir en Fase 1 |
| R2 | JWT admin consumido desde `localStorage` | Alta | Mayor superficie ante XSS en panel | Abierto | Evolucion a cookies en Fase 1 |
| R3 | SEO tecnico insuficiente | Alta | Menor indexacion y peor CTR organico | Abierto | Corregir en Fase 3 |
| R4 | Bundle inicial pesado | Media | Carga inicial menos eficiente | Abierto | Corregir en Fase 4 |
| R5 | Indices de catalogo no optimizados para crecimiento | Media | Riesgo de degradacion a futuro | Abierto | Corregir en Fase 5 |
| R6 | Correo productivo pendiente | Media | Recuperacion y notificaciones incompletas | Abierto | Preparar en Fase 6 |
| R7 | Observabilidad basica | Media | Deteccion lenta de fallos reales | Abierto | Corregir en Fase 7 |
| R8 | Accesibilidad no auditada a nivel WCAG | Media | Brechas UX y cumplimiento | Abierto | Corregir en Fase 8 |
| R9 | Sin CI/CD minima en repo | Media | Mayor riesgo de regresion en deploy | Abierto | Corregir en Fase 2 |
| R10 | Dominio final aun no integrado | Baja | No bloquea producto, si bloquea cierre final de marca y correo | Aceptado temporalmente | Fase 9 |

## Backlog priorizado por fases

### Fase 1 - Hardening y seguridad
- actualizar `react-router-dom` / `react-router`
- definir estrategia de migracion de sesion admin a cookies seguras
- revisar CORS, credentials, SameSite y CSRF target
- revisar errores expuestos y auth edge cases

### Fase 2 - CI/CD y QA robusto
- crear workflow de GitHub Actions con gates separados
- correr `build` + regresion frontend
- correr smoke backend con cache para `mongodb-memory-server`
- agregar control de dependencias en CI y Dependabot
- formalizar checklist QA pre deploy y post deploy

### Fase 3 - SEO tecnico
- metadata dinamica por ruta
- title + description + canonical
- Open Graph
- JSON-LD
- `robots.txt`
- `sitemap.xml`
- todo atado a `SITE_URL`

### Fase 4 - Performance
- `React.lazy`
- `Suspense`
- code splitting por rutas
- revisar carga inicial y modulos no criticos
- comparar tamano del bundle antes/despues

### Fase 5 - Escalabilidad de datos
- revisar filtros reales de catalogo
- agregar indices compuestos justificados
- documentar cada indice agregado

### Fase 6 - Correo productivo
- dejar SMTP listo por variables
- documentar pendiente de SPF, DKIM y DMARC
- no incrustar secretos ni cuentas personales en codigo

### Fase 7 - Observabilidad
- mover `console.*` a logger estructurado
- formalizar `info`, `warn`, `error`, `debug`
- mejorar trazabilidad por `requestId`

### Fase 8 - Accesibilidad y UX
- foco visible
- navegacion por teclado
- contraste
- alt text
- formularios y errores
- responsive

### Fase 9 - Dominio final
- no ejecutar todavia
- dejar solamente preparado el sistema para cambio por variables y DNS

## Gates minimos antes de cada fase siguiente
- rama dedicada
- backup vigente
- baseline documentado
- `npm run build` exitoso
- `npm --prefix backend run smoke` exitoso
- `npm audit` revisado
- checklist QA critica revisada

## Conclusion de Fase 0
La Fase 0 queda lista cuando:
- existe baseline reproducible
- existe documentacion de auditoria
- existe plan de rollback
- existe matriz de riesgos
- existe backlog por fases
- `main` permanece intacta
- produccion no ha sido modificada directamente

## Fase 1 - Avance ejecutado
Fecha de ejecucion: `2026-06-28`

### Cambios implementados
- actualizacion de `react-router-dom` y `react-router` a `6.30.4`
- soporte de sesion admin por cookie segura `httpOnly`
- soporte de proteccion CSRF para mutaciones admin basadas en cookie
- CORS ajustado para `credentials: true` y header CSRF permitido
- frontend migrado a una estrategia de sesion `cookie-backed`
- JWT ya no queda persistido como secreto reutilizable en `localStorage`
- smoke test ampliado para validar:
  - cookie de sesion en login
  - `GET /api/admin/auth/me` autenticado por cookie
  - mutaciones admin con header CSRF
  - limpieza de cookie en logout

### Estrategia aplicada
Se dejo una compatibilidad controlada:
- el backend sigue aceptando `Bearer token`
- el frontend admin ahora prioriza cookie segura
- esto evita romper el panel actual mientras reduce la dependencia de token persistido en navegador

### Variables nuevas implementadas en backend
- `ADMIN_AUTH_COOKIE_NAME`
- `ADMIN_AUTH_COOKIE_DOMAIN`
- `ADMIN_AUTH_COOKIE_PATH`
- `ADMIN_AUTH_COOKIE_SAME_SITE`
- `ADMIN_AUTH_COOKIE_SECURE`
- `ADMIN_CSRF_HEADER_NAME`

### Resultado despues de Fase 1
- `npm run build`: PASS
- `npm --prefix backend run smoke`: PASS
- `npm audit --omit=dev`: PASS
- `npm --prefix backend audit --omit=dev`: PASS

### Pendientes que siguen abiertos
- Fase 2: CI/CD y QA robusto
- Fase 3: SEO tecnico
- Fase 4: performance y code splitting
- Fase 5: indices compuestos para escalabilidad de catalogo
- Fase 6: correo productivo real
- Fase 7: logger estructurado y observabilidad
- Fase 8: accesibilidad y UX
- Fase 9: dominio final del cliente

## Fase 2 - Avance ejecutado
Fecha de ejecucion: `2026-06-28`

### Cambios implementados
- pipeline `Quality Gate` en GitHub Actions para `push`, `pull_request` y ejecucion manual
- jobs separados para:
  - calidad frontend
  - smoke backend
  - audit de dependencias
  - dependency review en PRs
- version de Node unificada con Railway mediante `.nvmrc`
- cache de binarios para `mongodb-memory-server` en CI
- artefacto `frontend-dist` publicado desde CI para inspeccion del build
- base real de regresion frontend con Vitest + Testing Library
- cobertura inicial sobre:
  - rutas criticas y redirecciones (`/login`, `/dashboard`, rutas publicas/admin)
  - transporte admin en `apiClient`
  - cache y fallback de inventario en `publicApi`
- checklist formal de release y QA en `docs/QA_RELEASE_CHECKLIST.md`
- automatizacion de actualizaciones mediante `.github/dependabot.yml`

### Artefactos nuevos de la fase
- `.github/workflows/quality-gate.yml`
- `.github/dependabot.yml`
- `.nvmrc`
- `docs/QA_RELEASE_CHECKLIST.md`
- `src/test/setup.js`
- `src/App.routes.test.jsx`
- `src/lib/__tests__/apiClient.test.js`
- `src/lib/__tests__/publicApi.test.js`

### Scripts nuevos o reforzados
- `npm run test:frontend`
- `npm run test:frontend:ci`
- `npm run verify:frontend`
- `npm run verify:backend`
- `npm run verify:security`
- `npm run verify:ci`

### Resultado esperado despues de Fase 2
- ningun cambio deberia desplegar sin pasar build, regresion frontend, smoke backend y audit de dependencias
- el repositorio ya queda listo para trabajar con PRs y gates tecnicos antes de merge
- la QA manual deja de depender de memoria informal y queda convertida en checklist operativa
