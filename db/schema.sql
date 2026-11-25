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
