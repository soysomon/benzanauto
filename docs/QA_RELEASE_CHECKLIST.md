# Benzan Auto - QA y Release Checklist

## Objetivo
Establecer un gate operativo antes de cualquier despliegue para que el portal mantenga un nivel profesional de producción sin depender de revisión improvisada en Railway.

## Regla de oro
No desplegar si falla cualquiera de estas condiciones:
- `npm run verify:ci`
- `npm run test:e2e:ci`
- workflow `Quality Gate` en GitHub Actions
- workflow `UI Smoke` en GitHub Actions
- checklist manual crítica
- revisión de variables del entorno objetivo

## 1. Preparación previa al release
- Confirmar que el trabajo sale desde una rama controlada y no desde cambios locales sin commit.
- Confirmar que `main` no se tocó manualmente en producción.
- Confirmar backup reciente o snapshot disponible de MongoDB Atlas si el release toca datos, modelos o índices.
- Si el release agrega o cambia índices, correr `npm --prefix backend run indexes:diff` antes del deploy y planificar `npm --prefix backend run indexes:sync` en la ventana controlada.
- Confirmar que frontend y backend de Railway siguen apuntando a las variables públicas correctas.
- Confirmar que el dominio temporal o final sigue saliendo de variables, nunca hardcodeado.

## 2. Quality Gate automatizado
- Ejecutar `npm ci`.
- Ejecutar `npm --prefix backend ci`.
- Ejecutar `npm run verify:frontend`.
- Ejecutar `npm run verify:backend`.
- Ejecutar `npm run verify:security`.
- Ejecutar `npm run test:e2e:ci`.
- Validar que GitHub Actions complete:
  - `frontend-quality`
  - `backend-quality`
  - `dependency-audit`
  - `UI Smoke`
  - `dependency-review` en PRs

## 3. QA manual crítica - Público
- Home carga sin errores visibles.
- Home publica title, description, canonical y Open Graph correctos.
- La sección de vehículos recientes muestra inventario real.
- `/inventario` carga sin 429 ni loops de requests.
- `/inventario` publica metadata canónica y no indexa parámetros como canonical principal.
- Los filtros de inventario responden sin duplicar llamadas.
- El detalle `/vehiculo/:slug` carga imagen principal, galería y CTA.
- El detalle `/vehiculo/:slug` publica title, description y JSON-LD coherentes con el vehículo real.
- El widget de Benzan IA responde con inventario real publicado.
- Formularios públicos y CTA de WhatsApp abren correctamente.
- Navegación principal y footer funcionan en móvil y desktop.

## 4. QA manual crítica - Admin
- `/admin-login` carga correctamente.
- Login admin funciona con cookie de sesión y protección CSRF.
- Si un usuario debe cambiar contraseña, entra al flujo correcto y luego vuelve al dashboard.
- Dashboard carga métricas sin errores 401/422/429 inesperados.
- Crear usuario funciona con validaciones claras.
- Crear vehículo funciona de punta a punta.
- Subida múltiple de imágenes funciona.
- Selección de portada persiste.
- Publicar vehículo actualiza estado visual y persistencia real.
- El vehículo publicado aparece en el inventario público.
- Logout invalida sesión correctamente.

## 5. QA técnica
- `GET /health` responde `ok` o el estado esperado sin degradación inesperada.
- `GET /ready` responde correctamente en el backend desplegado.
- `robots.txt` responde correctamente.
- `sitemap.xml` responde correctamente y contiene rutas públicas válidas.
- No hay errores 5xx sostenidos en Railway.
- No hay 401 falsos después de acciones exitosas.
- No hay 429 para navegación pública normal.
- Imágenes resuelven por CloudFront/S3 correctamente.
- CORS permite frontend público y admin configurados.

## 6. Navegadores y responsive
- Probar Chrome desktop.
- Probar Safari o WebKit.
- Probar viewport móvil.
- Revisar foco visible, formularios y navegación básica por teclado.

## 7. Aprobación de release
- Registrar commit exacto del release.
- Guardar evidencia del workflow verde.
- Registrar variables nuevas o cambiadas.
- Definir responsable de deploy y responsable de rollback.

## 8. Verificación post-deploy
- Abrir home pública.
- Abrir inventario.
- Abrir un detalle por slug.
- Iniciar sesión admin.
- Crear o editar un vehículo de prueba si aplica.
- Verificar `/health`.
- Verificar logs iniciales en Railway durante los primeros minutos.

## 9. Triggers de rollback inmediato
- Login admin roto.
- Inventario público caído.
- Detalle público roto.
- Publicación de vehículo falla.
- Subida de imágenes falla.
- Errores 5xx sostenidos.
- 401/403/429 inesperados en rutas críticas.

## 10. Pendiente deliberado por dominio final
Esta checklist deja explícitamente pendiente lo siguiente hasta recibir el dominio del cliente:
- `SITE_URL`
- `FRONTEND_PUBLIC_URL`
- `API_PUBLIC_URL`
- `COOKIE_DOMAIN`
- canonical definitivo
- sitemap definitivo
- robots definitivo
- SMTP con dominio del cliente
