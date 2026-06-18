# Restaurant Management System (RMS)

Sistema web para administrar un restaurante. Maneja menú, ventas (POS), inventario, proveedores, clientes, gastos, sucursales, compras a proveedores y reportes.

---

## Requisitos

- **Node.js** v18+
- **Docker** (para MongoDB)
- **npm**

---

## Instalación y uso

### 1. Clonar e instalar dependencias

```bash
npm install
```

### 2. Iniciar MongoDB con Docker

```bash
# Descargar imagen de MongoDB 7
docker pull mongo:7

# Crear y ejecutar contenedor (standalone, sin replica set)
docker run -d --name mongodb-rms -p 27017:27017 mongo:7
```

Para verificar que MongoDB está corriendo:

```bash
docker ps
docker logs mongodb-rms
```

### 3. Configurar variables de entorno

Editar `.env` (ya existe con valores por defecto):

```
MONGODB_URI=mongodb://localhost:27017/rms
PORT=3000
SESSION_SECRET=super-secret-session-key-change-me
JWT_SECRET=muj7021
```

### 4. Iniciar servidor

```bash
node app.js
```

El servidor inicia en `http://localhost:3000`.

### 5. Registrar restaurante

1. Ir a `http://localhost:3000/` (Sign Up)
2. Completar formulario (dueño, restaurante, email, password)
3. Iniciar sesión en `/signin`

---

## Arquitectura General

Todo gira alrededor de un **restaurante** (cuenta del dueño). Cada request autenticado extrae el `restaurantId` del JWT, y **todas** las operaciones CRUD filtran por ese ID. Es un sistema **mono-restaurante**: un dueño, un restaurante, múltiples sucursales.

### Stack técnico

| Componente | Tecnología |
|------------|-----------|
| Backend | Node.js + Express |
| Base de datos | MongoDB 7 (Docker) |
| Motor de plantillas | EJS |
| Autenticación | JWT (cookie httpOnly) |
| PDF | pdfkit |
| Gráficos | ApexCharts |
| Estilos | Bootstrap 4 + template Dreamguys POS |

---

## Módulos del sistema

### 1. Autenticación

| Pantalla | Ruta | Descripción |
|----------|------|-------------|
| Sign Up | `/` | Crear cuenta de restaurante |
| Sign In | `/signin` | Iniciar sesión |
| Logout | POST `/api/log-out` | Cerrar sesión |

El JWT se guarda en cookie `jwt`. El middleware `requireAuth` lo descifra e inyecta `req.restaurant.restaurantId`.

### 2. Dashboard (`/index`)

Muestra estadísticas del día actual:
- **Total Earnings** — suma de ventas del día
- **Total Expenses** — suma de gastos del día
- **Total Orders** — cantidad de órdenes del día  
- **Total Purchases** — cantidad de compras del día
- **Most Sold Items** — top 7 productos más vendidos
- **List of items** — tabla rápida del menú

### 3. Food (Menú)

| Ruta | Descripción |
|------|-------------|
| `/pos` | **Punto de Venta (POS)** — seleccionar items, carrito, tipo de orden, cliente, checkout |
| `/addmenupage` | Agregar plato al menú |
| `/getmenu` | Lista de platos con editar/eliminar |
| `/edit-item/:id` | Editar plato individual |

**Flujo POS:**
1. Ver menú (checkboxes por plato)
2. Marcar items → se agregan al carrito lateral (cantidad ajustable)
3. Seleccionar cliente existente o crear uno nuevo
4. Elegir tipo de orden: Dine In / Take Away / Online
5. Checkout → `POST /api/placeorder`:
   - Guarda Order con items, total, tax
   - Vincula Customer si se seleccionó (`$push` a `orders[]`)
   - **Decrementa** InventoryItem.quantity (match por nombre)
   - Lee taxRate y printerConnection desde Settings
   - Intenta imprimir KOT + Bill (si hay impresora)

### 4. Report

| Ruta | Descripción |
|------|-------------|
| `/chart-js` | Gráfico ApexCharts con ventas del día |
| `/datechart` | Ventas filtradas por rango de fechas |

### 5. Suppliers / Inventory

| Ruta | Descripción |
|------|-------------|
| `/addinventory` | Crear items de inventario y proveedores |
| `/get-expense-list` | Lista de inventario con editar/eliminar |
| `/suppliers-list` | Lista de proveedores con eliminar |

**Regla de negocio:** POS **decrementa** inventario al vender; Purchase **incrementa** inventario al comprar. El match entre items se hace por nombre.

### 6. Expense

| Ruta | Descripción |
|------|-------------|
| `/addexpense` | Registrar gasto (categoría, monto, fecha, descripción) |
| `/getexpense` | Lista de gastos con editar/eliminar |

Gastos operativos: salarios, renta, servicios, marketing, etc.

### 7. Customers

| Ruta | Descripción |
|------|-------------|
| `/customers-list` | Lista de clientes con editar/eliminar |

Los clientes se crean desde POS o desde la lista. `Customer.orders[]` contiene referencias a las órdenes del cliente.

### 8. Branches

| Ruta | Descripción |
|------|-------------|
| `/branches` | Lista de sucursales |
| `/add-branch` | Crear sucursal |

### 9. Purchase (Compras)

| Ruta | Descripción |
|------|-------------|
| `/purchase-list` | Historial de compras a proveedores |
| `/add-purchase` | Registrar compra (proveedor, items, cantidades, precios) |

**Flujo:**
1. Seleccionar proveedor, fecha
2. Agregar items (nombre, cantidad, precio unitario — total automático)
3. Guardar → `POST /api/purchases`:
   - Crea Purchase
   - **Incrementa** InventoryItem.quantity (match por nombre)

