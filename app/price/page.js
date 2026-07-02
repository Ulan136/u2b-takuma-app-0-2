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
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
      s2.onload = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
        const date = new Date().toLocaleDateString('ru-RU');
        const title = withBuyPrice ? 'Прайс-лист (полный)' : 'Прайс-лист для клиентов';

        // Header
        doc.setFillColor(26,26,78);
        doc.rect(0,0,297,18,'F');
        doc.setTextColor(255,215,0); doc.setFontSize(13); doc.setFont('helvetica','bold');
        doc.text('TAKUMA', 8, 12);
        doc.setTextColor(255,255,255); doc.setFontSize(9);
        doc.text(title, 40, 12);
        doc.setTextColor(180,180,180); doc.setFontSize(8);
        doc.text(`${filtered.length} позиций · Наценка ${markup}% · ${date}`, 200, 12);

        const cols = withBuyPrice
          ? ['#','Артикул','Закуп','Продажа','Применимость']
          : ['#','Артикул','Цена','Применимость'];

        const rows = filtered.map((p,i) => withBuyPrice
          ? [i+1, p.art, (prices[p.art]?.buy||p.price||0).toLocaleString('ru')+' ₸',
             sellPrice(p.art,p.price).toLocaleString('ru')+' ₸', p.app.substring(0,80)]
          : [i+1, p.art, sellPrice(p.art,p.price).toLocaleString('ru')+' ₸', p.app.substring(0,100)]
        );

        const colW = withBuyPrice
          ? [8,28,22,25,214]
          : [8,28,25,236];

        doc.autoTable({
          startY:20, head:[cols], body:rows,
          styles:{fontSize:7,cellPadding:2},
          headStyles:{fillColor:[26,26,78],textColor:[255,255,255],fontStyle:'bold'},
          columnStyles: withBuyPrice
            ? {0:{cellWidth:8,halign:'center'},1:{fontStyle:'bold',cellWidth:28,textColor:[26,26,78]},2:{cellWidth:22,halign:'right',textColor:[100,100,100]},3:{cellWidth:25,halign:'right',fontStyle:'bold',textColor:[26,120,26]},4:{cellWidth:214}}
            : {0:{cellWidth:8,halign:'center'},1:{fontStyle:'bold',cellWidth:28,textColor:[26,26,78]},2:{cellWidth:25,halign:'right',fontStyle:'bold',textColor:[26,120,26]},3:{cellWidth:236}},
          alternateRowStyles:{fillColor:[248,248,255]},
        });

        const fname = withBuyPrice
          ? `TAKUMA_Прайс_полный_${date.replace(/\./g,'-')}.pdf`
          : `TAKUMA_Прайс_клиент_${date.replace(/\./g,'-')}.pdf`;
        doc.save(fname);
      };
      document.head.appendChild(s2);
    };
    if (window.jspdf) { script.onload(); return; }
    document.head.appendChild(script);
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
