'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const STATUS_COLORS = {
  'Новый':     { bg:'#e3f2fd', color:'#1565c0' },
  'Принят':    { bg:'#fff3e0', color:'#e65100' },
  'Отправлен': { bg:'#f3e5f5', color:'#6a1b9a' },
  'Доставлен': { bg:'#e8f5e9', color:'#1b5e20' },
  'Отменён':   { bg:'#fce4ec', color:'#b71c1c' },
};

export default function OrderEditPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNum = searchParams.get('num');

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState('view');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!orderNum) return;
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          const orderItems = d.orders.filter(o => String(o.order_num) === String(orderNum));
          if (orderItems.length > 0) {
            setOrder(orderItems[0]);
            setItems(orderItems.map(o => ({
              id: o.id,
              art: o.art,
              app: o.app,
              qty: Number(o.qty),
              price: Number(o.price),
            })));
          }
        }
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [orderNum]);

  function changeQty(idx, val) {
    setItems(prev => prev.map((item, i) =>
      i === idx ? {...item, qty: Math.max(0, parseInt(val)||0)} : item
    ));
  }

  function removeItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  async function saveChanges() {
    setSaving(true);
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ action: 'updateItems', orderNum, items })
      });
      router.push('/admin');
    } catch(e) { console.error(e); }
    setSaving(false);
  }

  async function deleteOrder() {
    setDeleting(true);
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ action: 'deleteOrder', orderNum })
      });
      router.push('/admin');
    } catch(e) { console.error(e); }
    setDeleting(false);
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:"'Segoe UI',Arial,sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:10 }}>⏳</div>
        <div style={{ color:'#888' }}>Загружаем заказ...</div>
      </div>
    </div>
  );

  if (!order) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:"'Segoe UI',Arial,sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:10 }}>❌</div>
        <div style={{ color:'#888' }}>Заказ не найден</div>
        <button onClick={()=>router.push('/admin')} style={{ marginTop:16, padding:'10px 20px', background:'#1a1a4e', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700 }}>
          ← Назад
        </button>
      </div>
    </div>
  );

  const sc = STATUS_COLORS[order.status] || { bg:'#f5f5f5', color:'#666' };
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const date = order.created_at ? new Date(order.created_at).toLocaleDateString('ru-RU') : '';

  return (
    <div style={{ maxWidth:480, margin:'0 auto', fontFamily:"'Segoe UI',Arial,sans-serif", background:'#f0f2f8', minHeight:'100vh', paddingBottom:80 }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1a1a4e,#2d2d8e)', color:'#fff', padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:10, opacity:.6, letterSpacing:2 }}>U2B · ТАКУМА</div>
          <div style={{ fontSize:18, fontWeight:900 }}>📋 Заказ №{String(orderNum).padStart(4,'0')}</div>
        </div>
        <button onClick={()=>router.push('/admin')}
          style={{ background:'#fff2', color:'#fff', border:'none', borderRadius:8, padding:'6px 12px', fontWeight:700, fontSize:12, cursor:'pointer' }}>
          ← Назад
        </button>
      </div>

      <div style={{ padding:14 }}>

        {/* Инфо */}
        <div style={{ background:'#fff', borderRadius:12, padding:14, marginBottom:12, boxShadow:'0 1px 4px #0001' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:800, fontSize:15 }}>🏪 {order.shop_name}</div>
              <div style={{ fontSize:12, color:'#888', marginTop:2 }}>{date} · {order.district||''}</div>
              {order.phone && <div style={{ fontSize:12, color:'#666', marginTop:2 }}>📞 {order.phone}</div>}
            </div>
            <span style={{ background:sc.bg, color:sc.color, borderRadius:8, padding:'4px 12px', fontSize:12, fontWeight:700, flexShrink:0 }}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Режимы */}
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <button onClick={()=>setMode('view')}
            style={{ flex:1, padding:'10px', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:13,
              background:mode==='view'?'#1a1a4e':'#e8e8f0', color:mode==='view'?'#fff':'#666' }}>
            👁 Просмотр
          </button>
          <button onClick={()=>setMode('edit')}
            style={{ flex:1, padding:'10px', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:13,
              background:mode==='edit'?'#ff9800':'#e8e8f0', color:mode==='edit'?'#fff':'#666' }}>
            ✏️ Изменить
          </button>
          <button onClick={()=>setMode('delete')}
            style={{ flex:1, padding:'10px', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:13,
              background:mode==='delete'?'#e53935':'#fce4ec', color:mode==='delete'?'#fff':'#e53935' }}>
            🗑️ Удалить
          </button>
        </div>

        {/* Товары */}
        <div style={{ background:'#fff', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px #0001', marginBottom:12 }}>
          <div style={{ background:'#1a1a4e', color:'#fff', padding:'10px 14px', fontWeight:700, fontSize:13 }}>
            Товары · {items.length} позиций
          </div>

          {items.length === 0 && (
            <div style={{ textAlign:'center', padding:30, color:'#aaa' }}>Все позиции удалены</div>
          )}

          {items.map((item, idx) => (
            <div key={idx} style={{ padding:'10px 14px', borderBottom:'1px solid #f0f0f8', background:idx%2===0?'#fff':'#fafafa' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:800, fontSize:13, color:'#1a1a4e' }}>{item.art}</div>
                  <div style={{ fontSize:11, color:'#888', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.app}</div>
                  <div style={{ fontSize:12, color:'#666', marginTop:2 }}>
                    {item.price.toLocaleString('ru')} ₸ × {item.qty} = <b>{(item.price*item.qty).toLocaleString('ru')} ₸</b>
                  </div>
                </div>

                {mode === 'view' && (
                  <div style={{ background:'#e8f0ff', borderRadius:8, padding:'6px 14px', fontWeight:800, fontSize:16, color:'#1a1a4e', flexShrink:0 }}>
                    {item.qty} шт
                  </div>
                )}

                {mode === 'edit' && (
                  <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                    <button onClick={()=>changeQty(idx, item.qty-1)}
                      style={{ width:32, height:32, border:'none', borderRadius:8, background:'#f0f0f0', fontWeight:900, fontSize:18, cursor:'pointer' }}>−</button>
                    <input type="number" value={item.qty} onChange={e=>changeQty(idx, e.target.value)}
                      style={{ width:48, textAlign:'center', border:'2px solid #1a1a4e', borderRadius:8, fontSize:14, fontWeight:700, padding:'4px', outline:'none' }}/>
                    <button onClick={()=>changeQty(idx, item.qty+1)}
                      style={{ width:32, height:32, border:'none', borderRadius:8, background:'#1a1a4e', color:'#fff', fontWeight:900, fontSize:18, cursor:'pointer' }}>+</button>
                    <button onClick={()=>removeItem(idx)}
                      style={{ width:32, height:32, border:'none', borderRadius:8, background:'#fce4ec', color:'#e53935', fontWeight:900, fontSize:16, cursor:'pointer' }}>✕</button>
                  </div>
                )}

                {mode === 'delete' && (
                  <div style={{ fontSize:20 }}>⚠️</div>
                )}
              </div>
            </div>
          ))}

          {/* Итого */}
          <div style={{ padding:'12px 14px', background:'#e8f5e9', display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:15 }}>
            <span>ИТОГО: {totalQty} шт</span>
            <span style={{ color:'#1b5e20' }}>{total.toLocaleString('ru')} ₸</span>
          </div>
        </div>

        {/* Кнопка сохранить */}
        {mode === 'edit' && (
          <button onClick={saveChanges} disabled={saving || items.length===0}
            style={{ width:'100%', padding:14, background:saving?'#aaa':'#4caf50', color:'#fff', border:'none', borderRadius:12, fontWeight:800, fontSize:15, cursor:saving?'not-allowed':'pointer', marginBottom:8 }}>
            {saving ? '⏳ Сохраняем...' : '✅ Сохранить изменения'}
          </button>
        )}

        {/* Подтверждение удаления */}
        {mode === 'delete' && (
          <div style={{ background:'#fce4ec', borderRadius:12, padding:16, textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#c62828', marginBottom:8 }}>
              ⚠️ Удалить заказ №{String(orderNum).padStart(4,'0')}?
            </div>
            <div style={{ fontSize:13, color:'#888', marginBottom:16 }}>Это действие нельзя отменить</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setMode('view')}
                style={{ flex:1, padding:12, background:'#f0f0f0', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>
                Отмена
              </button>
              <button onClick={deleteOrder} disabled={deleting}
                style={{ flex:1, padding:12, background:'#e53935', color:'#fff', border:'none', borderRadius:10, fontWeight:800, cursor:'pointer' }}>
                {deleting ? '⏳...' : '🗑️ Да, удалить'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Кнопка назад снизу */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:'1px solid #e0e0e0', padding:'8px 16px', display:'flex', justifyContent:'space-between', zIndex:100 }}>
        <button onClick={()=>router.push('/admin')}
          style={{ background:'#f0f0f0', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:700, fontSize:14, cursor:'pointer' }}>
          ← Назад
        </button>
        <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}
          style={{ background:'#f0f0f0', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:700, fontSize:14, cursor:'pointer' }}>
          ↑ Вверх
        </button>
      </div>

    </div>
  );
}
