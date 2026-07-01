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
- metadata dinamica por ruta con fallback global
- title + description + canonical
- Open Graph + Twitter cards
- JSON-LD en home, inventario y detalle
- `robots.txt` generado por build
- `sitemap.xml` generado por build con soporte para rutas dinamicas
- todo atado a `VITE_SITE_URL`

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
- Fase 4: performance y code splitting
- Fase 5: indices compuestos para escalabilidad de catalogo
- Fase 6: correo productivo real
- Fase 7: logger estructurado y observabilidad
- Fase 8: accesibilidad y UX
- Fase 9: dominio final del cliente

## Fase 3 - Avance ejecutado
Fecha de ejecucion: `2026-06-28`

### Cambios implementados
- metadata SEO dinamica por ruta usando `react-helmet-async`
- fallback global de SEO para rutas publicas y `noindex` automatico para rutas admin
- title, description y canonical por ruta
- Open Graph y Twitter cards base
- JSON-LD implementado en:
  - home (`AutoDealer` + `WebSite`)
  - inventario (`BreadcrumbList` + `ItemList`)
  - detalle de vehiculo (`BreadcrumbList` + `Product`)
- generacion automatizada de `robots.txt` y `sitemap.xml` durante el build
- soporte de sitemap dinamico con slugs publicados desde la API publica cuando `VITE_API_URL` esta disponible
- `SITE_URL` frontalizado via `VITE_SITE_URL`
- configuracion de website del frontend y backend dejada alineada con variables, sin depender de dominio hardcodeado

### Artefactos nuevos de la fase
- `src/components/seo/SeoMeta.jsx`
- `src/components/seo/RouteSeoDefaults.jsx`
- `src/lib/seo.js`
- `src/lib/seo.routes.js`
- `src/lib/seoStructuredData.js`
- `src/lib/__tests__/seo.test.js`
- `scripts/generate-seo-assets.mjs`

### Variables nuevas o reforzadas
- `VITE_SITE_URL`
- `VITE_DEFAULT_OG_IMAGE`

### Resultado esperado despues de Fase 3
- cada ruta publica relevante expone metadata consistente
- admin y rutas internas no quedan indexables
- el build produce `dist/robots.txt` y `dist/sitemap.xml`
- el sistema queda listo para cambiar del dominio temporal al dominio final solo ajustando variables

### Riesgo residual conocido
- al ser una SPA sin SSR ni prerender, Google puede procesar la metadata dinamica, pero previews sociales profundas por slug pueden seguir siendo menos confiables que en una implementacion server-rendered o prerenderizada

### Pendientes despues de Fase 3
- Fase 4: performance y code splitting
- Fase 5: indices compuestos para escalabilidad de catalogo
- Fase 6: correo productivo real
- Fase 7: logger estructurado y observabilidad
- Fase 8: accesibilidad y UX
- Fase 9: dominio final del cliente

## Fase 4 - Avance ejecutado
Fecha de ejecucion: `2026-06-30`

### Objetivo de cierre
Cerrar la optimizacion del arranque inicial con evidencia reproducible, no solo con lazy loading aislado:
- shell mas liviano
- dependencias pesadas fuera del path critico cuando no son obligatorias
- modulos no criticos diferidos
- comparativa antes/despues documentada

### Linea base antes del cierre
- build previo de referencia:
  - `dist/assets/index-Cbqdadnf.js` = `34.30 kB` (`10.69 kB gzip`)
  - `dist/assets/Home-m8erXkiK.js` = `10.00 kB` (`3.70 kB gzip`)
  - `dist/assets/index-BvN6-IBK.css` = `66.41 kB` (`11.24 kB gzip`)
- inspeccion del output anterior:
  - `index` tenia import estatico a `motion-vendor`
  - `Home` tenia import estatico a `motion-vendor`
- consecuencia:
  - `framer-motion` seguia participando demasiado temprano en el bootstrap publico
  - parte del costo del hero y de las transiciones de rutas quedaba dentro del arranque inicial

