import { useState, useEffect } from 'react'

export default function App() {
  const [compras, setCompras] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Estados del formulario
  const [proveedor, setProveedor] = useState('')
  const [costo, setCosto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [producto, setProducto] = useState('')
  const [urlSaaS, setUrlSaaS] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Obtener lista de compras
  const obtenerCompras = () => {
    fetch('http://localhost:3000/api/datos')
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

  // Enviar nuevo registro a Azure SQL (POST)
  const manejarEnvio = async (e) => {
    e.preventDefault()
    setGuardando(true)

    try {
      const respuesta = await fetch('http://localhost:3000/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedor,
          costo: parseFloat(costo) || 0,
          categoria,
          producto,
          urlSaaS
        })
      })

      if (!respuesta.ok) throw new Error('Error al guardar el registro')

      // Limpiar formulario y recargar tabla
      setProveedor('')
      setCosto('')
      setCategoria('')
      setProducto('')
      setUrlSaaS('')
      setGuardando(false)

      obtenerCompras()
    } catch (err) {
      alert('Error: ' + err.message)
      setGuardando(false)
    }
  }

  // Función para renderizar el contenido de cada celda de forma inteligente
  const renderizarCelda = (columna, valor) => {
    if (valor === null || valor === undefined || valor === '') return '-'

    // Si es la columna de la URL de Azure Blob Storage
    if (columna === 'URL_SaaS') {
      const urlTexto = String(valor).toLowerCase()
      const esImagen = urlTexto.match(/\.(jpeg|jpg|gif|png|webp|svg)$/) !== null

      if (esImagen) {
        return (
          <a href={valor} target="_blank" rel="noopener noreferrer" title="Clic para ver en tamaño completo">
            <img 
              src={valor} 
              alt="Vista previa" 
              style={estilos.imagenMiniatura} 
            />
          </a>
        )
      } else {
        return (
          <a href={valor} target="_blank" rel="noopener noreferrer" style={estilos.enlaceBoton}>
            📎 Ver Archivo
          </a>
        )
      }
    }

    // Si es la columna de Costo, le damos formato de moneda
    if (columna === 'Costo') {
      const numero = Number(valor)
      return isNaN(numero) ? valor : `$${numero.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    // Si es la columna de Fecha, la formateamos
    if (columna === 'Fecha') {
      const fechaObj = new Date(valor)
      return isNaN(fechaObj.getTime()) ? valor : fechaObj.toLocaleDateString('es-MX')
    }

    return String(valor)
  }

  if (cargando) return <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>⌛ Conectando a Azure SQL...</div>
  if (error) return <div style={{ padding: '40px', color: 'red', fontFamily: 'sans-serif' }}>❌ Error: {error}</div>

  return (
    <div style={{ padding: '30px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Módulo de Compras</h2>
      <p style={{ color: '#666' }}>Consulta y registro en tiempo real sobre Azure SQL Database</p>

      {/* Formulario de Captura */}
      <form onSubmit={manejarEnvio} style={estilos.formulario}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>➕ Registrar Nueva Compra</h3>
        <div style={estilos.grupoInputs}>
          <input 
            type="text" 
            placeholder="Proveedor" 
            value={proveedor} 
            onChange={(e) => setProveedor(e.target.value)}
            required
            style={estilos.input}
          />
          <input 
            type="number" 
            step="0.01" 
            placeholder="Costo ($)" 
            value={costo} 
            onChange={(e) => setCosto(e.target.value)}
            required
            style={estilos.input}
          />
          <input 
            type="text" 
            placeholder="Categoría" 
            value={categoria} 
            onChange={(e) => setCategoria(e.target.value)}
            required
            style={estilos.input}
          />
          <input 
            type="text" 
            placeholder="Producto" 
            value={producto} 
            onChange={(e) => setProducto(e.target.value)}
            required
            style={estilos.input}
          />
          <input 
            type="text" 
            placeholder="URL de Imagen / Archivo Blob" 
            value={urlSaaS} 
            onChange={(e) => setUrlSaaS(e.target.value)}
            style={estilos.input}
          />
          <button type="submit" disabled={guardando} style={estilos.botonGuardar}>
            {guardando ? 'Guardando...' : '💾 Guardar Registro'}
          </button>
        </div>
      </form>

      {/* Tabla de Registros */}
      {compras.length === 0 ? (
        <p>No se encontraron registros en la tabla Compras.</p>
      ) : (
        <table style={estilos.tabla}>
          <thead>
            <tr style={estilos.encabezadoTabla}>
              {Object.keys(compras[0]).map((columna) => (
                <th key={columna} style={estilos.th}>{columna}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compras.map((fila, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                {Object.entries(fila).map(([columna, valor], idx) => (
                  <td style={{ padding: '12px', verticalAlign: 'middle' }} key={idx}>
                    {renderizarCelda(columna, valor)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const estilos = {
  formulario: { backgroundColor: '#1e1e1e', color: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '30px' },
  grupoInputs: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  input: { flex: '1', minWidth: '160px', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#2d2d2d', color: '#fff', fontSize: '14px' },
  botonGuardar: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  tabla: { width: '100%', borderCollapse: 'collapse', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  encabezadoTabla: { backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left' },
  th: { padding: '12px', color: '#495057' },
  imagenMiniatura: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer', transition: 'transform 0.2s' },
  enlaceBoton: { color: '#007bff', textDecoration: 'none', fontWeight: '500', fontSize: '14px' }
}