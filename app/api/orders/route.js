import { sql, getNextOrderNum } from '../../../lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const shop   = searchParams.get('shop');

    let orders;
    if (status && status !== 'all') {
      orders = await sql`SELECT * FROM orders WHERE status=${status} ORDER BY created_at DESC`;
    } else if (shop) {
      orders = await sql`SELECT * FROM orders WHERE shop_name=${shop} ORDER BY created_at DESC`;
    } else {
      orders = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
    }

    // Group by order_num
    const grouped = {};
    orders.forEach(o => {
      if (!grouped[o.order_num]) grouped[o.order_num] = [];
      grouped[o.order_num].push(o);
    });

    return Response.json({ ok: true, orders, grouped: Object.values(grouped) });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    // New order
    if (action === 'newOrder') {
      const orderNum = await getNextOrderNum();
      for (const item of body.items) {
        await sql`
          INSERT INTO orders(order_num, shop_name, district, address, phone, contact, art, category, app, qty, price, note, status)
          VALUES(${orderNum}, ${body.shopName}, ${body.district||''}, ${body.address}, ${body.phone}, ${body.contact}, 
                 ${item.art}, ${item.category}, ${item.app}, ${item.qty}, ${item.price||0}, ${body.note||''}, 'Новый')
        `;
        // Update reserved stock when order created
        await sql`
          INSERT INTO products(art, category, app, reserved)
          VALUES(${item.art}, ${item.category}, ${item.app||''}, ${item.qty})
          ON CONFLICT(art) DO UPDATE SET reserved = products.reserved + ${item.qty}
        `;
      }
      // Save shop
      await sql`
        INSERT INTO shops(name, district, address, phone, contact)
        VALUES(${body.shopName}, ${body.district||''}, ${body.address}, ${body.phone}, ${body.contact})
        ON CONFLICT DO NOTHING
      `;
      return Response.json({ ok: true, orderNum });
    }

    // Update status
    if (action === 'updateStatus') {
      await sql`UPDATE orders SET status=${body.status} WHERE order_num=${body.orderNum}`;
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: 'Unknown action' });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