### Cambios implementados
- `src/App.jsx`
  - se elimino `framer-motion` del shell global
  - se retiraron transiciones de rutas del bootstrap principal
  - se mantuvo `Suspense` y el code splitting por ruta, pero sin cargar motion en el entry
- `src/components/home/Hero.jsx`
  - refactor completo del hero critico a transiciones CSS/nativas
  - eliminacion del uso de `framer-motion` sobre el contenido above-the-fold
  - limpieza de logica pesada acoplada al hero que no estaba activa en pantalla
  - mantenimiento del carousel principal, CTA y progreso visual sin depender de motion en el primer render
- `package.json`
  - nuevo comando `npm run inspect:frontend-build`
- `scripts/inspect-frontend-build.mjs`
  - reporte reproducible del build para:
    - shell entry
    - chunk de home
    - top de assets JS por peso
    - verificacion de si `index` o `Home` importan `motion-vendor` de forma estatica

### Resultado despues del cierre
- build final:
  - `dist/assets/index-CqDMKJBm.js` = `33.84 kB` (`10.50 kB gzip`)
  - `dist/assets/Home-C9ZNmaNJ.js` = `10.51 kB` (`3.75 kB gzip`)
  - `dist/assets/index-BaR9uQ63.css` = `65.89 kB` (`11.09 kB gzip`)
- reporte reproducible (`npm run inspect:frontend-build`):
  - shell entry: `static motion import: no`
  - home chunk: `static motion import: no`

### Lectura tecnica correcta
- el numero bruto del chunk `Home` no bajo de forma agresiva; de hecho subio levemente al mover la logica del hero a una implementacion propia
- aun asi, el cambio importante y correcto es que:
  - `motion-vendor` ya no es dependencia estatica del shell
  - `motion-vendor` ya no es dependencia estatica del chunk `Home`
- en terminos reales de arranque:
  - el publico ya no paga `framer-motion` como requisito del primer bootstrap general
  - la libreria queda diferida para rutas y secciones que si la necesitan:
    - `FeaturedVehicles`
    - `ServicesCarousel`
    - `Inventario`
    - `VehiculoDetalle`
    - `ChatWidget`
    - admin

### Resultado funcional de la fase
- `React.lazy` y `Suspense` quedan implementados
- code splitting por rutas queda activo
- modulos publicos no criticos quedan diferidos
- el arranque inicial ya no depende de motion para renderizar la shell ni el hero principal
- existe mecanismo reproducible para revisar regresiones del build en el futuro

### Validacion tecnica
- `npm run test:frontend:ci` ✅
- `npm run build:frontend` ✅
- `npm run inspect:frontend-build` ✅

### Riesgo residual aceptado
- `motion-vendor` sigue existiendo como chunk pesado, pero ahora queda fuera del shell inicial y solo se descarga cuando una ruta o seccion realmente lo requiere
- el siguiente costo grande visible pasa a ser:
  - `react-vendor`
  - `AdminDashboardPage`
- eso ya no bloquea el cierre de Fase 4, aunque si justifica futuras optimizaciones especificas del admin y RUM en produccion

### Criterio de cierre
La Fase 4 se considera cerrada porque:
- se completo el code splitting por rutas
- se reviso y optimizo el path critico inicial
- se saco una dependencia pesada del bootstrap general
- se comparo antes/despues
- se dejo una forma estable de inspeccion para futuras regresiones

### Siguiente prioridad despues de cerrar Fase 4
- Fase 9: preparacion final para dominio del cliente, DNS, branding final y correo productivo con identidad definitiva

## Fase 5 - Avance ejecutado
Fecha de ejecucion: `2026-06-29`

### Consultas reales revisadas
- `/api/vehicles` con `status: 'published'`, paginacion y orden por relevancia catalogo
- `/api/vehicles/featured`
- snapshot publicado consumido por Benzan IA
- detalle publico con relacionados por marca
- filtros y facets reales del inventario

