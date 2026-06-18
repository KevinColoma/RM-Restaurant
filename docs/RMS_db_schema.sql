-- ============================================
-- RMS - Restaurant Management System
-- Esquema SQL relacional normalizado
-- Persona / Rol / Usuario
-- ============================================

CREATE TABLE personas (
    id              VARCHAR(24) PRIMARY KEY,
    ownerName       VARCHAR(100),
    restaurantName  VARCHAR(100),
    city            VARCHAR(100),
    address         TEXT,
    mobile          VARCHAR(20),
    currencySymbol  VARCHAR(10) DEFAULT '$',
    printerConnection VARCHAR(255),
    taxRate         DECIMAL(5,2) DEFAULT 0,
    theme           VARCHAR(50) DEFAULT 'light',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id              VARCHAR(24) PRIMARY KEY,
    nombre          VARCHAR(50) NOT NULL,
    descripcion     TEXT
);

CREATE TABLE usuarios (
    id              VARCHAR(24) PRIMARY KEY,
    username        VARCHAR(100) UNIQUE NOT NULL,
    password        VARCHAR(255) NOT NULL,
    persona_id      VARCHAR(24) NOT NULL,
    rol_id          VARCHAR(24) NOT NULL,
    isadmin         BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (persona_id) REFERENCES personas(id),
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

CREATE TABLE customers (
    id              VARCHAR(24) PRIMARY KEY,
    name            VARCHAR(100),
    phone           VARCHAR(50),
    address         TEXT,
    persona_id      VARCHAR(24) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (persona_id) REFERENCES personas(id)
);

CREATE TABLE customer_orders (
    customer_id     VARCHAR(24) NOT NULL,
    order_id        VARCHAR(24) NOT NULL,
    PRIMARY KEY (customer_id, order_id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE menus (
    id              VARCHAR(24) PRIMARY KEY,
    persona_id      VARCHAR(24) NOT NULL,
    item            VARCHAR(100),
    category        VARCHAR(100),
    sub_category    VARCHAR(100),
    price           DECIMAL(10,2),
    availability    BOOLEAN DEFAULT true,
    FOREIGN KEY (persona_id) REFERENCES personas(id)
);

CREATE TABLE orders (
    id              VARCHAR(24) PRIMARY KEY,
    persona_id      VARCHAR(24) NOT NULL,
    customer_id     VARCHAR(24),
    tax_amount      DECIMAL(10,2) DEFAULT 0,
    total_amount    DECIMAL(10,2) DEFAULT 0,
    order_type      VARCHAR(20),
    comment         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (persona_id) REFERENCES personas(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        VARCHAR(24) NOT NULL,
    menu_item_id    VARCHAR(24) NOT NULL,
    quantity        INT NOT NULL,
    price           DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menus(id)
);

CREATE TABLE suppliers (
    id              VARCHAR(24) PRIMARY KEY,
    persona_id      VARCHAR(24) NOT NULL,
    name            VARCHAR(100),
    contact_info    TEXT,
    FOREIGN KEY (persona_id) REFERENCES personas(id)
);

CREATE TABLE inventoryitems (
    id              VARCHAR(24) PRIMARY KEY,
    persona_id      VARCHAR(24) NOT NULL,
    name            VARCHAR(100),
    quantity        DECIMAL(10,2) DEFAULT 0,
    price           DECIMAL(10,2) DEFAULT 0,
    supplier_id     VARCHAR(24),
    FOREIGN KEY (persona_id) REFERENCES personas(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE expenses (
    id              VARCHAR(24) PRIMARY KEY,
    persona_id      VARCHAR(24) NOT NULL,
    expense_type    VARCHAR(100),
    expense_date    DATE,
    amount          DECIMAL(10,2),
    description     TEXT,
    payment_method  VARCHAR(50),
    invoice_number  VARCHAR(100),
    vendor          VARCHAR(100),
    category        VARCHAR(100),
    receipt_url     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (persona_id) REFERENCES personas(id)
);

CREATE TABLE purchases (
    id              VARCHAR(24) PRIMARY KEY,
    persona_id      VARCHAR(24) NOT NULL,
    supplier_id     VARCHAR(24),
    total_amount    DECIMAL(10,2),
    purchase_date   DATE,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (persona_id) REFERENCES personas(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE purchase_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id     VARCHAR(24) NOT NULL,
    item_name       VARCHAR(100),
    quantity        DECIMAL(10,2),
    unit_price      DECIMAL(10,2),
    total_price     DECIMAL(10,2),
    FOREIGN KEY (purchase_id) REFERENCES purchases(id)
);

CREATE TABLE auditlogs (
    id              VARCHAR(24) PRIMARY KEY,
    persona_id      VARCHAR(24) NOT NULL,
    action          VARCHAR(20),
    collection_name VARCHAR(50),
    document_id     VARCHAR(24),
    details         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (persona_id) REFERENCES personas(id)
);

CREATE TABLE restbranchschemas (
    id              VARCHAR(24) PRIMARY KEY,
    persona_id      VARCHAR(24) NOT NULL,
    parent_rest     VARCHAR(100),
    owner_name      VARCHAR(100),
    branch_name     VARCHAR(100),
    city            VARCHAR(100),
    address         TEXT,
    email           VARCHAR(100),
    mobile          VARCHAR(20),
    FOREIGN KEY (persona_id) REFERENCES personas(id)
);
