import { useState, useEffect, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function App() {
  const [compras, setCompras] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Estado para controlar el registro en edición
  const [idEditando, setIdEditando] = useState(null)

  // Estados del formulario
  const [proveedor, setProveedor] = useState('')
  const [costo, setCosto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [producto, setProducto] = useState('')
  const [urlSaaS, setUrlSaaS] = useState('')
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const [fechaCompra, setFechaCompra] = useState('')
  const [guardando, setGuardando] = useState(false)

  const fileInputRef = useRef(null)

  const columnasOcultas = ['fechacreacion', 'fecha_creacion']

  const esColumnaOculta = (nombreColumna) => {
    return columnasOcultas.includes(String(nombreColumna).toLowerCase())
  }

  // Listas de valores únicos autogenerados para el autocompletado
  const proveedoresUnicos = [...new Set(compras.map(c => c.Proveedor || c.proveedor).filter(Boolean))]
  const categoriasUnicas = [...new Set(compras.map(c => c.Categoria || c.categoria).filter(Boolean))]
  const productosUnicos = [...new Set(compras.map(c => c.Producto || c.producto).filter(Boolean))]

  const obtenerCompras = () => {
    fetch(`${API_URL}/api/datos?t=${Date.now()}`)
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error('Error al consultar la API')
        return respuesta.json()
      })
      .then((datos) => {
        setCompras(datos)
        setCargando(false)
      })
      .catch((err) => {
        setError(err.message)
        setCargando(false)
      })
  }

  useEffect(() => {
    obtenerCompras()
  }, [])

  const iniciarEdicion = (fila) => {
    const id = fila.Numero ?? fila.ID ?? fila.Id ?? fila.id
    setIdEditando(id)
    setProveedor(fila.Proveedor || fila.proveedor || '')
    setCosto(fila.Costo || fila.costo || '')
    setCategoria(fila.Categoria || fila.categoria || '')
    setProducto(fila.Producto || fila.producto || '')
    setUrlSaaS(fila.URL_SaaS || fila.urlSaaS || fila.url_saas || '')
    setArchivoSeleccionado(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    const valorFecha = fila.FechaCompra || fila.fechaCompra || fila.Fecha || fila.fecha
    if (valorFecha) {
      const fechaLimpia = String(valorFecha).split('T')[0]
      setFechaCompra(fechaLimpia)
    } else {
      setFechaCompra('')
    }
  }

  const cancelarEdicion = () => {
    setIdEditando(null)
    setProveedor('')
    setCosto('')
    setCategoria('')
    setProducto('')
    setUrlSaaS('')
    setArchivoSeleccionado(null)
    setFechaCompra('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const manejarEnvio = async (e) => {
    e.preventDefault()
    setGuardando(true)

    const esEdicion = idEditando !== null
    const urlEndpoint = esEdicion 
      ? `${API_URL}/api/compras/${idEditando}`
      : `${API_URL}/api/compras`
    
    const metodo = esEdicion ? 'PUT' : 'POST'

    const formData = new FormData()
    formData.append('proveedor', proveedor)
    formData.append('costo', parseFloat(costo) || 0)
    formData.append('categoria', categoria)
    formData.append('producto', producto)
    formData.append('urlSaaS', urlSaaS)
    if (fechaCompra) formData.append('fechaCompra', fechaCompra)

    if (archivoSeleccionado) {
      formData.append('archivo', archivoSeleccionado)
    }

    try {
      const respuesta = await fetch(urlEndpoint, {
        method: metodo,
        body: formData
      })

      if (!respuesta.ok) throw new Error(`Error al ${esEdicion ? 'actualizar' : 'guardar'} el registro`)

      cancelarEdicion()
      setGuardando(false)
      obtenerCompras()
    } catch (err) {
      alert('Error: ' + err.message)
      setGuardando(false)
    }
  }

  const renderizarCelda = (columna, valor) => {
    if (valor === null || valor === undefined || valor === '') return '-'

    const colLower = columna.toLowerCase()

    if (colLower === 'url_saas' || colLower === 'urlsaas') {
      const rutaLimpia = String(valor).split('?')[0].toLowerCase()
      const esImagen = /\.(jpeg|jpg|gif|png|webp|svg)$/.test(rutaLimpia)

      if (esImagen) {
        return (
          <a href={valor} target="_blank" rel="noopener noreferrer" title="Ver imagen en tamaño completo">
            <img src={valor} alt="Vista previa" style={estilos.imagenMiniatura} />
          </a>
        )
      } else {
        return (
          <a href={valor} target="_blank" rel="noopener noreferrer" style={estilos.botonAccionVer}>
            📄 Abrir documento
          </a>
        )
      }
    }

    if (colLower === 'costo') {
      const numero = Number(valor)
      return isNaN(numero) ? valor : `$${numero.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    if (colLower.includes('fecha')) {
      const fechaStr = String(valor).split('T')[0]
      const partes = fechaStr.split('-')
      if (partes.length === 3) {
        const [anio, mes, dia] = partes
        return `${dia}/${mes}/${anio}`
      }
      return String(valor)
    }

    return String(valor)
  }

  if (cargando) return <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>⌛ Conectando a Azure SQL...</div>
  if (error) return <div style={{ padding: '40px', color: 'red', fontFamily: 'sans-serif' }}>❌ Error: {error}</div>

  return (
    <div style={{ padding: '30px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Módulo de Compras</h2>
      <p style={{ color: '#666' }}>Consulta y registro en tiempo real con Azure SQL y Blob Storage</p>

      {/* Formulario de Captura / Edición */}
      <form onSubmit={manejarEnvio} style={estilos.formulario}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>
          {idEditando ? `✏️ Modificar Registro #${idEditando}` : '➕ Registrar Nueva Compra'}
        </h3>
        <div style={estilos.grupoInputs}>
          
          {/* Campo Proveedor con Datalist */}
          <input 
            type="text" 
            list="lista-proveedores"
            placeholder="Proveedor" 
            value={proveedor} 
            onChange={(e) => setProveedor(e.target.value)}
            required
            style={estilos.input}
          />
          <datalist id="lista-proveedores">
            {proveedoresUnicos.map((p, idx) => (
              <option key={idx} value={p} />
            ))}
          </datalist>

          <input 
            type="number" 
            step="0.01" 
            placeholder="Costo ($)" 
            value={costo} 
            onChange={(e) => setCosto(e.target.value)}
            required
            style={estilos.input}
          />

          {/* Campo Categoría con Datalist */}
          <input 
            type="text" 
            list="lista-categorias"
            placeholder="Categoría" 
            value={categoria} 
            onChange={(e) => setCategoria(e.target.value)}
            required
            style={estilos.input}
          />
          <datalist id="lista-categorias">
            {categoriasUnicas.map((c, idx) => (
              <option key={idx} value={c} />
            ))}
          </datalist>

          {/* Campo Producto con Datalist */}
          <input 
            type="text" 
            list="lista-productos"
            placeholder="Producto" 
            value={producto} 
            onChange={(e) => setProducto(e.target.value)}
            required
            style={estilos.input}
          />
          <datalist id="lista-productos">
            {productosUnicos.map((prod, idx) => (
              <option key={idx} value={prod} />
            ))}
          </datalist>
          
          <div style={{ flex: '1', minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#ccc' }}>
              {idEditando ? 'Reemplazar archivo (Opcional):' : 'Adjuntar Archivo / Factura:'}
            </label>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*,application/pdf"
              onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
              style={{ ...estilos.input, width: '100%' }}
            />
          </div>

          <input 
            type="date" 
            value={fechaCompra} 
            onChange={(e) => setFechaCompra(e.target.value)}
            title="Fecha de la Compra (Opcional)"
            style={estilos.input}
          />

          <button type="submit" disabled={guardando} style={idEditando ? estilos.botonEditar : estilos.botonGuardar}>
            {guardando ? 'Subiendo datos...' : idEditando ? '💾 Actualizar' : '💾 Guardar Registro'}
          </button>

          {idEditando && (
            <button type="button" onClick={cancelarEdicion} style={estilos.botonCancelar}>
              ❌ Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Tabla de Registros */}
      {compras.length === 0 ? (
        <p>No se encontraron registros en la tabla Compras.</p>
      ) : (
        <table style={estilos.tabla}>
          <thead>
            <tr style={estilos.encabezadoTabla}>
              {Object.keys(compras[0])
                .filter((columna) => !esColumnaOculta(columna))
                .map((columna) => {
                  const colLower = columna.toLowerCase()
                  const tituloColumna = (colLower === 'url_saas' || colLower === 'urlsaas') ? 'Documento' : columna;
                  
                  return <th key={columna} style={estilos.th}>{tituloColumna}</th>
                })}
              <th style={estilos.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {compras.map((fila, index) => {
              const idFila = fila.Numero ?? fila.ID ?? fila.Id ?? index
              const estaEditandoEstaFila = idEditando === idFila

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
                    <button 
                      onClick={() => iniciarEdicion(fila)} 
                      style={estaEditandoEstaFila ? estilos.botonAccionEditando : estilos.botonAccionEditar}
                    >
                      {estaEditandoEstaFila ? '✏️ Editando...' : '✏️ Editar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

const estilos = {
  formulario: { backgroundColor: '#1e1e1e', color: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '30px' },
  grupoInputs: { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' },
  input: { flex: '1', minWidth: '150px', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2d2d2d', color: '#fff', fontSize: '14px', boxSizing: 'border-box' },
  botonGuardar: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', height: '40px' },
  botonEditar: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', height: '40px' },
  botonCancelar: { backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', height: '40px' },
  botonAccionEditar: { backgroundColor: '#ffc107', color: '#212529', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '13px', textDecoration: 'none' },
  botonAccionEditando: { backgroundColor: '#fd7e14', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', textDecoration: 'none' },
  botonAccionVer: { backgroundColor: '#17a2b8', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '13px', textDecoration: 'none', display: 'inline-block' },
  tabla: { width: '100%', borderCollapse: 'collapse', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  encabezadoTabla: { backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left' },
  th: { padding: '12px', color: '#495057' },
  imagenMiniatura: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer' }
}