### Cambios implementados
- indices compuestos parciales sobre `published` para no inflar innecesariamente el costo de escritura:
  - `vehicle_public_recent_idx`
  - `vehicle_public_featured_recent_idx`
  - `vehicle_public_brand_recent_idx`
- script operativo de diff/sync de indices:
  - `npm --prefix backend run indexes:diff`
  - `npm --prefix backend run indexes:sync`
- documentacion operativa y de justificacion en `docs/CATALOG_INDEX_STRATEGY.md`
- checklist QA actualizada para releases que toquen modelos o indices

### Criterio aplicado
- no se agregaron indices “por si acaso”
- se priorizaron consultas que hoy sostienen:
  - inventario publico
  - home destacada
  - Benzan IA
  - relacionados por marca
- se aprovecharon `partialFilterExpression` para aislar el costo al subconjunto publico

### Nota operativa importante
- en `production`, `autoIndex` esta desactivado
- por eso esta fase deja el schema listo y tambien el procedimiento formal para sincronizar indices en Railway o staging sin depender del arranque del backend

### Verificacion esperada de la fase
- smoke backend debe seguir pasando
- listado publico y destacados deben responder sin cambios funcionales
- la aplicacion de indices debe ejecutarse con `indexes:diff` y luego `indexes:sync` en entorno controlado

## Fase 6 - Avance ejecutado
Fecha de ejecucion: `2026-06-29`

### Cambios implementados
- endurecimiento del transporte SMTP por variables:
  - `SMTP_REQUIRE_TLS`
  - `SMTP_POOL`
  - `SMTP_CONNECTION_TIMEOUT_MS`
  - `SMTP_GREETING_TIMEOUT_MS`
  - `SMTP_SOCKET_TIMEOUT_MS`
  - `SMTP_TLS_SERVERNAME`
  - `SMTP_VERIFY_ON_STARTUP`
  - `EMAIL_FROM_NAME`
  - `EMAIL_REPLY_TO`
- soporte de verificacion operacional con:
  - `npm --prefix backend run email:verify`
- verificacion SMTP opcional al arranque sin bloquear el backend
- `/health` ahora expone estado de correo junto al de base de datos
- documentacion operativa creada en `docs/EMAIL_PRODUCTION_READINESS.md`

### Criterio aplicado
- no se colocaron credenciales en codigo
- no se forzo un proveedor temporal improvisado
- el sistema puede operar con `EMAIL_PROVIDER=disabled` hasta que llegue el proveedor definitivo
- cuando se active SMTP real, queda mecanismo claro para verificarlo antes de depender de el

### Pendiente deliberado
- configuracion final de SPF
- configuracion final de DKIM
- politica DMARC
- remitente final con dominio del cliente

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

## Fase 7 - Avance ejecutado
Fecha de ejecucion: `2026-06-29`

### Observabilidad implementada
- logger estructurado JSON para backend con niveles:
  - `debug`
  - `info`
  - `warn`
  - `error`
- contexto por request con `AsyncLocalStorage`
- `requestId` automatico por peticion y retorno en `X-Request-Id`
- trazabilidad HTTP con:
  - metodo
  - path
  - route
  - status
  - duracion
  - IP
- inclusion de actor autenticado en logs admin cuando existe sesion valida
- redaccion automatica de secretos, passwords, tokens, cookies y credenciales sensibles
- normalizacion de eventos criticos en:
  - bootstrap del servidor
  - base de datos
  - SMTP
  - validaciones
  - errores inesperados
  - fallback de proveedores IA
- scripts operativos alineados al mismo logger
- runbook nuevo en `docs/OBSERVABILITY_RUNBOOK.md`

### Performance profunda aplicada
- cache publica reforzada en frontend con:
  - memoria
  - `sessionStorage`
  - deduplicacion de requests en vuelo
  - fallback a snapshot exitoso ante `429/5xx`
- cache especifica para detalle publico de vehiculos
- prefetch de rutas y data para:
  - inventario
  - detalle de vehiculo
  - acceso admin
  - home
