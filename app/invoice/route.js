import { sql } from '../../../lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'parseInvoice') {
      const items = parseInvoiceText(body.text);
      return Response.json({ ok: true, items });
    }

    if (action === 'confirmPurchase') {
      const { items, supplier, invoiceNum, invoiceDate } = body;
      for (const item of items) {
        await sql`
          INSERT INTO purchases(art, category, qty, price_buy, supplier, invoice, note)
          VALUES(${item.art}, ${item.category||''}, ${item.qty}, ${item.price_buy||0},
                 ${supplier||'Такума'}, ${invoiceNum||''}, ${invoiceDate||''})
        `;
        await sql`
          INSERT INTO products(art, category, app, price_buy, stock)
          VALUES(${item.art}, ${item.category||''}, ${item.app||''}, ${item.price_buy||0}, ${item.qty})
          ON CONFLICT(art) DO UPDATE SET
            stock     = products.stock + ${item.qty},
            price_buy = ${item.price_buy||0}
        `;
      }
      return Response.json({ ok: true, updated: items.length });
    }

    return Response.json({ ok: false, error: 'Unknown action' });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

function parseInvoiceText(text) {
  if (!text) return [];

  // Normalize Cyrillic lookalikes and collapse whitespace
  text = text
    .replace(/ТК/g, 'TK').replace(/ТО/g, 'TO').replace(/ТА/g, 'TA')
    .replace(/\r\n/g, ' ').replace(/\r/g, ' ').replace(/\n/g, ' ')
    .replace(/\s+/g, ' ');

  const items = [];

  // PRIMARY: "Воздушный/Масляный/Салонный фильтр Такума ARTICLE QTY шт PRICE"
  const re = /(Воздушный|Масляный|Салонный)\s+фильтр\s+Такума\s+(T(?:A|O|K|01)\s+[\w]+(?:\s+[A-ZА-Я])?)\s+(\d+),\d+\s*шт\s+(\d+),(\d+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    let art = m[2].trim().replace(/\s*С$/, ' C').replace(/С$/, 'C');
    const qty = parseInt(m[3]);
    const price = parseFloat(m[4] + '.' + m[5]);
    const cat = m[1] === 'Воздушный' ? 'Воздушные' : m[1] === 'Масляный' ? 'Масляные' : 'Салонные';
    if (!items.find(i => i.art === art)) {
      items.push({ art, category: cat, qty, price_buy: price });
    }
  }

  // FALLBACK: just article + qty + price
  if (items.length === 0) {
    const re2 = /(T(?:A|O|K|01)\s+[\w/]+(?:\s+[A-Z])?)\s+(\d+),\d+\s*шт\s+(\d+),(\d+)/g;
    while ((m = re2.exec(text)) !== null) {
      let art = m[1].trim().replace(/\s*С$/, ' C');
      const qty = parseInt(m[2]);
      const price = parseFloat(m[3] + '.' + m[4]);
      const cat = art.startsWith('TA') ? 'Воздушные' : art.startsWith('TK') ? 'Салонные' : 'Масляные';
      if (!items.find(i => i.art === art)) {
        items.push({ art, category: cat, qty, price_buy: price });
      }
    }
  }

  return items;
}
