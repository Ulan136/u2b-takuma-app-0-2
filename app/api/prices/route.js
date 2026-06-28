import { sql } from '../../../lib/db';

export async function GET() {
  try {
    const [products, settings] = await Promise.all([
      sql`SELECT art, price_buy, price_sell, stock, reserved, sold FROM products`,
      sql`SELECT value FROM settings WHERE key='markup'`
    ]);

    const markup = parseFloat(settings[0]?.value || '30');
    const prices = {};
    products.forEach(p => {
      prices[p.art] = {
        buy:      Number(p.price_buy),
        sell:     Number(p.price_sell),
        stock:    Number(p.stock),
        reserved: Number(p.reserved),
        sold:     Number(p.sold),
        left:     Number(p.stock) - Number(p.reserved) - Number(p.sold)
      };
    });

    return Response.json({ ok: true, prices, markup });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { art, price_buy, price_sell } = await req.json();
    await sql`
      INSERT INTO products(art, price_buy, price_sell)
      VALUES(${art}, ${price_buy}, ${price_sell})
      ON CONFLICT(art) DO UPDATE
      SET price_buy=${price_buy}, price_sell=${price_sell}
    `;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