- eliminacion de navegaciones internas con `window.location.href` en rutas criticas publicas
- preloads criticos en `index.html` para logo e imagen hero principal
- uso de `useDeferredValue` y `startTransition` en inventario para mejorar percepcion de respuesta
- compresion HTTP con `compression` en backend para respuestas textuales/JSON
- payload del catalogo publico reducido:
  - home e inventario ya no cargan descripcion, specs ni campos pesados innecesarios por tarjeta

### Validacion tecnica de la fase
- smoke backend: `npm --prefix backend run smoke` ✅
- build frontend: `npm run build:frontend` ✅
- regresion frontend: `npm run test:frontend:ci` ✅

### Linea base vs resultado
- build frontend antes:
  - `dist/assets/index-D7ar-dj1.js` = `28.73 kB` (`9.32 kB gzip`)
  - `dist/assets/Home-BTIMSOqD.js` = `9.78 kB`
  - `dist/assets/Inventario-DRDdqOx8.js` = `12.71 kB`
  - `dist/assets/VehiculoDetalle-CTl93ff9.js` = `14.32 kB`
- build frontend despues:
  - `dist/assets/index-CSwlTpMC.js` = `30.79 kB` (`9.94 kB gzip`)
  - `dist/assets/publicApi-CioCEgg2.js` = `3.93 kB` (`1.59 kB gzip`)
  - `dist/assets/VehicleCard-MaBSGqWa.js` = `5.51 kB`
  - `dist/assets/FeaturedVehicles-E0_ekFIv.js` = `7.40 kB`
  - `dist/assets/Home-DD6Z54V8.js` = `10.00 kB`
  - `dist/assets/Inventario-D6Ft7nN8.js` = `12.80 kB`
  - `dist/assets/VehiculoDetalle-ChmTbjRi.js` = `14.36 kB`

### Lectura del resultado
- el bundle inicial subio ligeramente por la capa de prefetch, pero la navegacion real queda mejor:
  - menos recargas completas
  - menos requests duplicados
  - detalle e inventario se pueden calentar antes del click
- el beneficio mas fuerte no es solo de kB del bundle:
  - baja latencia percibida
  - menos 429 por repeticion
  - menor payload de catalogo publico
  - mejor compresion de respuestas
  - trazabilidad real de fallos en backend

### Riesgos encontrados
- `VITE_SITE_URL` y `VITE_API_URL` siguen sin definirse localmente al generar assets SEO, por eso el postbuild cae a localhost como fallback local
- aun no existe integracion externa con Sentry, Better Stack o Datadog; la arquitectura ya quedo preparada pero falta conectar el proveedor final
- las metricas reales de Core Web Vitals en usuarios finales requieren medicion RUM en produccion, no solo build local

### Recomendacion para la siguiente fase
- Fase 8: accesibilidad y UX de nivel WCAG 2.2 con auditoria de contraste, foco, teclado, formularios y estados accesibles

## Fase 8 - Accesibilidad y UX de nivel produccion

### Objetivo de la fase
Elevar la experiencia real del portal y del admin bajo criterios de accesibilidad practica:
- navegacion por teclado
- foco visible
- semantica correcta de landmarks
- dialogos accesibles
- formularios y estados anunciables
- degradacion elegante para usuarios con `prefers-reduced-motion`

### Mejoras aplicadas
- estructura global corregida en `src/App.jsx`:
  - `header`, `main` y `footer` ya no quedan anidados incorrectamente
  - se agrego skip link a `#main-content`
  - el `main` principal ahora es enfocable para salto de teclado
- navbar endurecido en `src/components/layout/Navbar.jsx`:
  - menu movil real para pantallas pequenas
  - controles con `aria-expanded` y `aria-controls`
  - eliminacion de iconos muertos sin semantica util
  - mejor prefetch manteniendo navegacion por teclado
- estilos base en `src/index.css`:
  - foco visible global consistente
  - respeto a `prefers-reduced-motion`
  - desactivacion de animaciones/transiciones agresivas cuando el usuario lo solicita
