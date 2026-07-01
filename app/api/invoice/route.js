import { sql } from '../../../lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    // Parse invoice text
    if (action === 'parseInvoice') {
      const items = parseInvoiceText(body.text);
      return Response.json({ ok: true, items });
    }

    // Confirm purchase - update stock
    if (action === 'confirmPurchase') {
      const { items, supplier, invoiceNum, invoiceDate } = body;
      
      for (const item of items) {
        // Add purchase record
        await sql`
          INSERT INTO purchases(art, category, qty, price_buy, supplier, invoice, note)
          VALUES(${item.art}, ${item.category||''}, ${item.qty}, ${item.price_buy||0},
                 ${supplier||'Такума'}, ${invoiceNum||''}, ${invoiceDate||''})
        `;
        
        // Update stock in products table
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

// ── Parse invoice text ──────────────────────────────────────────────────────
function parseInvoiceText(text) {
  if (!text) return [];

  // Normalize Cyrillic lookalikes
  text = text
    .replace(/ТК/g, 'TK').replace(/ТО/g, 'TO').replace(/ТА/g, 'TA')
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const items = [];
  const lines = text.split('\n');

  for (const line of lines) {
    // Must contain "Такума" or Takuma article pattern
    if (!line.includes('Такума') && !line.match(/\bT(?:A|O|K|01)\s+\w/)) continue;

    // Extract article: TA 2420 B, TO 4114 M, T01 5016 M, TK 1182 C
    const artMatch = line.match(/\b(T(?:A|O|K|01)\s+[\w]+(?:\s+[A-Z])?)\b/);
    if (!artMatch) continue;

    const art = artMatch[1].trim();

    // Category
    let category = 'Прочие';
    if (line.includes('Воздушный') || line.includes('Воздушные') || art.startsWith('TA')) {
      category = 'Воздушные';
    } else if (line.includes('Масляный') || line.includes('Масляные') || art.startsWith('TO') || art.startsWith('T01')) {
      category = 'Масляные';
    } else if (line.includes('Салонный') || line.includes('Салонные') || art.startsWith('TK')) {
      category = 'Салонные';
    }

    // Quantity: "10,000 шт" or "10 шт"
    const qtyMatch = line.match(/(\d+)(?:,\d+)?\s*шт/);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 0;

    // Unit price: number after "шт"
    const priceMatch = line.match(/шт\s+(\d+),(\d+)/);
    const price_buy = priceMatch
      ? parseFloat(priceMatch[1] + '.' + priceMatch[2])
      : 0;

    if (art && qty > 0) {
      items.push({ art, category, qty, price_buy });
    }
  }

  return items;
}
