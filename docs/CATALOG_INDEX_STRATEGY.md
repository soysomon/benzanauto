# Benzan Auto - Estrategia de Índices del Catálogo

## Objetivo
Dejar el catálogo público y sus consultas derivadas preparados para crecer sin agregar índices redundantes ni depender de `autoIndex` en producción.

Importante:
- En `production`, Mongoose usa `autoIndex: false`.
- Los índices nuevos deben aplicarse conscientemente con un paso operativo controlado.

## Consultas reales revisadas

### 1. Listado público principal
Servicio: `backend/src/services/vehicle.service.js`

Consulta real:
- `Vehicle.find(filter).sort({ featured: -1, publishedAt: -1, createdAt: -1 })`
- siempre filtra `status: 'published'`
- soporta paginación y filtros de catálogo

Uso:
- `/api/vehicles`
- página pública `/inventario`
- listados públicos auxiliares

### 2. Vehículos destacados
Servicio: `backend/src/services/vehicle.service.js`

Consulta real:
- `Vehicle.find({ status: 'published', featured: true }).sort({ publishedAt: -1, createdAt: -1 })`

Uso:
- `/api/vehicles/featured`
- home pública

### 3. Snapshot de inventario para Benzan IA
Servicio: `backend/src/services/chatInventory.service.js`

Consulta real:
- `Vehicle.find({ status: 'published' }).sort({ featured: -1, publishedAt: -1, createdAt: -1 })`

Uso:
- asistente Benzan IA

### 4. Vehículos relacionados y filtro por marca
Servicio: `backend/src/services/vehicle.service.js`

Consulta real:
- `listPublicVehicles({ brand: [detail.brand], limit: 4 })`
- mismo orden principal del catálogo

Uso:
- detalle público `/vehiculo/:slug`
- filtros por marca en inventario

## Índices agregados

### `vehicle_public_recent_idx`
Definición:

```js
{ status: 1, publishedAt: -1, createdAt: -1 }
```

Con:

```js
{ partialFilterExpression: { status: 'published' } }
```

Justificación:
- optimiza listados públicos recientes
- ayuda a recorridos de catálogo publicados sin cargar drafts o vendidos
- reduce el tamaño del índice al cubrir solo documentos públicos

### `vehicle_public_featured_recent_idx`
Definición:

```js
{ status: 1, featured: -1, publishedAt: -1, createdAt: -1 }
```

Con:

```js
{ partialFilterExpression: { status: 'published' } }
```

Justificación:
- optimiza el sort por relevancia real del catálogo público
- sirve directamente a `/api/vehicles/featured`
- sirve también al snapshot de Benzan IA y al orden por defecto del catálogo

### `vehicle_public_brand_recent_idx`
Definición:

```js
{ status: 1, brand: 1, featured: -1, publishedAt: -1, createdAt: -1 }
```

Con:

```js
{ partialFilterExpression: { status: 'published' } }
```

Justificación:
- acelera filtros públicos por marca
- acelera “vehículos relacionados” en el detalle
- mantiene el mismo orden esperado sin reordenamientos caros

## Índices existentes que se mantienen

Se mantienen por ahora:
- `slug` único
- `legacyId` único sparse
- text index de búsqueda (`title`, `brand`, `model`, `description`, `features`)
- índices individuales heredados sobre filtros y métricas
- compound existente `{ status, brand, price }`

Motivo:
- todavía sirven a rutas mixtas y filtros secundarios
- removerlos sin profiler/telemetría real sería una optimización prematura y riesgosa

## Índices deliberadamente NO agregados todavía

No se agregaron aún compuestos dedicados para:
- `bodyType`
- `fuelType`
- `condition`
- `price asc/desc`
- `year asc/desc`
- `views desc`
- `contactCount desc`

Motivo:
- el catálogo actual todavía puede apoyarse en índices existentes y tamaño de dataset razonable
- cada nuevo índice aumenta costo de escritura, memoria e inicialización
- conviene esperar profiler/`explain()` real en staging o producción controlada

## Cómo revisar y aplicar índices

### 1. Revisar diff

```bash
npm --prefix backend run indexes:diff
```

### 2. Aplicar sync

```bash
npm --prefix backend run indexes:sync
```

## Recomendación operativa para Railway

1. Ejecutar primero en staging.
2. Revisar el diff antes de aplicar.
3. Aplicar en una ventana controlada.
4. Validar después:
   - `/api/vehicles`
   - `/api/vehicles/featured`
   - detalle `/api/vehicles/:slug`
   - Benzan IA
   - dashboard admin

## Validación posterior recomendada

- correr `explain()` en staging para:
  - listado público sin filtros
  - listado por marca
  - destacados
- revisar latencia en Railway
- confirmar que no sube de forma sensible el tiempo de escritura de vehículo/imágenes/publicación