- inventario reforzado en `src/pages/Inventario.jsx`:
  - region de busqueda semantica
  - filtros desplegables con atributos accesibles
  - checkboxes reales en lugar de pseudo controles click-only
  - estados de carga y recuento anunciados por screen reader
  - panel de error con `alert` real
- detalle de vehiculo mejorado en `src/pages/VehiculoDetalle.jsx`:
  - galeria principal accesible con boton real
  - miniaturas seleccionables por teclado
  - lightbox con `role="dialog"`, `aria-modal`, cierre por escape, bloqueo de scroll y restauracion de foco
  - skeletons anunciables en carga
- tarjetas y widgets:
  - `src/components/ui/VehicleCard.jsx` dejo de depender de `article` clickable con nested controls
  - `src/components/ui/ChatWidget.jsx` ahora expone dialogo accesible, control de foco, `log` para mensajes y estados de respuesta
  - `src/components/ui/RouteLoader.jsx` y `src/components/ui/StatePanel.jsx` ahora anuncian correctamente carga y errores
- admin:
  - `src/components/admin/AdminPageShell.jsx` ya no anida un `main` dentro de otro
  - `src/components/admin/AdminAuthLayout.jsx` y paginas de login/seguridad mejoraron semantica, `aria-busy`, `aria-invalid`, `status` y `alert`

### QA agregado
- nuevas pruebas:
  - `src/components/ui/StatePanel.test.jsx`
  - `src/components/ui/RouteLoader.test.jsx`
- actualizacion de regresion de rutas en `src/App.routes.test.jsx`

### Validacion tecnica de la fase
- regresion frontend: `npm run test:frontend:ci` ✅
- build frontend: `npm run build:frontend` ✅

### Linea base vs resultado
- linea base antes de la fase:
  - tests frontend: `15` pruebas en `4` archivos ✅
  - build principal: `dist/assets/index-CSwlTpMC.js` = `30.79 kB` (`9.94 kB gzip`)
  - css principal: `dist/assets/index-m_K0z-GZ.css` = `64.35 kB` (`10.85 kB gzip`)
- despues de la fase:
  - tests frontend: `20` pruebas en `6` archivos ✅
  - build principal: `dist/assets/index-Cbqdadnf.js` = `34.30 kB` (`10.69 kB gzip`)
  - css principal: `dist/assets/index-BvN6-IBK.css` = `66.41 kB` (`11.24 kB gzip`)

### Lectura del resultado
- el bundle crecio ligeramente por:
  - menu movil adicional
  - logica de dialogo/foco
  - atributos y helpers de accesibilidad
- ese costo es razonable porque resuelve problemas de produccion reales:
  - mejor navegacion sin mouse
  - menos ambiguedad de foco
  - modales y loaders comprensibles para lectores de pantalla
  - mejor continuidad UX en movil y teclado

### Riesgos pendientes
- aun faltaria una pasada sistematica de contraste y accesibilidad visual en todas las paginas de marketing secundarias
- componentes complejos como `Hero`, `ServicesCarousel`, `BarGrill` y `Taller` todavia merecen una auditoria especifica de teclado y motion
- para cerrar WCAG con mas rigor conviene incorporar auditoria automatizada con axe o Playwright accessibility snapshots en una fase posterior

### Recomendacion para la siguiente fase
- Fase 9: SEO tecnico avanzado, accesibilidad extendida sobre paginas secundarias y monitoreo sintetico de UX real

## Revision final de riesgos residuales
Fecha de ejecucion: `2026-06-30`

### Endurecimiento adicional aplicado en este cierre
- el backend ya no devuelve el JWT admin en el cuerpo de login o cambio de contraseña cuando la sesion es por cookie `httpOnly`
- el frontend movio el marcador de sesion admin y el `csrfToken` desde `localStorage` a `sessionStorage`, con migracion suave desde claves legacy
- `/health` y `/ready` quedaron endurecidos para produccion y ya no filtran detalle sensible de base de datos o SMTP
- se agrego una ruta 404 controlada para eliminar pantallas vacias en rutas desconocidas
- se elimino `console.*` restante del runtime de `src` y `backend`
- Playwright dejo de estar en modo ejemplo y ahora corre smoke real sobre:
  - home
  - inventario
  - detalle
  - admin login
  - 404 publica