### 10. Profile & Settings

| Ruta | Descripción |
|------|-------------|
| `/profile` | Editar nombre, email, teléfono, cambiar contraseña |
| `/settings` | Tema (claro/oscuro), tasa de impuesto, símbolo de moneda, conexión de impresora |

**Conexiones:**
- `taxRate` → usado en POS para calcular impuesto
- `currencySymbol` → mostrado en POS y dashboard
- `printerConnection` → usado por `printOrder()` para KOT/Bill
- `theme` → guardado en localStorage, aplica clase CSS `dark-mode`

---

## Diagrama de flujo de datos

```
                    ┌──────────────────┐
                    │   RESTAURANT     │
                    │  (cuenta dueño)  │
                    └────────┬─────────┘
                             │ restaurantId
              ┌──────────────┼──────────────────┐
              │              │                   │
              ▼              ▼                   ▼
        ┌──────────┐   ┌──────────┐   ┌──────────────────┐
        │ Settings │   │ Profile  │   │    Branches      │
        │(taxRate, │   │(password)│   │(sucursales)      │
        │currency, │   └──────────┘   └──────────────────┘
        │printer)  │
        └────┬─────┘
             │ taxRate, currency
             ▼
    ┌────────────────┐     ┌───────────────┐
    │     POS /      │────>│    Orders     │────> Dashboard
    │   Billing      │     │ (decrementa   │
    │                │     │  inventory)   │
    └────────────────┘     └───────┬───────┘
                                   │ customerId
                                   ▼
                            ┌──────────────┐
                            │  Customers   │
                            │ orders[]     │
                            └──────────────┘

    ┌────────────────┐     ┌───────────────┐
    │   Purchase     │────>│  Inventory    │<──── POS (decrementa)
    │ (incrementa    │     │  Items        │
    │  inventory)    │     └───────┬───────┘
    └────────────────┘             │ supplier ref
                                   ▼
                            ┌──────────────┐
                            │  Suppliers   │
                            └──────────────┘

    ┌────────────────┐
    │   Expenses     │────> Dashboard
    └────────────────┘

    ┌────────────────┐
    │   Menu Items   │────> POS, Dashboard
    └────────────────┘
```

---

## Conexiones clave entre módulos

| Origen | Destino | Detalle |
|--------|---------|---------|
| POS Checkout | InventoryItem | Decrementa quantity por nombre |
| Purchase | InventoryItem | Incrementa quantity por nombre |
| POS Checkout | Customer | Push orderId a orders[] |
| Settings.taxRate | POS Order | Calcula tax = subtotal * taxRate / 100 |
| Settings.printer | POS Order | Imprime KOT + Bill |
| Dashboard | Orders | Suma earnings, cuenta órdenes |
| Dashboard | Expenses | Suma total de gastos |
| Dashboard | Purchases | Cuenta compras del día |
| Supplier | InventoryItem | Ref ObjectId supplier |
| Menu | Order | Items seleccionados → orderItems[] |

---

## Exportaciones

Todas las listas principales tienen botones para exportar **PDF** y **CSV**:

- Menú
- Órdenes
- Clientes
- Gastos
- Inventario
- Sucursales
- Proveedores
- Ventas (con filtro de fechas)
- Compras

---

## API endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/signup` | Registrar restaurante |
| POST | `/api/signin` | Iniciar sesión |
| POST | `/api/log-out` | Cerrar sesión |
| POST | `/api/addmenu` | Agregar plato |
| PUT | `/api/menu/:id` | Actualizar plato |
| DELETE | `/api/menu/:id` | Eliminar plato |
| POST | `/api/placeorder` | Crear orden (POS) |
| DELETE | `/api/orders/:id` | Cancelar orden |
| POST | `/api/addinventory` | Agregar item de inventario |
| PUT | `/api/inventory/:id` | Actualizar item de inventario |
| DELETE | `/deleteinventory/:id` | Eliminar item de inventario |
| POST | `/api/create` | Crear proveedor |
| PUT | `/api/updatesuppliers/:id` | Actualizar proveedor |
| DELETE | `/api/deletesuppliers/:id` | Eliminar proveedor |
| POST | `/api/addexpense` | Agregar gasto |
| PUT | `/api/expense/:id` | Actualizar gasto |
| DELETE | `/deleteexpense/:id` | Eliminar gasto |
| POST | `/customers/create` | Crear cliente |
| PUT | `/customers/:id` | Actualizar cliente |
| DELETE | `/customers/:id` | Eliminar cliente |
| POST | `/api/branches` | Crear sucursal |
| PUT | `/api/branches/:id` | Actualizar sucursal |
| DELETE | `/api/branches/:id` | Eliminar sucursal |
| POST | `/api/purchases` | Crear compra |
| DELETE | `/api/purchases/:id` | Eliminar compra |
| PUT | `/api/profile` | Actualizar perfil |
| PUT | `/api/profile/password` | Cambiar contraseña |
| PUT | `/api/settings` | Actualizar configuración |

---

## Idiomas

El sistema soporta **Español** e **Inglés** mediante traducción client-side. Se selecciona desde el menú de banderas en el header. La preferencia se guarda en `localStorage`.

---

## Notas técnicas

- **MongoDB standalone**: No usa replica set, por lo tanto no hay transacciones. Las operaciones atómicas se manejan con `findOneAndUpdate`, `$push`, `$inc`.
- **Impresora térmica**: Opcional. La conexión se configura en Settings. Usa `node-thermal-printer`.
- **Tema oscuro**: Se guarda en `localStorage` y se aplica mediante clase CSS `dark-mode` al `<body>`.
