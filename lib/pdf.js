// PDF generation using Canvas - supports Cyrillic natively
export function generateInvoicePDF(data) {
  return new Promise((resolve) => {
    const { orderNum, date, shop, items, total } = data;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const scale = 2; // retina
    const W = 794 * scale; // A4 width in px at 96dpi
    const H = Math.max(1123, 200 + items.length * 35 + 150) * scale;
    canvas.width = W;
    canvas.height = H;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    const w = W / scale;
    const h = H / scale;
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    
    // Header background
    ctx.fillStyle = '#1a1a4e';
    ctx.fillRect(0, 0, w, 60);
    
    // TAKUMA logo
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('TAKUMA', 20, 38);
    
    // Invoice title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Накладная ' + orderNum, 130, 28);
    ctx.font = '11px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('Арслан: +7 707 422 30 08', 130, 48);
    
    // Date top right
    ctx.fillStyle = '#cccccc';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(date, w - 20, 38);
    ctx.textAlign = 'left';
    
    // Shop info
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('Магазин: ' + shop.name, 20, 90);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText('Адрес: ' + (shop.address || ''), 20, 108);
    ctx.fillText('Тел: ' + (shop.phone || ''), 20, 124);
    
    // Table header
    const tableTop = 150;
    ctx.fillStyle = '#1a1a4e';
    ctx.fillRect(20, tableTop, w - 40, 30);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Arial';
    const cols = [30, 60, 280, 500, 590, 690];
    const headers = ['№', 'Артикул', 'Применимость', 'Кол-во', 'Цена', 'Сумма'];
    headers.forEach((h, i) => {
      ctx.fillText(h, cols[i] + 4, tableTop + 19);
    });
    
    // Table rows
    items.forEach((item, idx) => {
      const y = tableTop + 30 + idx * 32;
      
      // Alternating background
      if (idx % 2 === 1) {
        ctx.fillStyle = '#f8f8ff';
        ctx.fillRect(20, y, w - 40, 32);
      }
      
      // Border
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(20, y, w - 40, 32);
      
      // Data
      ctx.fillStyle = '#333333';
      ctx.font = '11px Arial';
      ctx.fillText(String(idx + 1), cols[0] + 4, y + 20);
      
      ctx.font = 'bold 11px Arial';
      ctx.fillStyle = '#1a1a4e';
      ctx.fillText(item.art || '', cols[1] + 4, y + 20);
      
      ctx.font = '10px Arial';
      ctx.fillStyle = '#555555';
      const appText = (item.app || '').substring(0, 45);
      ctx.fillText(appText, cols[2] + 4, y + 20);
      
      ctx.font = '11px Arial';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'center';
      ctx.fillText(String(item.qty || 0), cols[3] + 30, y + 20);
      
      ctx.textAlign = 'right';
      ctx.fillText((item.sell || 0).toLocaleString('ru') + ' ₸', cols[4] + 80, y + 20);
      
      ctx.font = 'bold 11px Arial';
      ctx.fillStyle = '#1a1a4e';
      ctx.fillText(((item.sell || 0) * (item.qty || 0)).toLocaleString('ru') + ' ₸', w - 25, y + 20);
      ctx.textAlign = 'left';
    });
    
    // Total row
    const totalY = tableTop + 30 + items.length * 32;
    ctx.fillStyle = '#e8f5e9';
    ctx.fillRect(20, totalY, w - 40, 36);
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, totalY, w - 40, 36);
    
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#1b5e20';
    ctx.fillText('ИТОГО:', cols[2] + 4, totalY + 24);
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(total.toLocaleString('ru') + ' ₸', w - 25, totalY + 24);
    ctx.textAlign = 'left';
    
    // Footer
    const footerY = totalY + 60;
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px Arial';
    ctx.fillText('U2B · ТАКУМА · Арслан +7 707 422 30 08', 20, footerY);
    ctx.textAlign = 'right';
    ctx.fillText(date, w - 20, footerY);
    ctx.textAlign = 'left';
    
    // Convert to PDF using canvas
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Load jsPDF dynamically
    if (window.jspdf) {
      createPDF(imgData, w, h, orderNum, shop, resolve);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => createPDF(imgData, w, h, orderNum, shop, resolve);
      document.head.appendChild(script);
    }
  });
}

function createPDF(imgData, canvasW, canvasH, orderNum, shop, resolve) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [canvasW / 2, canvasH / 2]
  });
  
  pdf.addImage(imgData, 'JPEG', 0, 0, canvasW / 2, canvasH / 2);
  pdf.save('Накладная_' + orderNum + '_' + (shop.name || '') + '.pdf');
  resolve();
}
