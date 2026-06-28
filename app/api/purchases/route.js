import { sql } from '../../../lib/db';

export async function GET() {
  try {
    const purchases = await sql`SELECT * FROM purchases ORDER BY created_at DESC`;
    return Response.json({ ok: true, purchases });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    for (const item of body.items) {
      // Add purchase record
      await sql`
        INSERT INTO purchases(art, category, qty, price_buy, supplier, invoice, note)
        VALUES(${item.art}, ${item.category||''}, ${item.qty}, ${item.price||0}, 
               ${body.supplier||'Такума'}, ${body.invoice||''}, ${body.note||''})
      `;
      // Update stock in products
      await sql`
        INSERT INTO products(art, category, app, price_buy, stock)
        VALUES(${item.art}, ${item.category||''}, ${item.app||''}, ${item.price||0}, ${item.qty})
        ON CONFLICT(art) DO UPDATE 
        SET stock = products.stock + ${item.qty},
            price_buy = ${item.price||0}
      `;
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
