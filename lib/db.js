import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL);

// Initialize all tables
export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS districts (
      id   SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS shops (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      district   TEXT,
      address    TEXT,
      phone      TEXT,
      contact    TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      art        TEXT PRIMARY KEY,
      category   TEXT,
      app        TEXT,
      price_buy  NUMERIC DEFAULT 0,
      price_sell NUMERIC DEFAULT 0,
      stock      INTEGER DEFAULT 0,
      reserved   INTEGER DEFAULT 0,
      sold       INTEGER DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id         SERIAL PRIMARY KEY,
      order_num  TEXT NOT NULL,
      shop_name  TEXT,
      district   TEXT,
      address    TEXT,
      phone      TEXT,
      contact    TEXT,
      art        TEXT,
      category   TEXT,
      app        TEXT,
      qty        INTEGER DEFAULT 0,
      price      NUMERIC DEFAULT 0,
      note       TEXT,
      status     TEXT DEFAULT 'Новый',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS purchases (
      id         SERIAL PRIMARY KEY,
      art        TEXT,
      category   TEXT,
      qty        INTEGER DEFAULT 0,
      price_buy  NUMERIC DEFAULT 0,
      supplier   TEXT,
      invoice    TEXT,
      note       TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sales (
      id         SERIAL PRIMARY KEY,
      shop_name  TEXT,
      district   TEXT,
      art        TEXT,
      category   TEXT,
      qty        INTEGER DEFAULT 0,
      price      NUMERIC DEFAULT 0,
      payment    TEXT DEFAULT 'Наличные',
      debtor     TEXT,
      note       TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id         SERIAL PRIMARY KEY,
      category   TEXT,
      amount     NUMERIC DEFAULT 0,
      comment    TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_counter (
      id  INTEGER PRIMARY KEY DEFAULT 1,
      val INTEGER DEFAULT 0
    )
  `;

  // Insert defaults
  await sql`INSERT INTO order_counter(id,val) VALUES(1,0) ON CONFLICT DO NOTHING`;
  await sql`INSERT INTO settings(key,value) VALUES('markup','30') ON CONFLICT DO NOTHING`;
  await sql`INSERT INTO settings(key,value) VALUES('contact','Арслан') ON CONFLICT DO NOTHING`;
  await sql`INSERT INTO settings(key,value) VALUES('phone','+7 707 422 30 08') ON CONFLICT DO NOTHING`;

  // Default districts
  const dists = ['Жайылма','Шолаккорган','Ордабасы','Байдибек','Отырар','Сайрам'];
  for (const d of dists) {
    await sql`INSERT INTO districts(name) VALUES(${d}) ON CONFLICT DO NOTHING`;
  }
}

export async function getNextOrderNum() {
  const result = await sql`
    UPDATE order_counter SET val = val + 1 WHERE id = 1 RETURNING val
  `;
  const num = result[0].val;
  return '№' + String(num).padStart(4, '0');
}
