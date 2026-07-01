# Observabilidad y Logging Operativo

## Objetivo
Esta capa deja el backend listo para operar con logs estructurados en produccion, trazabilidad por `requestId` y futura integracion con plataformas externas de observabilidad sin reescribir el core.

## Logger estructurado
El backend ya no depende de `console.*` en runtime.

Cada linea de log sale en JSON con campos base:

- `timestamp`
- `level`
- `service`
- `env`
- `pid`
- `message`
- `requestId` cuando aplica
- `http` con `method`, `path`, `route`, `statusCode`, `durationMs`, `ip`
- `actor` con `id`, `role`, `transport`, `sessionId` cuando existe autenticacion admin
- `context` para metadatos adicionales saneados

## Redaccion de datos sensibles
El logger sanea automaticamente claves sensibles como:

- `password`
- `secret`
- `token`
- `authorization`
- `cookie`
- `jwt`
- `csrf`
- `apiKey`
- `accessKey`

Si un payload llega a logs, esos campos no deben exponerse en claro.

## Variables de entorno
Variables nuevas relevantes:

- `LOG_LEVEL=debug|info|warn|error`
- `LOG_SERVICE_NAME=benzan-auto-backend`

Recomendacion productiva inicial:

- `LOG_LEVEL=info`
- `LOG_SERVICE_NAME=benzan-auto-backend`

En local puede usarse:

- `LOG_LEVEL=debug`

## Request tracing
Cada request genera un `X-Request-Id` y el mismo valor aparece en:

- respuesta HTTP
- logs del backend
- errores devueltos por el middleware central

Cuando un usuario reporte un error en produccion, el flujo recomendado es:

1. copiar `requestId` desde la respuesta o captura del error
2. buscar ese `requestId` en Railway Logs
3. revisar:
   - `http_request_completed`
   - `request_validation_failed`
   - `unhandled_server_error`
   - cualquier evento de `database_*`, `smtp_*` o `ai_provider_*`

## Eventos principales
Eventos ya normalizados:

- `server_started`
- `database_connecting`
- `database_connected`
- `database_disconnected`
- `database_connection_error`
- `database_bootstrap_failed`
- `smtp_bootstrap_verified`
- `smtp_bootstrap_verification_failed`
- `http_request_completed`
- `request_validation_failed`
- `mongoose_validation_failed`
- `duplicate_key_rejected`
- `invalid_json_body`
- `unhandled_server_error`
- `ai_provider_failed`
- `ai_provider_response_rejected`

## Railway
En Railway:

1. abrir el servicio backend
2. entrar en `Deployments` o `Logs`
3. filtrar por `requestId`, `message` o `scope`
4. revisar el JSON completo del evento

Como los logs ya salen estructurados, quedan listos para forward a:

- Better Stack / Logtail
- Datadog
- Sentry ingestion pipelines
- ELK / OpenSearch

## Salud operativa
Rutas disponibles:

- `/health`
  en produccion expone solo un resumen seguro:
  - `status`
  - `service`
  - `timestamp`
  - `uptimeSeconds`
- `/ready`
  valida si el backend esta listo para recibir trafico sin filtrar detalles internos en produccion

Para diagnostico mas profundo:

1. usar logs estructurados por `requestId`
2. correr `npm --prefix backend run email:verify` cuando se necesite validar SMTP manualmente
3. revisar Railway Logs para eventos:
   - `database_*`
   - `smtp_*`
   - `unhandled_server_error`

## Siguiente integracion sugerida
Cuando llegue la fase de observabilidad externa, la ruta limpia es:

1. mantener stdout JSON como fuente unica
2. conectar collector externo desde Railway
3. agregar alertas por:
   - `level=error`
   - exceso de `request_validation_failed`
   - reconexiones de base de datos
   - fallos SMTP
4. opcionalmente enviar excepciones no controladas a Sentry con el mismo `requestId`
