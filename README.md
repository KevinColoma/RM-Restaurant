# RMS - Restaurant Management System

Sistema de gestión restaurantera con POS, inventario, proveedores, gastos,
reportes y más. Disponible como **SSR (EJS)** y como **SPA (Vite + vanilla JS)**.

## Stack

| Capa       | Tecnología                         |
|------------|------------------------------------|
| Backend    | Node.js, Express, Mongoose, JWT    |
| Frontend   | EJS (SSR) + SPA en Vite (vanilla JS) |
| DB         | MongoDB Atlas                      |
| Auth       | JWT + bcrypt                       |
| UI         | Bootstrap 5, DataTables, Chart.js, SweetAlert2, ApexCharts |
| CI/CD      | GitHub Actions, SonarCloud, CodeQL, Telegram |

## Estructura
 
```
RMS-restaurant-management-system-nodejs/
├── backend/          ← Express + EJS + API
│   ├── controllers/  models/  routes/  middleware/  utils/
│   ├── views/        public/  scripts/
│   ├── app.js        package.json  .env
│   └── node_modules/
├── frontend/         ← SPA (Vite)
│   ├── src/  public/  dist/
│   └── package.json  vite.config.js
├── docs/             ← Diagramas, plan de refactor
├── .github/workflows/  ← CI/CD pipelines
└── sonar-project.properties
```

## Requisitos

- Node.js 18+
- MongoDB (local con Docker: `docker compose up -d`, o Atlas)

## Instalación

```bash
cd backend
npm install
cd ../frontend
npm install
cd ..
```

## Ejecutar

### Backend (SSR con EJS)

```bash
cd backend
node app.js
# → http://localhost:3000
```

### Frontend (SPA con Vite)

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

## Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

## CI/CD

| Evento | Workflow | Acción |
|--------|----------|--------|
| Push/PR a `dev` o `test` | `ci-pr.yml` | Lint, test, SonarCloud, CodeQL, notifica fallo a Telegram |
| Push/merge a `main` | `deploy-main.yml` | CI + deploy a Render, notifica éxito/fallo a Telegram |
| Release publicada | `release.yml` | Test, SonarCloud, deploy a Render, notifica a Telegram |

## Funcionalidades

- POS con carrito, facturación térmica
- CRUD de menú, inventario, proveedores, clientes, gastos, compras
- Órdenes: Dine In / Take Away / Online
- Múltiples sucursales
- Reportes de ventas (Chart.js, ApexCharts, PDF, CSV)
- Auditoría de acciones
- i18n ES/EN, modo oscuro
- Roles: admin, cajero, cocinero
