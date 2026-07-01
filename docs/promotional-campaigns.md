# Modulo de Campanas Promocionales

## Objetivo

El portal ahora incluye un modulo editorial para gestionar campanas promocionales desde el panel admin y mostrarlas en la web publica mediante un modal contextual.

## Alcance implementado

- CRUD editorial base para campanas:
  - crear
  - editar
  - cambiar estado (`draft`, `active`, `paused`, `archived`)
- Banner unico por campana con subida al mismo storage del proyecto (`local` o `s3`)
- Segmentacion por:
  - rutas (`*`, exactas o comodines simples como `/vehiculo/*`)
  - dispositivos (`desktop`, `tablet`, `mobile`)
- Configuracion de:
  - prioridad
  - delay en segundos
  - regla de frecuencia (`always`, `session`, `daily`, `once`)
  - CTA opcional
- Endpoint publico seguro que solo expone la campana activa mas prioritaria para el contexto solicitado
- Modal publico accesible con cierre por boton, backdrop y tecla `Escape`

## Endpoints

### Admin

- `GET /api/admin/campaigns`
- `POST /api/admin/campaigns`
- `GET /api/admin/campaigns/:id`
- `PUT /api/admin/campaigns/:id`
- `PATCH /api/admin/campaigns/:id/status`
- `POST /api/admin/campaigns/:id/image`
- `DELETE /api/admin/campaigns/:id/image`

Todas las rutas admin requieren sesion administrativa valida, CSRF y permiso `manageCampaigns`.

### Publico

- `GET /api/campaigns/active?route=/inventario&device=desktop`

Responde `campaign: null` si no existe una campana activa aplicable al contexto.

## Reglas operativas

- Una campana no puede activarse sin:
  - titulo
  - descripcion
  - banner
- Si se usa CTA, debe enviarse texto y URL juntos.
- El backend filtra por:
  - estado activo
  - ventana de fechas
  - prioridad
  - rutas objetivo
  - dispositivos objetivo

## Flujo de guardado en admin

Cuando el editor intenta activar una campana nueva con banner pendiente:

1. se guarda primero como borrador,
2. se sube el banner,
3. y luego se activa en silencio.

Eso evita exponer al usuario una logica tecnica de dependencias internas.

## Frecuencia en frontend

El modal publico usa almacenamiento del navegador:

- `sessionStorage` para frecuencia por sesion
- `localStorage` para frecuencia `daily` y `once`

No depende de cookies ni del dominio final del cliente.

## Archivos principales

### Backend

- `backend/src/models/Campaign.js`
- `backend/src/services/campaign.service.js`
- `backend/src/services/campaign-media.service.js`
- `backend/src/routes/admin/campaign.routes.js`
- `backend/src/routes/public/campaign.routes.js`
- `backend/src/validators/campaign.validators.js`

### Frontend

- `src/pages/AdminCampaignsPage.jsx`
- `src/components/campaigns/PromotionalCampaignModal.jsx`
- `src/lib/adminApi.js`
- `src/lib/publicApi.js`

## Verificacion ejecutada

- `npm --prefix backend run smoke`
- `npm run test:frontend:ci`
- `npm run build:frontend`

## Variables de entorno

Este modulo no introduce variables nuevas.
Reutiliza:

- configuracion de storage
- limites de upload
- CORS
- seguridad admin existente
