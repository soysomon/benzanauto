# Benzan Auto Backend

Backend Express + MongoDB para inventario publico y dashboard admin.

## Comandos

```bash
npm install
npm run dev
npm run seed
npm run smoke
```

## Variables requeridas

Usa [`.env.example`](./.env.example) como base. Las claves minimas para arrancar son:

- `MONGODB_URI`
- `JWT_SECRET`
- `SUPERADMIN_NAME`
- `SUPERADMIN_USERNAME`
- `SUPERADMIN_PASSWORD`

## Railway

Checklist recomendado para produccion:

- Backend
  - Root directory: `backend`
  - Start command: `npm start`
  - No definas `PORT` manualmente. Railway la inyecta.
  - `MONGODB_URI` debe apuntar a una base real de produccion, no a `127.0.0.1`.
  - `TRUST_PROXY=true`
  - Si usas S3: `STORAGE_DRIVER=s3` y completa `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL`
- Frontend
  - `VITE_API_URL` debe apuntar al backend publico, por ejemplo `https://backend-benzanauto-production.up.railway.app`

Validacion rapida despues del deploy:

1. `GET /health` del backend debe responder `200`.
2. `https://tu-frontend/admin-login` debe mostrar la pantalla de acceso admin.
3. Iniciar sesion debe responder contra `/api/admin/auth/login` sin errores CORS ni `502`.

## Documentacion

- Contrato API: [docs/api-contract.md](./docs/api-contract.md)