### Validacion de cierre
- `npm run test:frontend:ci` ✅
- `npm run smoke:backend` ✅
- `npm run build:frontend` ✅
- `npm run inspect:frontend-build` ✅
- `npm run audit:frontend` ✅
- `npm run audit:backend` ✅
- `npx playwright test --project=chromium` ✅

### Matriz de riesgos residuales
| Riesgo | Severidad | Estado | Evidencia tecnica | Archivo o modulo relacionado | Accion realizada | Proxima accion si aplica |
| --- | --- | --- | --- | --- | --- | --- |
| Exposicion del JWT admin en respuestas de login/cambio de clave | Alta | eliminado | `loginResponse.body.token === undefined` en smoke backend y controladores que omiten `token` del payload JSON | `backend/src/controllers/admin/auth.controller.js`, `backend/src/scripts/smoke-test.js`, `src/pages/AdminLoginPage.jsx`, `src/pages/AdminSecurityPage.jsx` | la sesion sigue por cookie `httpOnly`; el JWT ya no sale al cliente en el body | ninguna |
| Persistencia innecesaria de estado admin en `localStorage` | Media | mitigado | almacenamiento admin ahora usa `sessionStorage` con limpieza de claves legacy | `src/lib/adminSession.js` | se redujo permanencia de `csrfToken`, user snapshot y session marker en navegador | validar manualmente en produccion que la restauracion de sesion via cookie siga fluida tras cerrar/abrir pestaña |
| Filtracion publica de diagnostico interno en `/health` | Alta | eliminado | `/health` y `/ready` devuelven solo resumen seguro en produccion | `backend/src/app.js`, `docs/OBSERVABILITY_RUNBOOK.md`, `docs/EMAIL_PRODUCTION_READINESS.md` | se separo observabilidad publica de diagnostico interno | usar logs y `npm --prefix backend run email:verify` para diagnostico profundo |
| Pantallas en blanco en rutas inexistentes | Media | eliminado | existe `Route path="*"` y smoke E2E cubre `/ruta-que-no-existe` | `src/App.jsx`, `src/pages/NotFoundPage.jsx`, `src/App.routes.test.jsx`, `tests/public-smoke.spec.ts` | se agrego vista 404 controlada con `noindex` | ninguna |
| Logs artesanales y ruido en consola del runtime | Media | eliminado | `rg -n "console\\." src backend -S` sin resultados en runtime; logger estructurado activo | `src/pages/AdminDashboardPage.jsx`, `src/lib/benzanAI.js`, `backend/src/utils/logger.js` | se eliminaron `console.*` restantes y se conserva trazabilidad por logger backend | ninguna |
| QA E2E era placeholder y no validaba el portal real | Alta | mitigado | Playwright ahora ejecuta 5 smoke tests reales sobre rutas criticas | `playwright.config.ts`, `tests/public-smoke.spec.ts`, `.github/workflows/playwright.yml`, `package.json` | se sustituyeron specs demo por smoke util y workflow dedicado `UI Smoke` | integrar este workflow como required check en branch protection de GitHub |
| Dominio final, canonical definitivo y sitemap productivo canónico dependen de variable externa | Alta | pendiente | el build sigue cayendo a fallback local cuando `VITE_SITE_URL` no existe; assets SEO ya salen por variable | `src/lib/seo.js`, `scripts/generate-seo-assets.mjs`, `.env.example`, `docs/QA_RELEASE_CHECKLIST.md` | se preparo toda la arquitectura para `VITE_SITE_URL` y `VITE_DEFAULT_OG_IMAGE` sin hardcodear Railway como definitivo | definir dominio del cliente, DNS y `VITE_SITE_URL` final; regenerar sitemap y validar canonical |
| Correo transaccional final depende de proveedor SMTP y dominio del cliente | Alta | pendiente | `EMAIL_PROVIDER=disabled` sigue siendo el modo seguro mientras no exista SMTP real; verificacion manual documentada | `backend/src/config/env.js`, `backend/src/services/email.service.js`, `backend/src/scripts/verify-email.js`, `docs/EMAIL_PRODUCTION_READINESS.md` | se validan variables SMTP, se verifica transporte y no se improvisa con cuentas personales | cargar SMTP productivo, `EMAIL_FROM`, SPF, DKIM y DMARC cuando llegue el dominio |
| Indices de Mongo nuevos pueden no estar aplicados todavia en Atlas productivo | Media | pendiente | en produccion `autoIndex=false`; existe diff y sync controlado | `backend/src/models/Vehicle.js`, `backend/src/scripts/sync-indexes.js`, `docs/CATALOG_INDEX_STRATEGY.md` | se definieron indices y se documento el procedimiento de sincronizacion | ejecutar `npm --prefix backend run indexes:diff` y luego `indexes:sync` en staging/ventana controlada |
| Observabilidad externa y alertas proactivas aun dependen de servicio tercero | Media | mitigado | logger JSON, `requestId`, runbook y eventos normalizados ya existen | `backend/src/utils/logger.js`, `backend/src/middlewares/request-context.middleware.js`, `docs/OBSERVABILITY_RUNBOOK.md` | quedó lista la base para Logtail, Datadog, Better Stack o Sentry sin reescritura | conectar proveedor elegido y definir alertas de uptime, 5xx, SMTP y reconexiones DB |
| Cobertura cross-browser y mobile automatizada aun es parcial | Media | aceptado | la smoke suite corre hoy en `chromium`; QA manual ya exige Safari/WebKit y viewport movil | `playwright.config.ts`, `docs/QA_RELEASE_CHECKLIST.md` | se cerró el hueco crítico con smoke automatizada real y checklist manual reforzada | ampliar Playwright a WebKit y un viewport movil cuando el dominio final quede estable |

