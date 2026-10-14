import { useState, useEffect, useCallback } from 'react'

export default function GestionAlmacenInventario({
  compras = [],
  API_URL,
  recargarDatos,
  mostrarToast,
  irAlVisor3D
}) {
  const [subPestana, setSubPestana] = useState('stock')
  const [inventario, setInventario] = useState([])
  const [item, setItem] = useState(null)
  const [modo, setModo] = useState('nuevo')
  const [destino, setDestino] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [cantidad, setCantidad] = useState(1)

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/inventario`)
      if (res.ok) setInventario(await res.json())
    } catch {
      // Silencioso si no hay conexión
    }
  }, [API_URL])

  useEffect(() => {
    cargar()
  }, [cargar])

  const comprasPendientes = compras.filter((c) => {
    const estAlmacen = String(c.EstatusAlmacen || c.estatusAlmacen || '').toLowerCase()
    return estAlmacen === 'pendiente'
  })

  const procesarAlta = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/api/inventario/ingresar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compraID: item.Numero || item.ID || item.Id,
          modo,
          inventarioIDExistente: destino,
          nombreProducto: item.Producto || item.producto,
          ubicacion3D: ubicacion,
          cantidad
        })
      })
      if (!res.ok) throw new Error('Error al registrar entrada en almacén')
      if (mostrarToast) mostrarToast('Mercancía ingresada al inventario físico y 3D')
      setItem(null)
      cargar()
      recargarDatos()
    } catch (err) {
      if (mostrarToast) mostrarToast(err.message, 'error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="pro-segmented">
          <button
            className={`pro-segmented-btn ${subPestana === 'stock' ? 'active' : ''}`}
            onClick={() => setSubPestana('stock')}
          >
            📦 Stock Físico Actual ({inventario.length})
          </button>
          <button
            className={`pro-segmented-btn ${subPestana === 'recepcion' ? 'active' : ''}`}
            onClick={() => setSubPestana('recepcion')}
          >
            📥 Compras Pendientes por Recibir ({comprasPendientes.length})
          </button>
        </div>

        {irAlVisor3D && (
          <button onClick={irAlVisor3D} className="pro-btn pro-btn-secondary">
            🧊 Ver Mapa 3D de Almacén
          </button>
        )}
      </div>

      {subPestana === 'stock' ? (
        <div className="pro-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>ID</th>
                <th>Descripción del Producto</th>
                <th>Nodo / Ubicación 3D</th>
                <th style={{ textAlign: 'center' }}>Existencia Física</th>
              </tr>
            </thead>
            <tbody>
              {inventario.map((i) => (
                <tr key={i.ID}>
                  <td className="pro-mono" style={{ textAlign: 'center', fontWeight: 700, color: '#86868b' }}>
                    #{i.ID}
                  </td>
                  <td style={{ fontWeight: 600 }}>{i.NombreProducto}</td>
                  <td>
                    <span className="pro-badge pro-mono" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                      📍 {i.Ubicacion3D}
                    </span>
                  </td>
                  <td className="pro-mono" style={{ textAlign: 'center', fontWeight: 800, fontSize: '14px' }}>
                    {i.CantidadStock}
                  </td>
                </tr>
              ))}
              {inventario.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '42px', textAlign: 'center', color: '#86868b' }}>
                    No hay inventario físico registrado aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="pro-table-container">
          <table className="pro-table">
            <thead>
              <tr>
                <th style={{ width: '90px', textAlign: 'center' }}>Folio OC</th>
                <th>Producto Comprado</th>
                <th>Proveedor</th>
                <th style={{ textAlign: 'center' }}>Cantidad</th>
                <th style={{ textAlign: 'right' }}>Recepción</th>
              </tr>
            </thead>
            <tbody>
              {comprasPendientes.map((c) => {
                const idC = c.Numero ?? c.ID ?? c.Id
                return (
                  <tr key={idC}>
                    <td className="pro-mono" style={{ textAlign: 'center', fontWeight: 700 }}>#{idC}</td>
                    <td style={{ fontWeight: 600 }}>{c.Producto || c.producto}</td>
                    <td style={{ color: '#515154' }}>{c.Proveedor || c.proveedor || '—'}</td>
                    <td className="pro-mono" style={{ textAlign: 'center', fontWeight: 700 }}>
                      {c.Cantidad || c.cantidad || 1}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setItem(c)
                          setCantidad(c.Cantidad || c.cantidad || 1)
                          setUbicacion('')
                        }}
                        className="pro-btn pro-btn-primary pro-btn-sm"
                      >
                        📥 Dar Entrada en Almacén
                      </button>
                    </td>
                  </tr>
                )
              })}
              {comprasPendientes.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '42px', textAlign: 'center', color: '#86868b' }}>
                    Todas las compras están recibidas en almacén.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VENTANA EMERGENTE DE RECEPCIÓN DE MERCANCÍA */}
      {item && (
        <div className="pro-modal-backdrop" onClick={() => setItem(null)}>
          <div className="pro-modal-window" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="pro-modal-header">
              <div>
                <h3 style={{ fontSize: '15px', margin: 0 }}>Recepción en Almacén</h3>
                <span style={{ fontSize: '12px', color: '#86868b' }}>
                  {item.Producto || item.producto}
                </span>
              </div>
              <button onClick={() => setItem(null)} className="pro-btn pro-btn-secondary pro-btn-sm">✕</button>
            </div>

            <form onSubmit={procesarAlta}>
              <div className="pro-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="pro-label">Modalidad de Ingreso</label>
                  <select value={modo} onChange={(e) => setModo(e.target.value)} className="pro-select">
                    <option value="nuevo">Crear Nuevo SKU en Almacén</option>
                    <option value="existente">Sumar a SKU Existente</option>
                  </select>
                </div>

                {modo === 'existente' && (
                  <div>
                    <label className="pro-label">Seleccionar SKU Existente</label>
                    <select value={destino} onChange={(e) => setDestino(e.target.value)} required className="pro-select">
                      <option value="">-- Seleccionar --</option>
                      {inventario.map((i) => (
                        <option key={i.ID} value={i.ID}>
                          {i.NombreProducto} ({i.Ubicacion3D})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="pro-label">Asignar Nodo / Ubicación 3D *</label>
                  <input
                    type="text"
                    placeholder="Ej. Pieza4, EstanteB2..."
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    required
                    className="pro-input pro-mono"
                  />
                </div>

                <div>
                  <label className="pro-label">Cantidad Recibida *</label>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    required
                    className="pro-input pro-mono"
                  />
                </div>
              </div>

              <div className="pro-modal-footer">
                <button type="button" onClick={() => setItem(null)} className="pro-btn pro-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="pro-btn pro-btn-success">
                  ✓ Confirmar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}