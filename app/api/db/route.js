import { initDB } from '../../../lib/db';

export async function GET() {
  try {
    await initDB();
    return Response.json({ ok: true, message: 'Database initialized!' });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
