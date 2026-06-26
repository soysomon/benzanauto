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

## Documentacion

- Contrato API: [docs/api-contract.md](./docs/api-contract.md)

