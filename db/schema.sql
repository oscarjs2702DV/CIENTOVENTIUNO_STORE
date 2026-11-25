CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  material TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sizes TEXT NOT NULL DEFAULT '[]',
  variants TEXT NOT NULL DEFAULT '[]',
  reviews TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

-- Cuentas de clientes. El servidor también las crea solo si faltan.
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  password_hash TEXT,
  google_sub TEXT UNIQUE,
  avatar TEXT,
  birth_date TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS customer_sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS customer_sessions_customer ON customer_sessions(customer_id);
