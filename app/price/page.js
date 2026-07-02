'use client';
import { useState, useEffect } from 'react';

const TRANSLIT = {
  'бмв':'bmw','тойота':'toyota','хендай':'hyundai','киа':'kia','ниссан':'nissan',
  'мерседес':'mercedes','ауди':'audi','фольксваген':'volkswagen','лада':'lada',
  'камри':'camry','прадо':'prado','гольф':'golf','субару':'subaru','лексус':'lexus',
  'хонда':'honda','мазда':'mazda','митсубиси':'mitsubishi','рено':'renault',
};
function smartNorm(q) {
  q=(q||'').toLowerCase().trim();
  for(const[r,e]of Object.entries(TRANSLIT))q=q.replace(new RegExp(r,'g'),e);
  return q;
}

export default function PricePage() {
  const [products, setProducts] = useState([]);
  const [prices, setPrices] = useState({});
  const [markup, setMarkup] = useState(30);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load prices and settings
    fetch('/api/prices').then(r=>r.json()).then(d=>{
      if(d.ok){setPrices(d.prices||{});setMarkup(d.markup||30);}
    }).catch(()=>{});

    // Load products from Neon DB
    fetch('/api/products').then(r=>r.json()).then(d=>{
      if(d.ok && d.products?.length>0) {
        setProducts(d.products.map(p=>({
          art: p.art,
          category: p.category,
          app: p.app,
          price: p.price_buy || p.price || 0,
        })));
      }
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[]);

  function sellPrice(art, buy) {
    if(prices[art]?.sell) return prices[art].sell;
    const b = prices[art]?.buy || buy || 0;
    return Math.ceil(b*(1+markup/100)/10)*10;
  }

  function exportPDF(withBuyPrice=false) {
    const date = new Date().toLocaleDateString('ru-RU');
    const title = withBuyPrice ? 'Прайс-лист (полный)' : 'Прайс-лист для клиентов';
    const rowH = 18;
    const headerH = 28;
    const colsW = withBuyPrice ? [10,32,22,24,209] : [10,32,26,229];
    const totalW = 297; // A4 landscape mm -> px at 3.78px/mm
    const scale = 3;
    const W = Math.round(totalW * 3.78);
    const H = Math.round((headerH + filtered.length * rowH + 20) * 3.78);

    const canvas = document.createElement('canvas');
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);

    // Header
    ctx.fillStyle = '#1a1a4e';
    ctx.fillRect(0, 0, W, headerH * 3.78);
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${14 * 3.78}px Arial`;
    ctx.fillText('TAKUMA', 10 * 3.78, 18 * 3.78);
    ctx.fillStyle = '#fff';
    ctx.font = `${10 * 3.78}px Arial`;
    ctx.fillText(title, 80 * 3.78, 13 * 3.78);
    ctx.fillStyle = '#aaa';
    ctx.font = `${8 * 3.78}px Arial`;
    ctx.fillText(`${filtered.length} позиций · Наценка ${markup}% · ${date}`, 80 * 3.78, 22 * 3.78);
    ctx.textAlign = 'right';
    ctx.fillText(date, (W - 10) * 3.78, 18 * 3.78);
    ctx.textAlign = 'left';

    // Table header
    const tY = headerH * 3.78;
    const tRowH = rowH * 3.78;
    ctx.fillStyle = '#2d2d6e';
    ctx.fillRect(0, tY, W * 3.78, tRowH * 0.9);

    const colsX = [];
    let cx = 5 * 3.78;
    const hdrs = withBuyPrice
      ? ['#','Артикул','Закуп','Продажа','Применимость']
      : ['#','Артикул','Цена','Применимость'];
    colsW.forEach((cw, i) => {
      colsX.push(cx);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${7 * 3.78}px Arial`;
      ctx.fillText(hdrs[i], cx, tY + tRowH * 0.65);
      cx += cw * 3.78;
    });

    // Rows
    filtered.forEach((p, idx) => {
      const y = tY + tRowH * (idx + 1);
      ctx.fillStyle = idx % 2 === 0 ? '#fff' : '#f5f5ff';
      ctx.fillRect(0, y, W * 3.78, tRowH);
      ctx.strokeStyle = '#e8e8e8';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0, y, W * 3.78, tRowH);

      const sell = sellPrice(p.art, p.price);
      const buy = prices[p.art]?.buy || p.price || 0;
      const vals = withBuyPrice
        ? [String(idx+1), p.art, buy.toLocaleString('ru')+' ₸', sell.toLocaleString('ru')+' ₸', (p.app||'').substring(0,90)]
        : [String(idx+1), p.art, sell.toLocaleString('ru')+' ₸', (p.app||'').substring(0,100)];

      vals.forEach((v, i) => {
        ctx.fillStyle = i === 1 ? '#1a1a4e' : i === (withBuyPrice?3:2) ? '#1b5e20' : '#333';
        ctx.font = i === 1 ? `bold ${7 * 3.78}px Arial` : `${7 * 3.78}px Arial`;
        ctx.textAlign = i >= (withBuyPrice?2:2) && i <= (withBuyPrice?3:2) ? 'right' : 'left';
        const x = ctx.textAlign === 'right'
          ? colsX[i] + colsW[i] * 3.78 - 4
          : colsX[i];
        ctx.fillText(v, x, y + tRowH * 0.65);
        ctx.textAlign = 'left';
      });
    });

    // Export
    const imgData = canvas.toDataURL('image/png');
    const loadPDF = () => {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation:'landscape', unit:'px', format:[W * scale, H * scale] });
      pdf.addImage(imgData, 'PNG', 0, 0, W * scale, H * scale);
      const fname = withBuyPrice
        ? `TAKUMA_Прайс_полный_${date.replace(/\./g,'-')}.pdf`
        : `TAKUMA_Прайс_клиент_${date.replace(/\./g,'-')}.pdf`;
      pdf.save(fname);
    };
    if (window.jspdf) { loadPDF(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = loadPDF;
    document.head.appendChild(s);
  }

  const filtered = products.filter(p=>{
    if(tab!=='all'&&p.category!==tab) return false;
    if(!search) return true;
    const q=smartNorm(search);
    const appLow=(p.app||'').toLowerCase();
    const appNorm=smartNorm(p.app);
    const artLow=(p.art||'').toLowerCase();
    return q.split(/\s+/).every(w=>
      artLow.includes(w) ||
      appNorm.includes(w) ||
      appLow.includes(w)
    );
  });

  const cats={'Масляные':0,'Воздушные':0,'Салонные':0};
  products.forEach(p=>{if(cats[p.category]!==undefined)cats[p.category]++;});

  return (
    <div style={{minHeight:'100vh',background:'#f0f2f8',fontFamily:"'Segoe UI',Arial,sans-serif"}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1a1a4e,#2d2d8e)',color:'#fff',padding:'0 24px',display:'flex',alignItems:'center',gap:16,position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 12px #0004',flexWrap:'wrap'}}>
        <div style={{padding:'14px 0'}}>
          <div style={{fontWeight:700,fontSize:15}}>TAKUMA · Прайс-лист фильтров</div>
          <div style={{fontSize:11,opacity:.7}}>{products.length} позиций · 2026</div>
        </div>
        <div style={{flex:1,minWidth:220,padding:'10px 0'}}>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',opacity:.6,fontSize:16}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск: toyota, бмв, камри..."
              style={{width:'100%',padding:'10px 16px 10px 40px',border:'none',borderRadius:10,fontSize:14,background:'#fff2',color:'#fff',outline:'none',boxSizing:'border-box'}}/>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,background:'#fff2',borderRadius:10,padding:'8px 14px'}}>
          <label style={{fontSize:12,opacity:.8}}>Наценка</label>
          <input type="number" value={markup} onChange={e=>setMarkup(parseFloat(e.target.value)||0)}
            style={{width:60,padding:'4px 8px',border:'1.5px solid #ffd700',borderRadius:6,fontSize:15,fontWeight:700,textAlign:'center',background:'transparent',color:'#ffd700',outline:'none'}}/>
          <span style={{color:'#ffd700',fontWeight:700}}>%</span>
        </div>
        <button onClick={()=>exportPDF(false)} style={{padding:'9px 16px',background:'#4caf50',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:6}}>
          📄 Прайс для клиентов
        </button>
        <button onClick={()=>exportPDF(true)} style={{padding:'9px 16px',background:'#ffd700',color:'#1a1a4e',border:'none',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:6}}>
          📊 Полный прайс
        </button>
      </div>

      {/* Stats */}
      <div style={{display:'flex',gap:12,padding:'16px 24px 0',flexWrap:'wrap'}}>
        {[{val:products.length,label:'Всего позиций',color:'#1a1a4e'},
          {val:cats['Масляные'],label:'🛢 Масляные',color:'#e65100'},
          {val:cats['Воздушные'],label:'🌬 Воздушные',color:'#1565c0'},
          {val:cats['Салонные'],label:'🪟 Салонные',color:'#6a1b9a'}].map((s,i)=>(
          <div key={i} style={{background:'#fff',borderRadius:10,padding:'10px 16px',boxShadow:'0 1px 4px #0001'}}>
            <div style={{fontSize:22,fontWeight:900,color:s.color}}>{s.val}</div>
            <div style={{fontSize:11,color:'#888'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,padding:'16px 24px 0',borderBottom:'2px solid #dee2f0'}}>
        {[['all','Все',products.length],['Масляные','🛢 Масляные',cats['Масляные']],['Воздушные','🌬 Воздушные',cats['Воздушные']],['Салонные','🪟 Салонные',cats['Салонные']]].map(([id,label,count])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:'10px 20px',border:'none',background:'transparent',cursor:'pointer',fontSize:13,fontWeight:600,color:tab===id?'#1a1a4e':'#666',borderBottom:tab===id?'3px solid #1a1a4e':'3px solid transparent',borderRadius:'8px 8px 0 0'}}>
            {label} <span style={{background:tab===id?'#1a1a4e':'#e8eaf6',color:tab===id?'#fff':'#666',borderRadius:10,padding:'1px 7px',fontSize:11,marginLeft:4}}>{count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{padding:'0 24px 24px',overflowX:'auto'}}>
        {loading ? (
          <div style={{textAlign:'center',padding:60,color:'#aaa'}}>Загрузка...</div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',marginTop:12,background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:'0 2px 12px #0001'}}>
            <thead>
              <tr style={{background:'#1a1a4e',color:'#fff'}}>
                {['#','Артикул','Закуп','Продажа','Кросс-номера','Применимость'].map((h,i)=>(
                  <th key={i} style={{padding:'11px 12px',textAlign:i>1&&i<4?'right':'left',fontSize:11,fontWeight:700,letterSpacing:.5,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p,i)=>(
                <tr key={p.art} style={{borderBottom:'1px solid #f0f0f8',background:i%2===0?'#fff':'#fafafa'}}>
                  <td style={{padding:'9px 12px',color:'#ccc',fontSize:11}}>{i+1}</td>
                  <td style={{padding:'9px 12px'}}>
                    <div style={{fontWeight:800,color:'#1a1a4e',whiteSpace:'nowrap'}}>{p.art}</div>
                    <span style={{background:p.category==='Масляные'?'#fff3e0':p.category==='Воздушные'?'#e3f2fd':'#f3e5f5',color:p.category==='Масляные'?'#e65100':p.category==='Воздушные'?'#1565c0':'#6a1b9a',borderRadius:4,padding:'2px 8px',fontSize:10,fontWeight:700}}>{p.category}</span>
                  </td>
                  <td style={{padding:'9px 12px',textAlign:'right',color:'#888',whiteSpace:'nowrap'}}>{(prices[p.art]?.buy||p.price||0).toLocaleString('ru')} ₸</td>
                  <td style={{padding:'9px 12px',textAlign:'right',fontWeight:800,color:'#1a7a1a',fontSize:14,whiteSpace:'nowrap'}}>{sellPrice(p.art,p.price).toLocaleString('ru')} ₸</td>
                  <td style={{padding:'9px 12px',color:'#666',fontSize:11}}>{p.cross||'—'}</td>
                  <td style={{padding:'9px 12px',color:'#444',fontSize:12,maxWidth:300}}>{p.app}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