### Riesgos condicionados por factores externos

#### 1. Dominio final del cliente
- riesgo: canonical, sitemap, robots y Open Graph saliendo con dominio temporal o fallback local si no se fija `VITE_SITE_URL`
- impacto: SEO inconsistente, recrawl adicional y posible duplicidad canónica
- probabilidad: alta mientras no llegue el dominio
- mitigacion aplicada: toda la capa SEO ya opera por variables de entorno y no está hardcodeada al dominio temporal
- pendiente: DNS, SSL, `VITE_SITE_URL`, revisión final de indexación
- bloqueo: cliente / proveedor DNS

#### 2. SMTP productivo
- riesgo: recuperación de contraseña y correos operativos sin entregabilidad real o totalmente desactivados
- impacto: medio-alto sobre operación admin
- probabilidad: alta si no se activa proveedor legítimo
- mitigacion aplicada: provider deshabilitable, verificación manual, validación fuerte de env y documentación operativa
- pendiente: credenciales SMTP reales, SPF, DKIM, DMARC y remitente final
- bloqueo: dominio y proveedor de correo del cliente

#### 3. Observabilidad externa y alertas
- riesgo: depender solo de logs en Railway reduce tiempo de reacción ante incidentes fuera de horario
- impacto: medio
- probabilidad: media
- mitigacion aplicada: logger estructurado, `requestId`, runbook y endpoints de salud listos
- pendiente: conectar Sentry / Better Stack / Datadog y definir alertas
- bloqueo: decisión de herramienta y presupuesto operativo

#### 4. Sincronización de índices en Atlas
- riesgo: crecimiento del catálogo con planes de consulta ya optimizados en código pero no materializados todavía en la base productiva
- impacto: medio en performance del catálogo y Benzan IA a escala
- probabilidad: media
- mitigacion aplicada: índices definidos, script de diff/sync y estrategia documentada
- pendiente: ejecución controlada en staging o ventana productiva
- bloqueo: operación sobre Atlas / ventana de mantenimiento
