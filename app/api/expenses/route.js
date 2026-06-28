import { sql } from '../../../lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');

    let expenses;
    if (month) {
      expenses = await sql`
        SELECT * FROM expenses 
        WHERE TO_CHAR(created_at, 'YYYY-MM') = ${month}
        ORDER BY created_at DESC
      `;
    } else {
      expenses = await sql`SELECT * FROM expenses ORDER BY created_at DESC LIMIT 100`;
    }

    // Sum by category
    const byCategory = {};
    expenses.forEach(e => {
      if (!byCategory[e.category]) byCategory[e.category] = 0;
      byCategory[e.category] += Number(e.amount);
    });

    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

    return Response.json({ ok: true, expenses, byCategory, total });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { category, amount, comment } = await req.json();
    await sql`
      INSERT INTO expenses(category, amount, comment)
      VALUES(${category}, ${amount}, ${comment||''})
    `;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
