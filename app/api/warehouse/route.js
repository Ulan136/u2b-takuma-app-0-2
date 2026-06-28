import { sql } from '../../../lib/db';

export async function GET() {
  try {
    // Get all products with calculated stock
    const products = await sql`
      SELECT 
        p.art,
        p.category,
        p.app,
        p.price_buy,
        p.price_sell,
        p.stock,
        p.reserved,
        p.sold,
        p.allow_negative,
        (p.stock - COALESCE(p.reserved,0) - COALESCE(p.sold,0)) as remaining,
        COALESCE(
          (SELECT SUM(qty) FROM purchases WHERE art = p.art), 0
        ) as total_purchased,
        COALESCE(
          (SELECT SUM(qty) FROM sales WHERE art = p.art), 0
        ) as total_sold,
        COALESCE(
          (SELECT SUM(qty) FROM orders WHERE art = p.art AND status IN ('Принят','Отправлен')), 0
        ) as total_reserved
      FROM products p
      ORDER BY p.category, p.art
    `;

    return Response.json({ ok: true, products });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    // Toggle allow negative sales
    if (action === 'toggleNegative') {
      await sql`
        UPDATE products 
        SET allow_negative = ${body.allow}
        WHERE art = ${body.art}
      `;
      return Response.json({ ok: true });
    }

    // Toggle ALL products
    if (action === 'toggleAllNegative') {
      await sql`UPDATE products SET allow_negative = ${body.allow}`;
      return Response.json({ ok: true });
    }

    // Manual stock adjustment
    if (action === 'adjustStock') {
      await sql`
        UPDATE products SET stock = ${body.stock} WHERE art = ${body.art}
      `;
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: 'Unknown action' });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
