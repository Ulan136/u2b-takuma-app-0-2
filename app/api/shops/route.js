import { sql } from '../../../lib/db';

export async function GET() {
  try {
    const shops = await sql`SELECT * FROM shops ORDER BY name`;
    return Response.json({ ok: true, shops });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'add') {
      await sql`
        INSERT INTO shops(name, district, address, phone, contact)
        VALUES(${body.name}, ${body.district||''}, ${body.address||''}, ${body.phone||''}, ${body.contact||''})
        ON CONFLICT DO NOTHING
      `;
      return Response.json({ ok: true });
    }

    if (action === 'update') {
      await sql`
        UPDATE shops SET district=${body.district||''}, address=${body.address||''}, 
        phone=${body.phone||''}, contact=${body.contact||''}
        WHERE name=${body.name}
      `;
      return Response.json({ ok: true });
    }

    if (action === 'delete') {
      await sql`DELETE FROM shops WHERE name=${body.name}`;
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: 'Unknown action' });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
