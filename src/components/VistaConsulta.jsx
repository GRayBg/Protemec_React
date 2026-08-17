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
  const [filtroProyectoId, setFiltroProyectoId] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroMaterial, setFiltroMaterial] = useState('')
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

  // Listas únicas para los selectores
  const materialesUnicos = [...new Set(compras.map(c => c.Material || c.material).filter(Boolean))]
  const proyectoIdsUnicos = [...new Set(compras.map(c => c.ProyectoID_Externo || c.proyectoID_Externo).filter(Boolean))]
  const proyectosNombreUnicos = [...new Set(compras.map(c => c.Proyecto || c.proyecto).filter(Boolean))]

  const comprasFiltradas = comprasProcesadas.filter((c) => {
    const est = (c.Estatus || c.estatus || 'Comprado').toLowerCase()
    if (est === 'cancelado') return false

    const prov = (c.Proveedor || c.proveedor || '').toLowerCase()
    const proy = (c.Proyecto || c.proyecto || '').toLowerCase()
    const proyId = (c.ProyectoID_Externo || c.proyectoID_Externo || '').toLowerCase()
    const cat = (c.Categoria || c.categoria || '').toLowerCase()
    const mat = (c.Material || c.material || '').toLowerCase()
    const prod = (c.Producto || c.producto || '').toLowerCase()
    const idStr = String(c.Numero ?? c.ID ?? c.Id ?? c.id ?? '')
    const fecha = String(c.FechaCompra || c.fechaCompra || c.Fecha || c.fecha || '').split('T')[0]

    const cumpleBusquedaRapida = !busquedaRapida || 
      prod.includes(busquedaRapida.toLowerCase()) || 
      prov.includes(busquedaRapida.toLowerCase()) ||
      idStr.includes(busquedaRapida)

    const cumpleProveedor = !filtroProveedor || prov === filtroProveedor.toLowerCase()
    const cumpleProyecto = !filtroProyecto || proy === filtroProyecto.toLowerCase()
    const cumpleProyectoId = !filtroProyectoId || proyId === filtroProyectoId.toLowerCase()
    const cumpleCategoria = !filtroCategoria || cat === filtroCategoria.toLowerCase()
    const cumpleMaterial = !filtroMaterial || mat === filtroMaterial.toLowerCase()
    const cumpleEstatus = !filtroEstatus || est === filtroEstatus.toLowerCase()
    
    let cumpleFecha = true
    if (filtroFechaInicio && fecha) cumpleFecha = cumpleFecha && fecha >= filtroFechaInicio
    if (filtroFechaFin && fecha) cumpleFecha = cumpleFecha && fecha <= filtroFechaFin

    return cumpleBusquedaRapida && cumpleProveedor && cumpleProyecto && cumpleProyectoId && cumpleCategoria && cumpleMaterial && cumpleEstatus && cumpleFecha
  })

  const sumaCostoComprado = comprasFiltradas
    .filter(c => String(c.Estatus || c.estatus || 'Comprado').toLowerCase() === 'comprado')
    .reduce((acc, curr) => acc + curr._subtotalCalculado, 0)

  const sumaCostoCompradoConIva = sumaCostoComprado * 1.16

  const limpiarFiltros = () => {
    setBusquedaRapida(''); setFiltroProveedor(''); setFiltroProyecto(''); setFiltroProyectoId('')
    setFiltroCategoria(''); setFiltroMaterial(''); setFiltroEstatus(''); setFiltroFechaInicio(''); setFiltroFechaFin('')
  }

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
        return (
          <span style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '3px 7px', borderRadius: '5px', fontFamily: 'Consolas, monospace', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap' }}>
            #{val}
          </span>
        )
      }
      case 'proveedor':
        return <strong style={{ color: '#0f172a', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>{fila.Proveedor || fila.proveedor || '—'}</strong>
      case 'fecha_compra': {
        const f = String(fila.FechaCompra || fila.fechaCompra || fila.Fecha || fila.fecha || '').split('T')[0]
        const partes = f.split('-')
        return <span style={{ color: '#475569', fontSize: '12.5px', fontWeight: '600', whiteSpace: 'nowrap' }}>{partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : (f || '—')}</span>
      }
      case 'producto':
        return <span style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b', padding: '3px 7px', borderRadius: '5px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>{fila.Producto || fila.producto || '—'}</span>
      case 'subtotal': {
        const val = fila._subtotalCalculado
        return <span style={{ fontFamily: 'Consolas, SFMono-Regular, monospace', fontWeight: '700', color: '#0f172a', fontSize: '13px', whiteSpace: 'nowrap' }}>${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      }
      case 'total_con_iva': {
        const val = fila._totalConIvaCalculado
        return (
          <span style={{ fontFamily: 'Consolas, SFMono-Regular, monospace', fontWeight: '800', color: '#047857', backgroundColor: '#ecfdf5', padding: '4px 8px', borderRadius: '6px', fontSize: '13.5px', whiteSpace: 'nowrap', border: '1px solid #a7f3d0' }}>
            ${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )
      }
      case 'pdf': {
        const url = fila.URL_SaaS || fila.urlSaaS || fila.url_saas
        if (!url) return <span style={{ color: '#cbd5e1' }}>—</span>
        const esImagen = /\.(jpeg|jpg|gif|png|webp|svg)$/.test(String(url).split('?')[0].toLowerCase())
        return esImagen ? (
          <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="Preview" style={estilos.imagenMiniatura} /></a>
        ) : (
          <a href={url} target="_blank" rel="noopener noreferrer" style={estilos.botonAccionVer}><span>📄</span> Ver</a>
        )
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
            display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: esComprado ? '#10b981' : '#f59e0b' }}></span>
            {est}
          </span>
        )
      }
      default:
        return '—'
    }
  }

  return (
    <div ref={contenedorRef} style={{ width: '100%', boxSizing: 'border-box' }}>
      
      {/* TARJETAS DE INDICADORES (KPIs) */}
      <div style={estilos.gridMetricas}>
        {/* KPI PROYECTO ACTIVO CON DOS SELECTORES INDEPENDIENTES */}
        <div style={{ ...estilos.kpiCard, borderLeft: '4px solid #2563eb' }}>
          <div style={estilos.kpiHeader}>
            <span style={estilos.kpiLabel}>Proyecto Activo</span>
            <span style={estilos.kpiIcono}>📁</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0' }}>
            <select 
              value={filtroProyecto} 
              onChange={(e) => { setFiltroProyecto(e.target.value); if(e.target.value) setFiltroProyectoId(''); }} 
              style={estilos.kpiSelectProyecto}
            >
              <option value="">-- Filtrar por Nombre --</option>
              {proyectosNombreUnicos.map((p, i) => <option key={i} value={p}>{p}</option>)}
            </select>

            <select 
              value={filtroProyectoId} 
              onChange={(e) => { setFiltroProyectoId(e.target.value); if(e.target.value) setFiltroProyecto(''); }} 
              style={{ ...estilos.kpiSelectProyecto, fontSize: '14px', color: '#0284c7' }}
            >
              <option value="">-- Filtrar por ID Externo --</option>
              {proyectoIdsUnicos.map((pid, i) => <option key={i} value={pid}>{pid}</option>)}
            </select>
          </div>

          <span style={estilos.kpiSubtexto}>
            {(filtroProyecto || filtroProyectoId) ? 'Proyecto filtrado activo' : 'Selecciona por Nombre o ID'}
          </span>
        </div>

        <div style={{ ...estilos.kpiCard, borderLeft: '4px solid #6366f1' }}>
          <div style={estilos.kpiHeader}>
            <span style={estilos.kpiLabel}>Registros Visibles</span>
            <span style={estilos.kpiIcono}>📋</span>
          </div>
          <div style={{ ...estilos.kpiValor, color: '#0f172a' }}>{comprasFiltradas.length}</div>
          <span style={estilos.kpiSubtexto}>Transacciones identificadas</span>
        </div>

        <div style={{ ...estilos.kpiCard, borderLeft: '4px solid #10b981' }}>
          <div style={estilos.kpiHeader}>
            <span style={estilos.kpiLabel}>Total c/ IVA (Solo Comprados)</span>
            <span style={estilos.kpiIcono}>💵</span>
          </div>
          <div style={{ ...estilos.kpiValor, color: '#047857' }}>
            ${sumaCostoCompradoConIva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={estilos.kpiSubtexto}>Subtotal: ${sumaCostoComprado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS */}
      <div style={estilos.barraHerramientas}>
        <div style={estilos.contenedorBuscador}>
          <span style={estilos.iconoBuscador}>🔍</span>
          <input type="text" placeholder="Buscar por producto, proveedor o #folio..." value={busquedaRapida} onChange={(e) => setBusquedaRapida(e.target.value)} style={estilos.inputBuscador} />
          {busquedaRapida && <button onClick={() => setBusquedaRapida('')} style={estilos.btnLimpiarInput}>✕</button>}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* BOTÓN DE LIMPIAR FILTROS GENERAL */}
          <button onClick={limpiarFiltros} style={estilos.botonLimpiarGeneral} title="Restablecer todos los filtros">
            🔄 Limpiar Filtros
          </button>
          <button onClick={() => setMostrarFiltros(!mostrarFiltros)} onMouseEnter={() => setHoverBtnFiltros(true)} onMouseLeave={() => setHoverBtnFiltros(false)} style={estilos.botonToggle(mostrarFiltros, hoverBtnFiltros)}>
            <span>{mostrarFiltros ? '✕' : '⚙️'}</span><span>{mostrarFiltros ? 'Ocultar Filtros' : 'Filtros Avanzados'}</span>
          </button>
        </div>
      </div>

      {/* PANEL DE FILTROS AVANZADOS */}
      {mostrarFiltros && (
        <div style={estilos.panelFiltrosAvanzados}>
          <div style={estilos.gridFiltros}>
            <div style={estilos.filtroItem}>
              <label style={estilos.filtroLabel}>Proveedor</label>
              <select value={filtroProveedor} onChange={(e) => setFiltroProveedor(e.target.value)} style={estilos.filtroSelect}>
                <option value="">Todos los proveedores</option>
                {proveedoresUnicos && proveedoresUnicos.map((prov, i) => <option key={i} value={prov}>{prov}</option>)}
              </select>
            </div>

            <div style={estilos.filtroItem}>
              <label style={estilos.filtroLabel}>Proyecto ID</label>
              <select value={filtroProyectoId} onChange={(e) => setFiltroProyectoId(e.target.value)} style={estilos.filtroSelect}>
                <option value="">Todos los IDs</option>
                {proyectoIdsUnicos && proyectoIdsUnicos.map((pid, i) => <option key={i} value={pid}>{pid}</option>)}
              </select>
            </div>

            <div style={estilos.filtroItem}>
              <label style={estilos.filtroLabel}>Categoría</label>
              <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={estilos.filtroSelect}>
                <option value="">Todas las categorías</option>
                {categoriasUnicas && categoriasUnicas.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div style={estilos.filtroItem}>
              <label style={estilos.filtroLabel}>Material</label>
              <select value={filtroMaterial} onChange={(e) => setFiltroMaterial(e.target.value)} style={estilos.filtroSelect}>
                <option value="">Todos los materiales</option>
                {materialesUnicos && materialesUnicos.map((mat, i) => <option key={i} value={mat}>{mat}</option>)}
              </select>
            </div>

            <div style={estilos.filtroItem}>
              <label style={estilos.filtroLabel}>Estatus</label>
              <select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)} style={estilos.filtroSelect}>
                <option value="">Todos los estatus</option>
                <option value="Comprado">Comprado</option>
                <option value="Cotizado">Cotizado</option>
              </select>
            </div>

            <div style={estilos.filtroItem}>
              <label style={estilos.filtroLabel}>Fecha Inicio</label>
              <input type="date" value={filtroFechaInicio} onChange={(e) => setFiltroFechaInicio(e.target.value)} style={estilos.filtroInput} />
            </div>

            <div style={estilos.filtroItem}>
              <label style={estilos.filtroLabel}>Fecha Fin</label>
              <input type="date" value={filtroFechaFin} onChange={(e) => setFiltroFechaFin(e.target.value)} style={estilos.filtroInput} />
            </div>
          </div>

          <div style={estilos.contenedorAccionesFiltros}>
            <button onClick={limpiarFiltros} style={estilos.btnLimpiarFiltros}>Limpiar Filtros</button>
          </div>
        </div>
      )}

      {/* TABLA */}
      <div style={estilos.contenedorTabla}>
        <table style={estilos.tabla}>
          <thead>
            <tr style={estilos.encabezadoTabla}>
              <th style={{ ...estilos.th, width: '36px', textAlign: 'center' }}></th>
              {columnasPrincipales.map((col) => (
                <th key={col.key} style={{ ...estilos.th, textAlign: col.align }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comprasFiltradas.map((fila, index) => {
              const idFila = fila.Numero ?? fila.ID ?? fila.Id ?? index
              const estaAbierto = !!filasExpandidas[idFila]
              const estaEnHover = filaHover === idFila

              const estAlmacen = fila.EstatusAlmacen || fila.estatusAlmacen || 'Pendiente'
              const esRecibido = String(estAlmacen).toLowerCase() === 'recibido en almacén'

              return (
                <>
                  <tr key={idFila} onMouseEnter={() => setFilaHover(idFila)} onMouseLeave={() => setFilaHover(null)} style={estilos.filaTabla(estaEnHover)}>
                    <td style={{ ...estilos.td, textAlign: 'center' }}>
                      <button onClick={() => toggleFilaExpandida(idFila)} style={estilos.botonExpandir}>{estaAbierto ? '▼' : '▶'}</button>
                    </td>
                    {columnasPrincipales.map((col) => (
                      <td key={col.key} style={{ ...estilos.td, textAlign: col.align }}>{renderizarCeldaPrincipal(col.key, fila)}</td>
                    ))}
                  </tr>

                  {estaAbierto && (
                    <tr key={`${idFila}-detalle`} style={{ backgroundColor: '#f8fafc' }}>
                      <td colSpan={columnasPrincipales.length + 1} style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={estilos.contenedorDetalle}>
                          <div style={estilos.detalleItem}>
                            <span style={estilos.detalleLabel}>Proyecto ID:</span>
                            <span style={{ ...estilos.detalleValor, color: '#0284c7', fontWeight: '700' }}>🏷️ {fila.ProyectoID_Externo || fila.proyectoID_Externo || '—'}</span>
                          </div>
                          <div style={estilos.detalleItem}>
                            <span style={estilos.detalleLabel}>Proyecto:</span>
                            <span style={{ ...estilos.detalleValor, color: '#2563eb', fontWeight: '700' }}>📁 {fila.Proyecto || fila.proyecto || '—'}</span>
                          </div>
                          <div style={estilos.detalleItem}>
                            <span style={estilos.detalleLabel}>Categoría:</span>
                            <span style={estilos.detalleValor}>{fila.Categoria || fila.categoria || '—'}</span>
                          </div>
                          <div style={estilos.detalleItem}>
                            <span style={estilos.detalleLabel}>Material:</span>
                            <span style={{ ...estilos.detalleValor, color: '#7c3aed' }}>🛠️ {fila.Material || fila.material || '—'}</span>
                          </div>
                          <div style={estilos.detalleItem}>
                            <span style={estilos.detalleLabel}>Precio Unitario:</span>
                            <span style={estilos.detalleValor}>${Number(fila.PrecioUnitario || fila.precioUnitario || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div style={estilos.detalleItem}>
                            <span style={estilos.detalleLabel}>Cantidad:</span>
                            <span style={estilos.detalleValor}>{fila.Cantidad || fila.cantidad || 0}</span>
                          </div>
                          
                          <div style={estilos.detalleItem}>
                            <span style={estilos.detalleLabel}>Estatus Almacén:</span>
                            <span style={{ 
                              fontSize: '12px', fontWeight: '700', 
                              color: esRecibido ? '#065f46' : '#92400e',
                              backgroundColor: esRecibido ? '#ecfdf5' : '#fffbeb',
                              padding: '3px 8px', borderRadius: '4px', border: `1px solid ${esRecibido ? '#a7f3d0' : '#fde68a'}`
                            }}>
                              {esRecibido ? '📥 Recibido en Almacén' : '⏳ Pendiente de Recibir'}
                            </span>
                          </div>

                          <div style={{ width: '100%', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1' }}>
                            <span style={estilos.detalleLabel}>Notas / Observaciones:</span>
                            <span style={{ ...estilos.detalleValor, color: '#475569', fontStyle: 'italic' }}> {fila.Notas || fila.notas || 'Sin notas registradas.'}</span>
                          </div>

                          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                            <button onClick={() => iniciarEdicion(fila)} style={estilos.botonAccionEditar}>✏️ Editar Registro</button>
                          </div>
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
  gridMetricas: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' },
  kpiCard: { backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '90px' },
  kpiHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' },
  kpiLabel: { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' },
  kpiValoresContainer: { display: 'flex', flexDirection: 'column', gap: '4px' },
  kpiValor: { fontSize: '21px', fontWeight: '800' },
  kpiSelectProyecto: { fontSize: '15px', fontWeight: '800', color: '#0f172a', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 6px', outline: 'none', cursor: 'pointer', width: '100%' },
  kpiSubtexto: { fontSize: '11px', color: '#94a3b8', fontFamily: 'Consolas, monospace' },
  barraHerramientas: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  contenedorBuscador: { position: 'relative', flex: '1', display: 'flex', alignItems: 'center' },
  iconoBuscador: { position: 'absolute', left: '12px', color: '#94a3b8' },
  inputBuscador: { width: '100%', padding: '9px 34px 9px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' },
  btnLimpiarInput: { position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
  botonLimpiarGeneral: { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  botonToggle: (activo) => ({ backgroundColor: activo ? '#0f172a' : '#ffffff', color: activo ? '#ffffff' : '#334155', border: '1px solid #cbd5e1', padding: '9px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }),
  panelFiltrosAvanzados: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '14px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  gridFiltros: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' },
  filtroItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  filtroLabel: { fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  filtroSelect: { padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none', backgroundColor: '#fff' },
  filtroInput: { padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none', backgroundColor: '#fff' },
  contenedorAccionesFiltros: { display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '10px' },
  btnLimpiarFiltros: { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  contenedorTabla: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflowX: 'auto' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  encabezadoTabla: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '12px 10px', color: '#334155', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' },
  filaTabla: (hover) => ({ borderBottom: '1px solid #f1f5f9', backgroundColor: hover ? '#f8fafc' : '#ffffff' }),
  td: { padding: '12px 10px', verticalAlign: 'middle', color: '#1e293b' },
  botonExpandir: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#64748b', padding: '4px 8px' },
  contenedorDetalle: { display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap', padding: '4px 8px' },
  detalleItem: { display: 'flex', flexDirection: 'column', gap: '2px' },
  detalleLabel: { fontSize: '10.5px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' },
  detalleValor: { fontSize: '12.5px', fontWeight: '600', color: '#1e293b' },
  botonAccionEditar: { backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12.5px', fontWeight: '600' },
  botonAccionVer: { backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  imagenMiniatura: { width: '32px', height: '32px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }
}