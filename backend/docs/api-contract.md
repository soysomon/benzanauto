# Benzan Auto Admin API Contract

## Objetivo

Este backend expone dos superficies:

- API publica para el frontend del sitio de vehiculos.
- API privada para el dashboard admin y la gestion segura de usuarios/inventario.

La API publica mantiene compatibilidad con los filtros que ya usa el frontend actual:

- `marca`
- `tipo`
- `categoria`
- `combustible`
- `precioMax`
- `estado`
- `orden`

Tambien soporta filtros normalizados para el dashboard o futuras integraciones.

## Autenticacion Admin

### `POST /api/admin/auth/login`

Request:

```json
{
  "username": "superadmin",
  "password": "SuperSecret123!"
}
```

Response:

```json
{
  "message": "Inicio de sesion exitoso.",
  "token": "jwt-access-token",
  "expiresIn": 43200,
  "session": {
    "id": "666000000000000000000001",
    "expiresAt": "2026-06-11T23:59:59.000Z"
  },
  "user": {
    "id": "666000000000000000000010",
    "name": "Super Admin",
    "username": "superadmin",
    "email": "admin@benzan.com",
    "role": "superadmin",
    "isActive": true,
    "lastLoginAt": "2026-06-11T12:00:00.000Z",
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-06-11T12:00:00.000Z"
  }
}
```

### `GET /api/admin/auth/me`

Header:

```txt
Authorization: Bearer <token>
```

Response:

```json
{
  "user": {
    "id": "666000000000000000000010",
    "name": "Super Admin",
    "username": "superadmin",
    "email": "admin@benzan.com",
    "role": "superadmin",
    "isActive": true
  },
  "session": {
    "id": "666000000000000000000001",
    "expiresAt": "2026-06-11T23:59:59.000Z"
  }
}
```

### `POST /api/admin/auth/logout`

Response:

```json
{
  "message": "Sesion cerrada correctamente."
}
```

### `PATCH /api/admin/auth/change-password`

Request:

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

## Usuarios Admin

### Roles

- `superadmin`: acceso total
- `admin`: inventario y usuarios limitados
- `editor`: crea/edita/publica vehiculos, sin gestion destructiva de usuarios
- `viewer`: solo lectura

### `GET /api/admin/users`

Query opcional:

- `page`
- `limit`
- `search`
- `role`
- `isActive`

Response:

