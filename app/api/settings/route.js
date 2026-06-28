import { sql } from '../../../lib/db';

export async function GET() {
  try {
    const [settingsRows, districtRows] = await Promise.all([
      sql`SELECT key, value FROM settings`,
      sql`SELECT name FROM districts ORDER BY id`
    ]);

    const settings = {};
    settingsRows.forEach(r => { settings[r.key] = r.value; });

    return Response.json({
      ok: true,
      markup:    parseFloat(settings.markup || '30'),
      contact:   settings.contact || 'Арслан',
      phone:     settings.phone   || '+7 707 422 30 08',
      districts: districtRows.map(r => r.name)
    });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'updateMarkup') {
      await sql`UPDATE settings SET value=${String(body.markup)} WHERE key='markup'`;
      return Response.json({ ok: true });
    }

    if (action === 'updateContact') {
      await sql`UPDATE settings SET value=${body.contact} WHERE key='contact'`;
      await sql`UPDATE settings SET value=${body.phone} WHERE key='phone'`;
      return Response.json({ ok: true });
    }

    if (action === 'addDistrict') {
      await sql`INSERT INTO districts(name) VALUES(${body.name}) ON CONFLICT DO NOTHING`;
      return Response.json({ ok: true });
    }

    if (action === 'deleteDistrict') {
      await sql`DELETE FROM districts WHERE name=${body.name}`;
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: 'Unknown action' });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
