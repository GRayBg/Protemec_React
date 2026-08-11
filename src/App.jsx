import { useState, useEffect } from 'react'
import FormularioCompra from './components/FormularioCompra'
import VistaConsulta from './components/VistaConsulta'
import GestionClientes from './components/GestionClientes'
import GestionUbicaciones from './components/GestionUbicaciones'
import GestionProyectos from './components/GestionProyectos'
import GestionIngenieria from './components/GestionIngenieria'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function App() {
  const [pestanaActiva, setPestanaActiva] = useState('consulta')
  const [compras, setCompras] = useState([])
  const [clientes, setClientes] = useState([])
  const [ubicaciones, setUbicaciones] = useState([])
  const [contactos, setContactos] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [disenos, setDisenos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Estados del Formulario de Compras
  const [idEditando, setIdEditando] = useState(null)
  const [proveedor, setProveedor] = useState('')
  const [costo, setCosto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [producto, setProducto] = useState('')
  const [proyecto, setProyecto] = useState('')
  const [precioUnitario, setPrecioUnitario] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [estatus, setEstatus] = useState('Comprado')
  const [urlSaaS, setUrlSaaS] = useState('')
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const [fechaCompra, setFechaCompra] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargarTodo = async () => {
    try {
      const [resCompras, resClientes, resUbicaciones, resContactos, resProyectos, resIngenieria] = await Promise.all([
        fetch(`${API_URL}/api/datos?t=${Date.now()}`),
        fetch(`${API_URL}/api/clientes?t=${Date.now()}`),
        fetch(`${API_URL}/api/ubicaciones?t=${Date.now()}`),
        fetch(`${API_URL}/api/contactos?t=${Date.now()}`),
        fetch(`${API_URL}/api/proyectos?t=${Date.now()}`),
        fetch(`${API_URL}/api/ingenieria?t=${Date.now()}`)
      ])

      if (!resCompras.ok || !resClientes.ok || !resUbicaciones.ok || !resContactos.ok || !resProyectos.ok || !resIngenieria.ok) {
        throw new Error('Error al conectar con los servicios backend')
      }

      setCompras(await resCompras.json())
      setClientes(await resClientes.json())
      setUbicaciones(await resUbicaciones.json())
      setContactos(await resContactos.json())
      setProyectos(await resProyectos.json())
      setDisenos(await resIngenieria.json())
      setCargando(false)
    } catch (err) {
      setError(err.message)
      setCargando(false)
    }
  }

  useEffect(() => { cargarTodo() }, [])

  const proveedoresUnicos = [...new Set(compras.map(c => c.Proveedor || c.proveedor).filter(Boolean))]
  const categoriasUnicas = [...new Set(compras.map(c => c.Categoria || c.categoria).filter(Boolean))]
  const productosUnicos = [...new Set(compras.map(c => c.Producto || c.producto).filter(Boolean))]
  const proyectosUnicos = proyectos.map(p => p.NombreProyecto)

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
    setEstatus(fila.Estatus || fila.estatus || 'Comprado')
    setUrlSaaS(fila.URL_SaaS || fila.urlSaaS || fila.url_saas || '')
    setArchivoSeleccionado(null)

    const valorFecha = fila.FechaCompra || fila.fechaCompra || fila.Fecha || fila.fecha
    setFechaCompra(valorFecha ? String(valorFecha).split('T')[0] : '')
    setPestanaActiva('captura')
  }

  const cancelarEdicion = () => {
    setIdEditando(null)
    setProveedor(''); setCosto(''); setCategoria(''); setProducto('')
    setProyecto(''); setPrecioUnitario(''); setCantidad(''); setEstatus('Comprado')
    setUrlSaaS(''); setArchivoSeleccionado(null); setFechaCompra('')
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
    formData.append('estatus', estatus)
    formData.append('urlSaaS', urlSaaS)
    if (fechaCompra) formData.append('fechaCompra', fechaCompra)
    if (archivoSeleccionado) formData.append('archivo', archivoSeleccionado)

    try {
      const respuesta = await fetch(urlEndpoint, { method: metodo, body: formData })
      if (!respuesta.ok) throw new Error(`Error al ${esEdicion ? 'actualizar' : 'guardar'} la compra`)

      cancelarEdicion()
      setGuardando(false)
      cargarTodo()
      setPestanaActiva('consulta')
    } catch (err) {
      alert('Error: ' + err.message)
      setGuardando(false)
    }
  }

  if (cargando) return <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>⌛ Conectando a Azure SQL...</div>
  if (error) return <div style={{ padding: '40px', color: 'red', fontFamily: 'sans-serif' }}>❌ Error: {error}</div>

  // ----------------------------------------------------------------------
  // VISTA DE INGENIERÍA CON EL MISMO ANCHO QUE COMPRAS (maxWidth: 1400px)
  // ----------------------------------------------------------------------
  if (pestanaActiva === 'ingenieria') {
    return (
      <div style={{ padding: '30px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #007bff' }}>
          <div>
            <h2 style={{ margin: 0, color: '#1a252f' }}>🛠️ Módulo de Ingeniería y Diseño 3D</h2>
            <p style={{ margin: '4px 0 0 0', color: '#6c757d', fontSize: '13px' }}>
              Gestión de estructura BOM, archivos CAD (.GLB) y planos (.PDF)
            </p>
          </div>
          <button 
            onClick={() => setPestanaActiva('consulta')} 
            style={{ 
              backgroundColor: '#6c757d', 
              color: '#fff', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              fontWeight: 'bold', 
              cursor: 'pointer'
            }}
          >
            ⬅️ Volver al Sistema Principal
          </button>
        </div>

        <GestionIngenieria 
          disenos={disenos} 
          proyectosUnicos={proyectosUnicos} 
          API_URL={API_URL} 
          recargarDatos={cargarTodo} 
        />
      </div>
    )
  }

  // ----------------------------------------------------------------------
  // VISTA PRINCIPAL
  // ----------------------------------------------------------------------
  return (
    <div style={{ padding: '30px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>Sistema de Control de Compras, Proyectos y Clientes</h2>

      <div style={estilos.contenedorPestanas}>
        <button onClick={() => setPestanaActiva('consulta')} style={pestanaActiva === 'consulta' ? estilos.pestanaActiva : estilos.pestanaInactiva}>🔍 Consulta Compras</button>
        <button onClick={() => { setPestanaActiva('captura'); if (!idEditando) cancelarEdicion(); }} style={pestanaActiva === 'captura' ? estilos.pestanaActiva : estilos.pestanaInactiva}>{idEditando ? `✏️ Editando #${idEditando}` : '➕ Captura Compra/Cotización'}</button>
        <button onClick={() => setPestanaActiva('clientes')} style={pestanaActiva === 'clientes' ? estilos.pestanaActiva : estilos.pestanaInactiva}>🏢 Clientes & Contactos</button>
        <button onClick={() => setPestanaActiva('ubicaciones')} style={pestanaActiva === 'ubicaciones' ? estilos.pestanaActiva : estilos.pestanaInactiva}>📍 Ubicaciones</button>
        <button onClick={() => setPestanaActiva('proyectos')} style={pestanaActiva === 'proyectos' ? estilos.pestanaActiva : estilos.pestanaInactiva}>📁 Proyectos</button>
        <button onClick={() => setPestanaActiva('ingenieria')} style={estilos.pestanaDestacada}>🛠️ Ingeniería y Diseño</button>
      </div>

      {pestanaActiva === 'consulta' && (
        <VistaConsulta compras={compras} iniciarEdicion={iniciarEdicion} proveedoresUnicos={proveedoresUnicos} categoriasUnicas={categoriasUnicas} proyectosUnicos={proyectosUnicos} />
      )}

      {pestanaActiva === 'captura' && (
        <FormularioCompra 
          idEditando={idEditando} proveedor={proveedor} setProveedor={setProveedor}
          costo={costo} setCosto={setCosto} categoria={categoria} setCategoria={setCategoria}
          producto={producto} setProducto={setProducto} proyecto={proyecto} setProyecto={setProyecto}
          precioUnitario={precioUnitario} setPrecioUnitario={setPrecioUnitario} cantidad={cantidad} setCantidad={setCantidad}
          fechaCompra={fechaCompra} setFechaCompra={setFechaCompra} estatus={estatus} setEstatus={setEstatus}
          setArchivoSeleccionado={setArchivoSeleccionado} guardando={guardando} manejarEnvio={manejarEnvio}
          cancelarEdicion={() => { cancelarEdicion(); setPestanaActiva('consulta'); }}
          proveedoresUnicos={proveedoresUnicos} categoriasUnicas={categoriasUnicas} productosUnicos={productosUnicos} proyectosUnicos={proyectosUnicos}
        />
      )}

      {pestanaActiva === 'clientes' && (
        <GestionClientes clientes={clientes} ubicaciones={ubicaciones} contactos={contactos} API_URL={API_URL} recargarDatos={cargarTodo} />
      )}

      {pestanaActiva === 'ubicaciones' && (
        <GestionUbicaciones ubicaciones={ubicaciones} clientes={clientes} API_URL={API_URL} recargarDatos={cargarTodo} />
      )}

      {pestanaActiva === 'proyectos' && (
        <GestionProyectos proyectos={proyectos} clientes={clientes} ubicaciones={ubicaciones} API_URL={API_URL} recargarDatos={cargarTodo} />
      )}
    </div>
  )
}

const estilos = {
  contenedorPestanas: { display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px', flexWrap: 'wrap', justifyContent: 'center' },
  pestanaActiva: { backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  pestanaInactiva: { backgroundColor: '#e9ecef', color: '#495057', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' },
  pestanaDestacada: { backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }
}