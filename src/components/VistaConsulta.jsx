import { useState } from 'react'

export default function VistaConsulta({ compras, iniciarEdicion, proveedoresUnicos, categoriasUnicas, proyectosUnicos }) {
  const [filtroProveedor, setFiltroProveedor] = useState('')
  const [filtroProyecto, setFiltroProyecto] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroProducto, setFiltroProducto] = useState('')
  const [filtroEstatus, setFiltroEstatus] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')

  const columnasOcultas = ['fechacreacion', 'fecha_creacion']
  const esColumnaOculta = (nombreColumna) => columnasOcultas.includes(String(nombreColumna).toLowerCase())

  const comprasFiltradas = compras.filter((c) => {
    const prov = (c.Proveedor || c.proveedor || '').toLowerCase()
    const proy = (c.Proyecto || c.proyecto || '').toLowerCase()
    const cat = (c.Categoria || c.categoria || '').toLowerCase()
    const prod = (c.Producto || c.producto || '').toLowerCase()
    const est = (c.Estatus || c.estatus || 'Comprado').toLowerCase()
    const fecha = String(c.FechaCompra || c.fechaCompra || c.Fecha || c.fecha || '').split('T')[0]

    const cumpleProveedor = !filtroProveedor || prov === filtroProveedor.toLowerCase()
    const cumpleProyecto = !filtroProyecto || proy === filtroProyecto.toLowerCase()
    const cumpleCategoria = !filtroCategoria || cat === filtroCategoria.toLowerCase()
    const cumpleProducto = !filtroProducto || prod.includes(filtroProducto.toLowerCase())
    const cumpleEstatus = !filtroEstatus || est === filtroEstatus.toLowerCase()
    
    let cumpleFecha = true
    if (filtroFechaInicio && fecha) cumpleFecha = cumpleFecha && fecha >= filtroFechaInicio
    if (filtroFechaFin && fecha) cumpleFecha = cumpleFecha && fecha <= filtroFechaFin

    return cumpleProveedor && cumpleProyecto && cumpleCategoria && cumpleProducto && cumpleEstatus && cumpleFecha
  })

  // SUMA EXCLUSIVA DE REGISTROS CON ESTATUS "COMPRADO"
  const sumaCostoComprado = comprasFiltradas
    .filter(c => String(c.Estatus || c.estatus || 'Comprado').toLowerCase() === 'comprado')
    .reduce((acc, curr) => acc + (Number(curr.Costo || curr.costo) || 0), 0)

  const limpiarFiltros = () => {
    setFiltroProveedor(''); setFiltroProyecto(''); setFiltroCategoria('')
    setFiltroProducto(''); setFiltroEstatus(''); setFiltroFechaInicio(''); setFiltroFechaFin('')
  }

  const renderizarCelda = (columna, valor) => {
    if (valor === null || valor === undefined || valor === '') return '-'
    const colLower = columna.toLowerCase()

    if (colLower === 'estatus') {
      const esComprado = String(valor).toLowerCase() === 'comprado'
      return (
        <span style={{
          backgroundColor: esComprado ? '#d4edda' : '#fff3cd',
          color: esComprado ? '#155724' : '#856404',
          padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px'
        }}>
          {valor}
        </span>
      )
    }

    if (colLower === 'url_saas' || colLower === 'urlsaas') {
      const rutaLimpia = String(valor).split('?')[0].toLowerCase()
      const esImagen = /\.(jpeg|jpg|gif|png|webp|svg)$/.test(rutaLimpia)
      return esImagen ? (
        <a href={valor} target="_blank" rel="noopener noreferrer"><img src={valor} alt="Preview" style={estilos.imagenMiniatura} /></a>
      ) : (
        <a href={valor} target="_blank" rel="noopener noreferrer" style={estilos.botonAccionVer}>📄 Ver</a>
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
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div style={estilos.panelFiltros}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: '#333' }}>🔎 Filtros de Búsqueda</h3>
          <button onClick={limpiarFiltros} style={estilos.botonLimpiar}>🧹 Limpiar</button>
        </div>

        <div style={estilos.grupoFiltros}>
          <div style={estilos.itemFiltro}>
            <label style={estilos.labelFiltro}>Estatus:</label>
            <select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)} style={estilos.selectFiltro}>
              <option value="">Todos</option>
              <option value="Comprado">Comprado</option>
              <option value="Cotizado">Cotizado</option>
            </select>
          </div>

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
            <input type="text" placeholder="Ej. Solera..." value={filtroProducto} onChange={(e) => setFiltroProducto(e.target.value)} style={estilos.inputFiltro} />
          </div>

          <div style={estilos.itemFiltro}>
            <label style={estilos.labelFiltro}>Desde:</label>
            <input type="date" value={filtroFechaInicio} onChange={(e) => setFiltroFechaInicio(e.target.value)} style={estilos.inputFiltro} />
          </div>

          <div style={estilos.itemFiltro}>
            <label style={estilos.labelFiltro}>Hasta:</label>
            <input type="date" value={filtroFechaFin} onChange={(e) => setFiltroFechaFin(e.target.value)} style={estilos.inputFiltro} />
          </div>
        </div>

        {/* Métrica de acumulado filtrando SOLAMENTE 'Comprados' */}
        <div style={estilos.contenedorMetricas}>
          <div style={estilos.tarjetaMetrica}>
            <span style={{ fontSize: '11px', color: '#666' }}>Registros Visibles</span>
            <strong style={{ fontSize: '15px', color: '#1e1e1e' }}>{comprasFiltradas.length}</strong>
          </div>
          <div style={estilos.tarjetaMetrica}>
            <span style={{ fontSize: '11px', color: '#666' }}>Monto Total (Solo Comprados)</span>
            <strong style={{ fontSize: '15px', color: '#28a745' }}>
              ${sumaCostoComprado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      </div>

      {comprasFiltradas.length === 0 ? (
        <p style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No se encontraron compras/cotizaciones.</p>
      ) : (
        <table style={estilos.tabla}>
          <thead>
            <tr style={estilos.encabezadoTabla}>
              {Object.keys(comprasFiltradas[0]).filter((col) => !esColumnaOculta(col)).map((col) => (
                <th key={col} style={estilos.th}>{(col.toLowerCase() === 'url_saas' || col.toLowerCase() === 'urlsaas') ? 'Doc' : col}</th>
              ))}
              <th style={{ ...estilos.th, width: '60px' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {comprasFiltradas.map((fila, index) => {
              const idFila = fila.Numero ?? fila.ID ?? fila.Id ?? index
              return (
                <tr key={idFila} style={{ borderBottom: '1px solid #dee2e6' }}>
                  {Object.entries(fila).filter(([col]) => !esColumnaOculta(col)).map(([col, valor], idx) => (
                    <td style={estilos.td} key={idx}>{renderizarCelda(col, valor)}</td>
                  ))}
                  <td style={estilos.td}>
                    <button onClick={() => iniciarEdicion(fila)} style={estilos.botonAccionEditar}>✏️</button>
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
  panelFiltros: { backgroundColor: '#f8f9fa', border: '1px solid #e3e6f0', borderRadius: '8px', padding: '12px 15px', marginBottom: '15px' },
  grupoFiltros: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '10px' },
  itemFiltro: { display: 'flex', flexDirection: 'column', flex: '1', minWidth: '120px' },
  labelFiltro: { fontSize: '11px', fontWeight: 'bold', color: '#555', marginBottom: '3px' },
  selectFiltro: { padding: '5px 8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', fontSize: '12px', width: '100%' },
  inputFiltro: { padding: '5px 8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', fontSize: '12px', width: '100%', boxSizing: 'border-box' },
  botonLimpiar: { backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' },
  contenedorMetricas: { display: 'flex', gap: '10px', borderTop: '1px solid #e0e0e0', paddingTop: '10px' },
  tarjetaMetrica: { backgroundColor: '#fff', padding: '6px 12px', borderRadius: '5px', border: '1px solid #ddd', display: 'flex', flexDirection: 'column', minWidth: '160px' },
  botonAccionEditar: { backgroundColor: '#ffc107', color: '#212529', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  botonAccionVer: { backgroundColor: '#17a2b8', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', textDecoration: 'none', display: 'inline-block' },
  tabla: { width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '12px' },
  encabezadoTabla: { backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left' },
  th: { padding: '8px 6px', color: '#495057', wordBreak: 'break-word', overflow: 'hidden' },
  td: { padding: '8px 6px', verticalAlign: 'middle', wordBreak: 'break-word', overflow: 'hidden' },
  imagenMiniatura: { width: '38px', height: '38px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }
}