```json
{
  "data": [
    {
      "id": "666000000000000000000010",
      "name": "Super Admin",
      "username": "superadmin",
      "email": "admin@benzan.com",
      "role": "superadmin",
      "isActive": true,
      "lastLoginAt": "2026-06-11T12:00:00.000Z",
      "createdAt": "2026-06-01T10:00:00.000Z",
      "updatedAt": "2026-06-11T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### `POST /api/admin/users`

Request:

```json
{
  "name": "Editor Inventario",
  "username": "editor1",
  "email": "editor@benzan.com",
  "password": "EditorPass123!",
  "role": "editor",
  "isActive": true
}
```

### `PATCH /api/admin/users/:id/status`

```json
{
  "isActive": false
}
```

### `PATCH /api/admin/users/:id/role`

```json
{
  "role": "viewer"
}
```

## Vehiculos Publicos

### `GET /api/vehicles`

Query soportada:

- `page`, `limit`
- `q`
- `brand`, `model`
- `condition`
- `transmission`
- `fuelType`
- `bodyType`
- `featured`
- `minPrice`, `maxPrice`
- `minYear`, `maxYear`
- `sort`

Compatibilidad con frontend actual:

- `marca` => `brand`
- `tipo` o `categoria` => `bodyType`
- `combustible` => `fuelType`
- `precioMax` => `maxPrice`
- `estado` => `condition`
- `orden` => `sort`

Response:

```json
{
  "data": [
    {
      "id": "666000000000000000000100",
      "slug": "toyota-land-cruiser-gr-sport-2024",
      "title": "Toyota Land Cruiser GR Sport 2024",
      "brand": "Toyota",
      "model": "Land Cruiser GR Sport",
      "year": 2024,
      "price": 169900,
      "currency": "USD",
      "mileage": 0,
      "transmission": "Automático",
      "fuelType": "Diesel",
      "fuel": "Diesel",
      "bodyType": "SUV",
      "category": "SUV",
      "drivetrain": "4x4",
      "traction": "4x4",
      "color": "Negro Onix",
      "condition": "Nuevo",
      "status": "Nuevo",
      "location": "San Juan de la Maguana, RD",
      "description": "Descripcion corta...",
      "features": ["Camara 360", "Cuero premium"],
      "featured": true,
      "badge": "Destacado",
      "mainImage": "/uploads/vehicles/666.../cover.webp",
      "image": "/uploads/vehicles/666.../cover.webp",
      "images": [
        {
          "id": "666000000000000000000900",
          "url": "/uploads/vehicles/666.../cover.webp",
          "width": 1920,
          "height": 1280,
          "size": 182340,
          "order": 0,
          "isMain": true
        }
      ],
      "gallery": ["/uploads/vehicles/666.../cover.webp"],
      "views": 120,
      "contactCount": 5,
      "publishedAt": "2026-06-11T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 1,
    "pages": 1
  },
  "facets": {
    "brands": [
      { "value": "Toyota", "count": 1 }
    ],
    "bodyTypes": [
      { "value": "SUV", "count": 1 }
    ],
    "fuelTypes": [
      { "value": "Diesel", "count": 1 }
    ],
    "conditions": [
      { "value": "Nuevo", "count": 1 }
    ]
  }
}
```

### `GET /api/vehicles/featured`

Lista de destacados publicados.

### `GET /api/vehicles/:slug`

Devuelve el detalle publico e incrementa `views` con proteccion anti-spam por IP y ventana temporal.

## Vehiculos Admin

### `GET /api/admin/vehicles`

Permite listar todos los estados:

- `draft`
- `published`
- `sold`
- `archived`

Query:

- `page`, `limit`
- `q`
- `status`
- `featured`
- `brand`
- `condition`
- `sort`

### `POST /api/admin/vehicles`

Request:

```json
{
  "title": "Toyota Land Cruiser GR Sport 2024",
  "brand": "Toyota",
  "model": "Land Cruiser GR Sport",
  "year": 2024,
  "price": 169900,
  "currency": "USD",
  "mileage": 0,
  "transmission": "Automático",
  "fuelType": "Diesel",
  "bodyType": "SUV",
  "drivetrain": "4x4",
  "color": "Negro Onix",
  "condition": "Nuevo",
  "vin": "JTMW1234567890123",
  "location": "San Juan de la Maguana, RD",
  "description": "Descripcion larga del vehiculo",
  "features": ["Camara 360", "Cuero premium"],
  "badge": "Destacado",
  "featured": true,
  "status": "draft",
  "seoTitle": "Toyota Land Cruiser GR Sport 2024 en RD",
  "seoDescription": "Disponible en Benzan Auto Import",
  "specs": {
    "motor": "V6 3.3L Twin-Turbo Diesel",
    "potencia": "304 HP"
  }
}
```

### `PUT /api/admin/vehicles/:id`

Mismo payload que create, con soporte adicional:

```json
{
  "mainImageId": "666000000000000000000900",
  "imageOrder": [
    "666000000000000000000900",
    "666000000000000000000901"
  ]
}
```

### `PATCH /api/admin/vehicles/:id/publish`

```json
{
  "publishedAt": "auto"
}
```

### `PATCH /api/admin/vehicles/:id/unpublish`

Pasa a `draft`.

### `PATCH /api/admin/vehicles/:id/sold`

Pasa a `sold` y asigna `soldAt`.

### `PATCH /api/admin/vehicles/:id/featured`

```json
{
  "featured": true
}
```

### `POST /api/admin/vehicles/:id/images`

`multipart/form-data`

- campo `images`: multiples archivos
- campo opcional `mainImageIndex`
- campo opcional `setAsMain`

Cada imagen se re-encodea a WebP y se guarda con nombre seguro.

### `DELETE /api/admin/vehicles/:id/images/:imageId`

Elimina archivo del disco y actualiza `mainImage` si era necesario.

## Dashboard

### `GET /api/admin/dashboard/stats`

Response:

```json
{
  "counts": {
    "totalVehicles": 25,
    "publishedVehicles": 18,
    "draftVehicles": 4,
    "soldVehicles": 2,
    "archivedVehicles": 1,
    "featuredVehicles": 6,
    "totalViews": 2400,
    "totalContacts": 42,
    "activeAdminUsers": 3
  },
  "recentVehicles": [],
  "topViewedVehicles": [],
  "topContactedVehicles": [],
  "usersByRole": {
    "superadmin": 1,
    "admin": 1,
    "editor": 1,
    "viewer": 0
  }
}
```

## Respuestas de Error

Formato comun:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Hay campos invalidos en la solicitud.",
    "details": {
      "fieldErrors": {
        "price": ["El precio debe ser mayor que cero."]
      }
    }
  }
}
```
