-- ============================================
-- EV3 Cloud - Esquema de Base de Datos
-- Ejecutar en PostgreSQL RDS
-- ============================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(6),
    verification_code_expires TIMESTAMP,
    storage_used_bytes BIGINT DEFAULT 0,
    storage_limit_bytes BIGINT DEFAULT 2147483648,  -- 2 GB
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de carrito
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Tabla de órdenes/compras
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_id VARCHAR(255),
    payment_status VARCHAR(50),
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Detalle de órdenes
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
);

-- Tabla de archivos del usuario
CREATE TABLE IF NOT EXISTS user_files (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    file_key VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Datos iniciales: productos de ejemplo
-- ============================================
INSERT INTO products (name, description, price, stock, image_url) VALUES
    ('Notebook Lenovo IdeaPad',  'Laptop 15.6" 8GB RAM 256GB SSD',       499990, 10, 'https://placehold.co/300x200?text=Notebook'),
    ('Mouse Logitech G203',      'Mouse gaming RGB 8000 DPI',             24990,  50, 'https://placehold.co/300x200?text=Mouse'),
    ('Teclado Redragon Kumara',  'Teclado mecánico TKL Red Switch',       34990,  30, 'https://placehold.co/300x200?text=Teclado'),
    ('Monitor Samsung 24"',      'Monitor FHD IPS 75Hz',                  149990, 15, 'https://placehold.co/300x200?text=Monitor'),
    ('Audífonos HyperX Cloud',   'Audífonos gaming 7.1 surround',        59990,  25, 'https://placehold.co/300x200?text=Audifonos'),
    ('Webcam Logitech C920',     'Webcam Full HD 1080p con micrófono',    49990,  20, 'https://placehold.co/300x200?text=Webcam'),
    ('Pendrive Kingston 64GB',   'USB 3.2 Gen 1 DataTraveler',            7990,  100, 'https://placehold.co/300x200?text=Pendrive'),
    ('SSD Kingston 480GB',       'SSD SATA III 2.5" A400',                39990,  35, 'https://placehold.co/300x200?text=SSD')
ON CONFLICT DO NOTHING;
