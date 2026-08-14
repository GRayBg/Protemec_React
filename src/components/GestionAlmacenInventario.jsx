import { useState, useEffect } from 'react'

export default function GestionAlmacenInventario({ compras = [], API_URL, recargarDatos }) {
  const [subPestana, setSubPestana] = useState('stock')
  const [inventario, setInventario] = useState([])
  const [item, setItem] = useState(null)
  const [modo, setModo] = useState('nuevo')
  const [destino, setDestino] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [cantidad, setCantidad] = useState(1)

  const cargar = async () => {
    const res = await fetch(`${API_URL}/api/inventario`)
    if(res.ok) setInventario(await res.json())
  }
  useEffect(() => { cargar() }, [])

  // FILTRADO: Ahora buscamos específicamente 'pendiente' en EstatusAlmacen
  // Las cotizaciones (NULL) se ignoran automáticamente aquí.
  const comprasPendientes = compras.filter(c => {
    const estAlmacen = String(c.EstatusAlmacen || c.estatusAlmacen || '').toLowerCase()
    return estAlmacen === 'pendiente'
  })

  const procesarAlta = async (e) => {
    e.preventDefault()
    await fetch(`${API_URL}/api/inventario/ingresar`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ 
        compraID: item.Numero || item.ID || item.Id, 
        modo, 
        inventarioIDExistente: destino, 
        nombreProducto: item.Producto || item.producto, 
        ubicacion3D: ubicacion, 
        cantidad 
      })
    })
    setItem(null)
    cargar()
    recargarDatos()
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setSubPestana('stock')} 
          style={{ padding: '8px 16px', background: subPestana === 'stock' ? '#0f172a' : '#fff', color: subPestana === 'stock' ? '#fff' : '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
        >
          📦 Stock Físico
        </button>
        <button 
          onClick={() => setSubPestana('recepcion')} 
          style={{ padding: '8px 16px', background: subPestana === 'recepcion' ? '#0f172a' : '#fff', color: subPestana === 'recepcion' ? '#fff' : '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
        >
          📥 Pendientes de Recibir ({comprasPendientes.length})
        </button>
      </div>

      {subPestana === 'stock' ? (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>ID</th>
                <th style={{ padding: '12px' }}>Producto</th>
                <th style={{ padding: '12px' }}>Ubicación 3D</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Stock</th>
              </tr>
            </thead>
            <tbody>
              {inventario.map(i => (
                <tr key={i.ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>#{i.ID}</td>
                  <td style={{ padding: '12px' }}><strong>{i.NombreProducto}</strong></td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                      📍 {i.Ubicacion3D}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700' }}>{i.CantidadStock}</td>
                </tr>
              ))}
              {inventario.length === 0 && (
                <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No hay inventario físico registrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Folio</th>
                <th style={{ padding: '12px' }}>Producto Cotizado</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Cantidad</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {comprasPendientes.map(c => {
                const idC = c.Numero ?? c.ID ?? c.Id
                return (
                  <tr key={idC} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>#{idC}</td>
                    <td style={{ padding: '12px' }}><strong>{c.Producto || c.producto}</strong></td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{c.Cantidad || c.cantidad || 1}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button 
                        onClick={() => {
                          setItem(c)
                          setCantidad(c.Cantidad || c.cantidad || 1)
                          setUbicacion('')
                        }}
                        style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                      >
                        📥 Recibir en Almacén
                      </button>
                    </td>
                  </tr>
                )
              })}
              {comprasPendientes.length === 0 && (
                <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No hay compras pendientes por recibir.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE INGRESO */}
      {item && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(2px)' }}>
          <form onSubmit={procesarAlta} style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h4 style={{ margin: '0 0 4px 0', color: '#0f172a' }}>Dar de alta: {item.Producto || item.producto}</h4>
            
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Modo de Registro:</label>
              <select onChange={e => setModo(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}>
                <option value="nuevo">Producto Nuevo</option>
                <option value="existente">Unificar a Existente</option>
              </select>
            </div>

            {modo === 'existente' && (
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Seleccionar Stock Existente:</label>
                <select onChange={e => setDestino(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}>
                  <option value="">-- Seleccionar --</option>
                  {inventario.map(i => <option key={i.ID} value={i.ID}>{i.NombreProducto} (Ubicación: {i.Ubicacion3D})</option>)}
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Ubicación 3D:</label>
              <input type="text" placeholder="Ej. Pieza4" value={ubicacion} onChange={e => setUbicacion(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Cantidad:</label>
              <input type="number" min="1" value={cantidad} onChange={e => setCantidad(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button type="button" onClick={() => setItem(null)} style={{ background: '#fff', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Cancelar</button>
              <button type="submit" style={{ background: '#047857', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Confirmar Ingreso</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}