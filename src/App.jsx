import { useState, useEffect } from 'react'
import FormularioCompra from './components/FormularioCompra'
import VistaConsulta from './components/VistaConsulta'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function App() {
  const [pestanaActiva, setPestanaActiva] = useState('consulta')
  const [compras, setCompras] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Estados compartidos para el Formulario
  const [idEditando, setIdEditando] = useState(null)
  const [proveedor, setProveedor] = useState('')
  const [costo, setCosto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [producto, setProducto] = useState('')
  const [proyecto, setProyecto] = useState('')
  const [precioUnitario, setPrecioUnitario] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [urlSaaS, setUrlSaaS] = useState('')
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const [fechaCompra, setFechaCompra] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Listas únicas
  const proveedoresUnicos = [...new Set(compras.map(c => c.Proveedor || c.proveedor).filter(Boolean))]
  const categoriasUnicas = [...new Set(compras.map(c => c.Categoria || c.categoria).filter(Boolean))]
  const productosUnicos = [...new Set(compras.map(c => c.Producto || c.producto).filter(Boolean))]
  const proyectosUnicos = [...new Set(compras.map(c => c.Proyecto || c.proyecto).filter(Boolean))]

  const obtenerCompras = () => {
    fetch(`${API_URL}/api/datos?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al consultar la API')
        return res.json()
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
    setProyecto(fila.Proyecto || fila.proyecto || '')
    setPrecioUnitario(fila.PrecioUnitario || fila.precioUnitario || '')
    setCantidad(fila.Cantidad || fila.cantidad || '')
    setUrlSaaS(fila.URL_SaaS || fila.urlSaaS || fila.url_saas || '')
    setArchivoSeleccionado(null)

    const valorFecha = fila.FechaCompra || fila.fechaCompra || fila.Fecha || fila.fecha
    setFechaCompra(valorFecha ? String(valorFecha).split('T')[0] : '')
    setPestanaActiva('captura')
  }

  const cancelarEdicion = () => {
    setIdEditando(null)
    setProveedor('')
    setCosto('')
    setCategoria('')
    setProducto('')
    setProyecto('')
    setPrecioUnitario('')
    setCantidad('')
    setUrlSaaS('')
    setArchivoSeleccionado(null)
    setFechaCompra('')
  }

  const manejarEnvio = async (e) => {
    e.preventDefault()
    setGuardando(true)

    const esEdicion = idEditando !== null
    const urlEndpoint = esEdicion ? `${API_URL}/api/compras/${idEditando}` : `${API_URL}/api/compras`
    const metodo = esEdicion ? 'PUT' : 'POST'

    const formData = new FormData()
    formData.append('proveedor', proveedor)
    formData.append('costo', parseFloat(costo) || 0)
    formData.append('categoria', categoria)
    formData.append('producto', producto)
    formData.append('proyecto', proyecto)
    formData.append('precioUnitario', parseFloat(precioUnitario) || 0)
    formData.append('cantidad', parseInt(cantidad, 10) || 0)
    formData.append('urlSaaS', urlSaaS)
    if (fechaCompra) formData.append('fechaCompra', fechaCompra)
    if (archivoSeleccionado) formData.append('archivo', archivoSeleccionado)

    try {
      const respuesta = await fetch(urlEndpoint, { method: metodo, body: formData })
      if (!respuesta.ok) throw new Error(`Error al ${esEdicion ? 'actualizar' : 'guardar'} el registro`)

      cancelarEdicion()
      setGuardando(false)
      obtenerCompras()
      setPestanaActiva('consulta')
    } catch (err) {
      alert('Error: ' + err.message)
      setGuardando(false)
    }
  }

  if (cargando) return <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>⌛ Conectando a Azure SQL...</div>
  if (error) return <div style={{ padding: '40px', color: 'red', fontFamily: 'sans-serif' }}>❌ Error: {error}</div>

  return (
    <div style={{ padding: '30px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      <h2>Módulo de Compras</h2>
      <p style={{ color: '#666' }}>Sistema de gestión de compras integrando Azure SQL y Blob Storage</p>

      {/* Navegación por pestañas */}
      <div style={estilos.contenedorPestanas}>
        <button 
          onClick={() => setPestanaActiva('consulta')}
          style={pestanaActiva === 'consulta' ? estilos.pestanaActiva : estilos.pestanaInactiva}
        >
          🔍 Vista de Consulta y Filtros
        </button>
        <button 
          onClick={() => { setPestanaActiva('captura'); if (!idEditando) cancelarEdicion(); }}
          style={pestanaActiva === 'captura' ? estilos.pestanaActiva : estilos.pestanaInactiva}
        >
          {idEditando ? `✏️ Editando #${idEditando}` : '➕ Registro / Captura'}
        </button>
      </div>

      {/* Renderizado Condicional de Componentes */}
      {pestanaActiva === 'consulta' ? (
        <VistaConsulta 
          compras={compras}
          iniciarEdicion={iniciarEdicion}
          proveedoresUnicos={proveedoresUnicos}
          categoriasUnicas={categoriasUnicas}
          proyectosUnicos={proyectosUnicos}
        />
      ) : (
        <FormularioCompra 
          idEditando={idEditando}
          proveedor={proveedor} setProveedor={setProveedor}
          costo={costo} setCosto={setCosto}
          categoria={categoria} setCategoria={setCategoria}
          producto={producto} setProducto={setProducto}
          proyecto={proyecto} setProyecto={setProyecto}
          precioUnitario={precioUnitario} setPrecioUnitario={setPrecioUnitario}
          cantidad={cantidad} setCantidad={setCantidad}
          urlSaaS={urlSaaS}
          fechaCompra={fechaCompra} setFechaCompra={setFechaCompra}
          setArchivoSeleccionado={setArchivoSeleccionado}
          guardando={guardando}
          manejarEnvio={manejarEnvio}
          cancelarEdicion={() => { cancelarEdicion(); setPestanaActiva('consulta'); }}
          proveedoresUnicos={proveedoresUnicos}
          categoriasUnicas={categoriasUnicas}
          productosUnicos={productosUnicos}
          proyectosUnicos={proyectosUnicos}
        />
      )}
    </div>
  )
}

const estilos = {
  contenedorPestanas: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px' },
  pestanaActiva: { backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  pestanaInactiva: { backgroundColor: '#e9ecef', color: '#495057', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }
}