# Benzan Auto - Correo Productivo

## Objetivo
Dejar el backend preparado para correo transaccional real sin incrustar credenciales ni depender todavía del dominio final del cliente.

## Alcance actual
El sistema ya puede enviar correos para:
- creación de usuario admin
- recuperación de contraseña
- confirmación de cambio de contraseña
- bloqueo y desbloqueo de usuarios

## Modos soportados

### 1. `EMAIL_PROVIDER=disabled`
Uso recomendado cuando todavía no existe proveedor SMTP real.

Comportamiento:
- el backend no intenta enviar correos
- `/health` sigue disponible sin exponer detalle interno del proveedor
- la aplicación sigue operando

### 2. `EMAIL_PROVIDER=smtp`
Uso recomendado cuando ya existe un proveedor transaccional real.

Comportamiento:
- el backend arma un transporte SMTP real con verificación opcional al arranque
- puede verificarse manualmente con:

```bash
npm --prefix backend run email:verify
```

## Variables operativas

### Requeridas si `EMAIL_PROVIDER=smtp`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`

### Recomendadas
- `EMAIL_FROM_NAME`
- `EMAIL_REPLY_TO`
- `SMTP_REQUIRE_TLS`
- `SMTP_POOL`
- `SMTP_CONNECTION_TIMEOUT_MS`
- `SMTP_GREETING_TIMEOUT_MS`
- `SMTP_SOCKET_TIMEOUT_MS`
- `SMTP_TLS_SERVERNAME`
- `SMTP_VERIFY_ON_STARTUP`

## Bloque sugerido para Railway cuando actives SMTP real

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_POOL=true
SMTP_CONNECTION_TIMEOUT_MS=10000
SMTP_GREETING_TIMEOUT_MS=10000
SMTP_SOCKET_TIMEOUT_MS=20000
SMTP_TLS_SERVERNAME=
SMTP_VERIFY_ON_STARTUP=true
SMTP_USER=usuario_smtp
SMTP_PASS=secret_smtp
EMAIL_FROM=no-reply@tu-dominio.com
EMAIL_FROM_NAME=Benzan Auto Admin
EMAIL_REPLY_TO=soporte@tu-dominio.com
```

## Validación recomendada antes de activar en producción
1. Cargar variables en Railway.
2. Ejecutar `npm run email:verify` desde la consola del backend.
3. Confirmar en logs que aparezca `smtp_verification_completed` o `smtp_bootstrap_verified`.
4. Probar:
   - forgot password
   - create user
   - change password
   - block/unblock user

## Estado actual mientras falta el dominio del cliente
Como todavía no tenemos el dominio final, lo profesional hoy es:
- dejar `EMAIL_PROVIDER=disabled` en producción si no existe proveedor legítimo
- no improvisar con cuentas personales incrustadas
- no depender del dominio temporal de Railway para reputación de correo final

## Pendiente cuando llegue el dominio del cliente
Al recibir el dominio final, completar:
- SPF
- DKIM
- DMARC
- dirección `EMAIL_FROM` definitiva
- `EMAIL_REPLY_TO` real
- validación final de entregabilidad

## Notas operativas
- Railway no sustituye un proveedor SMTP transaccional profesional.
- La verificación de SMTP al arranque no bloquea el backend; sirve como señal temprana.
- `/ready` sigue enfocado en disponibilidad de aplicación y base de datos.
- el detalle operativo de SMTP debe revisarse por logs estructurados o con `npm --prefix backend run email:verify`, no por un healthcheck público detallado.
