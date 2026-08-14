import { useState, useEffect, useRef } from 'react'

export default function VistaConsulta({ compras, iniciarEdicion, proveedoresUnicos, categoriasUnicas, proyectosUnicos }) {
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [hoverBtnFiltros, setHoverBtnFiltros] = useState(false)
  const [filaHover, setFilaHover] = useState(null)
  const [filasExpandidas, setFilasExpandidas] = useState({})
  
  const contenedorRef = useRef(null)

  const [busquedaRapida, setBusquedaRapida] = useState('')
  const [filtroProveedor, setFiltroProveedor] = useState('')
  const [filtroProyecto, setFiltroProyecto] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstatus, setFiltroEstatus] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')

  useEffect(() => {
    const manejarClickFuera = (evento) => {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setMostrarFiltros(false)
      }
    }
    document.addEventListener('mousedown', manejarClickFuera)
    return () => document.removeEventListener('mousedown', manejarClickFuera)
  }, [])

  const toggleFilaExpandida = (id) => {
    setFilasExpandidas(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const comprasProcesadas = compras.map(c => {
    const precioU = Number(c.PrecioUnitario || c.precioUnitario || 0)
    const cant = Number(c.Cantidad || c.cantidad || 0)
    const subtotal = Number(c.Costo || c.costo || (precioU * cant) || 0)
    const totalConIva = subtotal * 1.16

    return {
      ...c,
      _subtotalCalculado: subtotal,
      _totalConIvaCalculado: totalConIva
    }
  })

  const comprasFiltradas = comprasProcesadas.filter((c) => {
    const prov = (c.Proveedor || c.proveedor || '').toLowerCase()
    const proy = (c.Proyecto || c.proyecto || '').toLowerCase()
    const cat = (c.Categoria || c.categoria || '').toLowerCase()
    const prod = (c.Producto || c.producto || '').toLowerCase()
    const idStr = String(c.Numero ?? c.ID ?? c.Id ?? c.id ?? '')
    const est = (c.Estatus || c.estatus || 'Comprado').toLowerCase()
    const fecha = String(c.FechaCompra || c.fechaCompra || c.Fecha || c.fecha || '').split('T')[0]

    const cumpleBusquedaRapida = !busquedaRapida || 
      prod.includes(busquedaRapida.toLowerCase()) || 
      prov.includes(busquedaRapida.toLowerCase()) ||
      idStr.includes(busquedaRapida)

    const cumpleProveedor = !filtroProveedor || prov === filtroProveedor.toLowerCase()
    const cumpleProyecto = !filtroProyecto || proy === filtroProyecto.toLowerCase()
    const cumpleCategoria = !filtroCategoria || cat === filtroCategoria.toLowerCase()
    const cumpleEstatus = !filtroEstatus || est === filtroEstatus.toLowerCase()
    
    let cumpleFecha = true
    if (filtroFechaInicio && fecha) cumpleFecha = cumpleFecha && fecha >= filtroFechaInicio
    if (filtroFechaFin && fecha) cumpleFecha = cumpleFecha && fecha <= filtroFechaFin

    return cumpleBusquedaRapida && cumpleProveedor && cumpleProyecto && cumpleCategoria && cumpleEstatus && cumpleFecha
  })

  const sumaCostoComprado = comprasFiltradas
    .filter(c => String(c.Estatus || c.estatus || 'Comprado').toLowerCase() === 'comprado')
    .reduce((acc, curr) => acc + curr._subtotalCalculado, 0)

  const sumaCostoCompradoConIva = sumaCostoComprado * 1.16

  const columnasPrincipales = [
    { key: 'id_cotizacion', label: 'ID Cotización', align: 'center' },
    { key: 'proveedor', label: 'Proveedor', align: 'left' },
    { key: 'fecha_compra', label: 'Fecha Compra', align: 'center' },
    { key: 'producto', label: 'Producto', align: 'left' },
    { key: 'subtotal', label: 'Subtotal', align: 'right' },
    { key: 'total_con_iva', label: 'Total c/ IVA', align: 'right' },
    { key: 'pdf', label: 'PDF', align: 'center' },
    { key: 'estatus', label: 'Estatus', align: 'center' },
  ]

  const renderizarCeldaPrincipal = (colKey, fila) => {
    switch (colKey) {
      case 'id_cotizacion': {
        const val = fila.Numero ?? fila.ID ?? fila.Id ?? fila.id ?? '—'
        return <span style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '3px 7px', borderRadius: '5px', fontFamily: 'Consolas, monospace', fontWeight: '700', fontSize: '12px' }}>#{val}</span>
      }
      case 'proveedor':
        return <strong style={{ color: '#0f172a', fontWeight: '700', fontSize: '13px' }}>{fila.Proveedor || fila.proveedor || '—'}</strong>
      case 'fecha_compra': {
        const f = String(fila.FechaCompra || fila.fechaCompra || fila.Fecha || fila.fecha || '').split('T')[0]
        const partes = f.split('-')
        return <span style={{ color: '#475569', fontSize: '12.5px', fontWeight: '600' }}>{partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : (f || '—')}</span>
      }
      case 'producto':
        return <span style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b', padding: '3px 7px', borderRadius: '5px', fontSize: '12px', fontWeight: '600' }}>{fila.Producto || fila.producto || '—'}</span>
      case 'subtotal': 
        return <span style={{ fontFamily: 'Consolas', fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>${fila._subtotalCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
      case 'total_con_iva': 
        return <span style={{ fontFamily: 'Consolas', fontWeight: '800', color: '#047857', backgroundColor: '#ecfdf5', padding: '4px 8px', borderRadius: '6px', fontSize: '13.5px', border: '1px solid #a7f3d0' }}>${fila._totalConIvaCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
      case 'pdf': {
        const url = fila.URL_SaaS || fila.urlSaaS || fila.url_saas
        if (!url) return <span style={{ color: '#cbd5e1' }}>—</span>
        return <a href={url} target="_blank" rel="noopener noreferrer" style={estilos.botonAccionVer}>📄 Ver</a>
      }
      case 'estatus': {
        const est = fila.Estatus || fila.estatus || 'Comprado'
        const esComprado = String(est).toLowerCase() === 'comprado'
        return (
          <span style={{
            backgroundColor: esComprado ? '#ecfdf5' : '#fffbeb',
            color: esComprado ? '#065f46' : '#b45309',
            border: `1px solid ${esComprado ? '#6ee7b7' : '#fde68a'}`,
            padding: '4px 10px', borderRadius: '9999px', fontWeight: '700', fontSize: '11.5px',
            display: 'inline-flex', alignItems: 'center', gap: '6px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: esComprado ? '#10b981' : '#f59e0b' }}></span>
            {est}
          </span>
        )
      }
      default: return '—'
    }
  }

  return (
    <div ref={contenedorRef} style={{ width: '100%', boxSizing: 'border-box' }}>
      <div style={estilos.gridMetricas}>
        <div style={{ ...estilos.kpiCard, borderLeft: '4px solid #10b981' }}>
          <span style={estilos.kpiLabel}>Total c/ IVA (Solo Comprados)</span>
          <div style={{ ...estilos.kpiValor, color: '#047857' }}>${sumaCostoCompradoConIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div style={estilos.contenedorTabla}>
        <table style={estilos.tabla}>
          <thead>
            <tr style={estilos.encabezadoTabla}>
              <th style={{ width: '36px' }}></th>
              {columnasPrincipales.map((col) => <th key={col.key} style={estilos.th}>{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {comprasFiltradas.map((fila, index) => {
              const idFila = fila.Numero ?? fila.ID ?? fila.Id ?? index
              const estaAbierto = !!filasExpandidas[idFila]
              const estAlmacen = fila.EstatusAlmacen || fila.estatusAlmacen || 'Pendiente'
              const esRecibido = String(estAlmacen).toLowerCase() === 'recibido en almacén'

              return (
                <>
                  <tr key={idFila} style={estilos.filaTabla}>
                    <td style={estilos.td}><button onClick={() => toggleFilaExpandida(idFila)} style={estilos.botonExpandir}>{estaAbierto ? '▼' : '▶'}</button></td>
                    {columnasPrincipales.map((col) => <td key={col.key} style={estilos.td}>{renderizarCeldaPrincipal(col.key, fila)}</td>)}
                  </tr>
                  {estaAbierto && (
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <td colSpan={columnasPrincipales.length + 1} style={{ padding: '12px 20px' }}>
                        <div style={estilos.contenedorDetalle}>
                          <div><strong>Estatus Almacén:</strong> <span style={{ color: esRecibido ? '#065f46' : '#92400e' }}>{estAlmacen}</span></div>
                          <button onClick={() => iniciarEdicion(fila)} style={estilos.botonAccionEditar}>✏️ Editar Registro</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const estilos = {
  gridMetricas: { marginBottom: '14px' },
  kpiCard: { backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' },
  kpiLabel: { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' },
  kpiValor: { fontSize: '21px', fontWeight: '800' },
  contenedorTabla: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflowX: 'auto' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' },
  td: { padding: '12px', borderBottom: '1px solid #f1f5f9' },
  botonExpandir: { background: 'none', border: 'none', cursor: 'pointer' },
  contenedorDetalle: { display: 'flex', gap: '20px', alignItems: 'center' },
  botonAccionEditar: { backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
  botonAccionVer: { color: '#2563eb', textDecoration: 'none', fontWeight: '600' }
}