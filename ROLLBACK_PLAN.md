# Benzan Auto - Rollback Plan

## Objetivo
Definir como desplegar cambios de endurecimiento con posibilidad real de retroceso, sin improvisar sobre produccion.

Este plan aplica para:
- frontend en Railway
- backend en Railway
- variables de entorno
- MongoDB administrado
- activos de imagenes

## Principios
- no desplegar cambios criticos sin backup previo
- no mezclar cambios de varias fases en un solo release grande
- cada release debe poder revertirse por commit, por deployment o por configuracion
- evitar cambios destructivos no reversibles en base de datos

## Preparacion antes de cualquier despliegue

### 1. Codigo
- trabajar en rama dedicada
- merge controlado, nunca hotfix manual en produccion sin registro
- dejar commit de release identificable

### 2. Base de datos
Antes de fases que toquen modelos, indices o datos:
- confirmar backup/snapshot reciente de MongoDB Atlas
- exportar colecciones sensibles si el cambio es estructural:
  - `users`
  - `vehicles`
  - `adminsessions`
  - `auditlogs`

### 3. Variables de entorno
Antes de cambiar Railway:
- exportar o copiar configuracion actual de frontend
- exportar o copiar configuracion actual de backend
- documentar fecha, entorno y responsable del cambio

### 4. Evidencia tecnica
Antes de deploy:
- `npm run build`
- `npm --prefix backend run smoke`
- checklist QA critica aprobada

## Tipos de rollback

### A. Rollback de frontend
Usar cuando:
- falla UI publica
- se rompe navegacion
- se rompe login visual
- aparece error JS critico

Accion:
1. redeploy del ultimo deployment estable en Railway, o
2. revert del commit de frontend y nuevo deploy controlado

Validacion posterior:
- home carga
- inventario carga
- detalle carga
- admin-login carga

### B. Rollback de backend
Usar cuando:
- falla login
- fallan endpoints admin
- fallan APIs publicas
- health/ready no responden correctamente

Accion:
1. redeploy del ultimo deployment estable del backend, o
2. revert del commit backend y nuevo deploy controlado

Validacion posterior:
- `/health`
- `/ready`
- login admin
- listado publico
- detalle publico
- flujo de publicacion

### C. Rollback de variables de entorno
Usar cuando:
- CORS falla
- URLs publicas cambian incorrectamente
- storage deja de resolver
- credenciales invalidas rompen servicios

Accion:
1. restaurar set anterior de variables
2. redeploy manual del servicio afectado

Validacion posterior:
- frontend conecta con backend correcto
- admin puede autenticarse
- catalogo publico responde
- imagenes cargan

### D. Rollback de base de datos
Usar solo cuando:
- hubo cambio destructivo real
- se corrupto informacion
- una migracion o script altero documentos criticos

Accion:
1. detener nuevos cambios
2. identificar ventana temporal exacta
3. restaurar snapshot o import controlado de colecciones
4. redeploy de la version compatible con los datos restaurados

Advertencia:
- evitar rollback de base de datos si hubo nuevas altas o publicaciones validas despues del cambio
- priorizar correccion forward cuando el rollback implique perdida de datos recientes

## Triggers de rollback
Debe considerarse rollback inmediato si ocurre cualquiera de estos eventos:
- smoke o QA critica falla despues del deploy
- login admin deja de funcionar
- inventario publico deja de cargar
- detalle por slug deja de resolver
- subida de imagenes falla en produccion
- errores 5xx sostenidos
- aumento claro de 401/403/429 inesperados
- healthcheck o readiness degradado sostenidamente

## Orden recomendado de respuesta ante incidente
1. Confirmar alcance del fallo
2. Determinar si afecta frontend, backend, variables o datos
3. Decidir rollback o hotfix segun impacto
4. Ejecutar rollback del componente minimo necesario
5. Validar rutas criticas
6. Documentar causa raiz antes de reintentar el cambio

## Checklist de validacion despues de rollback
- home publica operativa
- inventario operativo
- detalle operativo
- admin-login operativo
- dashboard operativo
- publicacion de vehiculo operativa
- imagenes visibles
- health y ready correctos

## Estrategia de despliegue segura para fases siguientes
- un lote pequeno por deploy
- no mezclar hardening, SEO y performance en una sola subida
- si hay cambio de session/auth, desplegar con ventana controlada
- si hay cambio de indices, ejecutarlo fuera de hora pico
- si hay cambio de variables, registrar valor anterior y valor nuevo

## Pendientes antes de releases mayores
- definir staging real equivalente a produccion
- definir responsable de aprobacion QA
- definir responsable de rollback
- definir politica de backup previa por fase

## Estado actual
- Este plan se crea en Fase 0
- No se ha ejecutado rollback
- No se ha intervenido produccion directamente como parte de esta fase
