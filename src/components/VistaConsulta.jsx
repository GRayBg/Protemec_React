import { useState } from 'react'

export default function VistaConsulta({ compras, iniciarEdicion, proveedoresUnicos, categoriasUnicas, proyectosUnicos }) {
  // Estados de filtros locales
  const [filtroProveedor, setFiltroProveedor] = useState('')
  const [filtroProyecto, setFiltroProyecto] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroProducto, setFiltroProducto] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')

  const columnasOcultas = ['fechacreacion', 'fecha_creacion']
  const esColumnaOculta = (nombreColumna) => columnasOcultas.includes(String(nombreColumna).toLowerCase())

  // Filtrado dinámico
  const comprasFiltradas = compras.filter((c) => {
    const prov = (c.Proveedor || c.proveedor || '').toLowerCase()
    const proy = (c.Proyecto || c.proyecto || '').toLowerCase()
    const cat = (c.Categoria || c.categoria || '').toLowerCase()
    const prod = (c.Producto || c.producto || '').toLowerCase()
    const fecha = String(c.FechaCompra || c.fechaCompra || c.Fecha || c.fecha || '').split('T')[0]

    const cumpleProveedor = !filtroProveedor || prov === filtroProveedor.toLowerCase()
    const cumpleProyecto = !filtroProyecto || proy === filtroProyecto.toLowerCase()
    const cumpleCategoria = !filtroCategoria || cat === filtroCategoria.toLowerCase()
    const cumpleProducto = !filtroProducto || prod.includes(filtroProducto.toLowerCase())
    
    let cumpleFecha = true
    if (filtroFechaInicio && fecha) cumpleFecha = cumpleFecha && fecha >= filtroFechaInicio
    if (filtroFechaFin && fecha) cumpleFecha = cumpleFecha && fecha <= filtroFechaFin

    return cumpleProveedor && cumpleProyecto && cumpleCategoria && cumpleProducto && cumpleFecha
  })

  // Total acumulado filtrado
  const sumaCostoFiltrado = comprasFiltradas.reduce((acc, curr) => acc + (Number(curr.Costo || curr.costo) || 0), 0)

  const limpiarFiltros = () => {
    setFiltroProveedor('')
    setFiltroProyecto('')
    setFiltroCategoria('')
    setFiltroProducto('')
    setFiltroFechaInicio('')
    setFiltroFechaFin('')
  }

  const renderizarCelda = (columna, valor) => {
    if (valor === null || valor === undefined || valor === '') return '-'
    const colLower = columna.toLowerCase()

    if (colLower === 'url_saas' || colLower === 'urlsaas') {
      const rutaLimpia = String(valor).split('?')[0].toLowerCase()
      const esImagen = /\.(jpeg|jpg|gif|png|webp|svg)$/.test(rutaLimpia)

      return esImagen ? (
        <a href={valor} target="_blank" rel="noopener noreferrer">
          <img src={valor} alt="Preview" style={estilos.imagenMiniatura} />
        </a>
      ) : (
        <a href={valor} target="_blank" rel="noopener noreferrer" style={estilos.botonAccionVer}>
          📄 Documento
        </a>
      )
    }

    if (colLower === 'costo' || colLower === 'preciounitario') {
      const numero = Number(valor)
      return isNaN(numero) ? valor : `$${numero.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    if (colLower.includes('fecha')) {
      const fechaStr = String(valor).split('T')[0]
      const partes = fechaStr.split('-')
      return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : String(valor)
    }

    return String(valor)
  }

  return (
    <div>
      {/* Panel de Filtros */}
      <div style={estilos.panelFiltros}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>🔎 Filtros de Búsqueda</h3>
          <button onClick={limpiarFiltros} style={estilos.botonLimpiar}>
            🧹 Limpiar Filtros
          </button>
        </div>

        <div style={estilos.grupoFiltros}>
          <div style={estilos.itemFiltro}>
            <label style={estilos.labelFiltro}>Proveedor:</label>
            <select value={filtroProveedor} onChange={(e) => setFiltroProveedor(e.target.value)} style={estilos.selectFiltro}>
              <option value="">Todos ({proveedoresUnicos.length})</option>
              {proveedoresUnicos.map((p, i) => <option key={i} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={estilos.itemFiltro}>
            <label style={estilos.labelFiltro}>Proyecto:</label>
            <select value={filtroProyecto} onChange={(e) => setFiltroProyecto(e.target.value)} style={estilos.selectFiltro}>
              <option value="">Todos ({proyectosUnicos.length})</option>
              {proyectosUnicos.map((p, i) => <option key={i} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={estilos.itemFiltro}>
            <label style={estilos.labelFiltro}>Categoría:</label>
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={estilos.selectFiltro}>
              <option value="">Todas ({categoriasUnicas.length})</option>
              {categoriasUnicas.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={estilos.itemFiltro}>
            <label style={estilos.labelFiltro}>Buscar Producto:</label>
            <input 
              type="text" 
              placeholder="Ej. Solera..." 
              value={filtroProducto} 
              onChange={(e) => setFiltroProducto(e.target.value)}
              style={estilos.inputFiltro}
            />
          </div>

          <div style={estilos.itemFiltro}>
            <label style={estilos.labelFiltro}>Desde:</label>
            <input 
              type="date" 
              value={filtroFechaInicio} 
              onChange={(e) => setFiltroFechaInicio(e.target.value)} 
              style={estilos.inputFiltro}
            />
          </div>

          <div style={estilos.itemFiltro}>
            <label style={estilos.labelFiltro}>Hasta:</label>
            <input 
              type="date" 
              value={filtroFechaFin} 
              onChange={(e) => setFiltroFechaFin(e.target.value)} 
              style={estilos.inputFiltro}
            />
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div style={estilos.contenedorMetricas}>
          <div style={estilos.tarjetaMetrica}>
            <span style={{ fontSize: '12px', color: '#666' }}>Registros Encontrados</span>
            <strong style={{ fontSize: '18px', color: '#1e1e1e' }}>{comprasFiltradas.length}</strong>
          </div>
          <div style={estilos.tarjetaMetrica}>
            <span style={{ fontSize: '12px', color: '#666' }}>Monto Total Filtrado</span>
            <strong style={{ fontSize: '18px', color: '#28a745' }}>
              ${sumaCostoFiltrado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {comprasFiltradas.length === 0 ? (
        <p style={{ padding: '20px', textAlign: 'center', color: '#777' }}>
          No se encontraron compras con los filtros seleccionados.
        </p>
      ) : (
        <table style={estilos.tabla}>
          <thead>
            <tr style={estilos.encabezadoTabla}>
              {Object.keys(comprasFiltradas[0])
                .filter((columna) => !esColumnaOculta(columna))
                .map((columna) => {
                  const colLower = columna.toLowerCase()
                  const tituloColumna = (colLower === 'url_saas' || colLower === 'urlsaas') ? 'Documento' : columna
                  return <th key={columna} style={estilos.th}>{tituloColumna}</th>
                })}
              <th style={estilos.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {comprasFiltradas.map((fila, index) => {
              const idFila = fila.Numero ?? fila.ID ?? fila.Id ?? index
              return (
                <tr key={idFila} style={{ borderBottom: '1px solid #dee2e6' }}>
                  {Object.entries(fila)
                    .filter(([columna]) => !esColumnaOculta(columna))
                    .map(([columna, valor], idx) => (
                      <td style={{ padding: '12px', verticalAlign: 'middle' }} key={idx}>
                        {renderizarCelda(columna, valor)}
                      </td>
                    ))}
                  <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                    <button onClick={() => iniciarEdicion(fila)} style={estilos.botonAccionEditar}>
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

const estilos = {
  panelFiltros: { backgroundColor: '#f8f9fa', border: '1px solid #e3e6f0', borderRadius: '8px', padding: '20px', marginBottom: '25px' },
  grupoFiltros: { display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '15px' },
  itemFiltro: { display: 'flex', flexDirection: 'column', flex: '1', minWidth: '160px' },
  labelFiltro: { fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '5px' },
  selectFiltro: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', fontSize: '13px' },
  inputFiltro: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', fontSize: '13px' },
  botonLimpiar: { backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  contenedorMetricas: { display: 'flex', gap: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '15px' },
  tarjetaMetrica: { backgroundColor: '#fff', padding: '10px 15px', borderRadius: '6px', border: '1px solid #ddd', display: 'flex', flexDirection: 'column', minWidth: '180px' },
  botonAccionEditar: { backgroundColor: '#ffc107', color: '#212529', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' },
  botonAccionVer: { backgroundColor: '#17a2b8', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '13px', textDecoration: 'none', display: 'inline-block' },
  tabla: { width: '100%', borderCollapse: 'collapse', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  encabezadoTabla: { backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left' },
  th: { padding: '12px', color: '#495057' },
  imagenMiniatura: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer' }
}