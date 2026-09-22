import { useState, useEffect } from 'react'
import FormularioCompra from './components/FormularioCompra'
import VistaConsulta from './components/VistaConsulta'
import GestionClientes from './components/GestionClientes'
import GestionUbicaciones from './components/GestionUbicaciones'
import GestionProyectos from './components/GestionProyectos'
import GestionIngenieria from './components/GestionIngenieria'
import GestionAlmacen3D from './components/GestionAlmacen3D'
import GestionAlmacenInventario from './components/GestionAlmacenInventario'
import GestionChatbot from './components/GestionChatbot'
import ModalConfiguracion from './components/ModalConfiguracion'

//const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_URL = import.meta.env.VITE_API_URL || 'https://pruebajs-ezbja7gjf9cmg4fn.centralus-01.azurewebsites.net';
export default function App() {
  const [moduloPrincipal, setModuloPrincipal] = useState('compras')
  const [menuAbierto, setMenuAbierto] = useState(false)
  
  const [hoverModulo, setHoverModulo] = useState(null)
  const [hoverSubmenuItem, setHoverSubmenuItem] = useState(null)
  const [hoverHamburguesa, setHoverHamburguesa] = useState(false)
  const [hoverConfig, setHoverConfig] = useState(false)

  const [mostrarModalConfig, setMostrarModalConfig] = useState(false)

  const [pestanaCompras, setPestanaCompras] = useState('consulta')
  const [pestanaIngenieria, setPestanaIngenieria] = useState('explorador')
  const [pestanaAlmacen, setPestanaAlmacen] = useState('inventario')

  const [compras, setCompras] = useState([])
  const [clientes, setClientes] = useState([])
  const [ubicaciones, setUbicaciones] = useState([])
  const [contactos, setContactos] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [disenos, setDisenos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [idEditando, setIdEditando] = useState(null)
  const [proveedor, setProveedor] = useState('')
  const [costo, setCosto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [producto, setProducto] = useState('')
  const [proyecto, setProyecto] = useState('')
  const [proyectoIdExterno, setProyectoIdExterno] = useState('')
  const [precioUnitario, setPrecioUnitario] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [estatus, setEstatus] = useState('Cotizado')
  const [urlSaaS, setUrlSaaS] = useState('')
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const [fechaCompra, setFechaCompra] = useState('')
  
  const [material, setMaterial] = useState('')
  const [notas, setNotas] = useState('')

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

  // --- FILTRADO DE COMPRAS Y PROYECTOS ACTIVOS ---
  const comprasActivas = compras.filter(c => (c.Estatus || c.estatus || 'Comprado').toLowerCase() !== 'cancelado')
  const proveedoresUnicos = [...new Set(comprasActivas.map(c => c.Proveedor || c.proveedor).filter(Boolean))]
  const categoriasUnicas = [...new Set(comprasActivas.map(c => c.Categoria || c.categoria).filter(Boolean))]
  const productosUnicos = [...new Set(comprasActivas.map(c => c.Producto || c.producto).filter(Boolean))]
  const materialesUnicos = [...new Set(comprasActivas.map(c => c.Material || c.material).filter(Boolean))]
  
  // Listas de la tabla de Proyectos
  const proyectosUnicos = [...new Set(proyectos.map(p => p.NombreProyecto).filter(Boolean))]
  const proyectoIdsUnicos = [...new Set(proyectos.map(p => p.ProyectoID_Externo).filter(Boolean))]

  const iniciarEdicion = (fila) => {
    const id = fila.Numero ?? fila.ID ?? fila.Id ?? fila.id
    setIdEditando(id)
    setProveedor(fila.Proveedor || fila.proveedor || '')
    setCosto(fila.Costo || fila.costo || '')
    setCategoria(fila.Categoria || fila.categoria || '')
    setProducto(fila.Producto || fila.producto || '')
    setProyecto(fila.Proyecto || fila.proyecto || '')
    setProyectoIdExterno(fila.ProyectoID_Externo || fila.proyectoID_Externo || '')
    setPrecioUnitario(fila.PrecioUnitario || fila.precioUnitario || '')
    setCantidad(fila.Cantidad || fila.cantidad || '')
    setEstatus(fila.Estatus || fila.estatus || 'Comprado')
    setUrlSaaS(fila.URL_SaaS || fila.urlSaaS || fila.url_saas || '')
    
    setMaterial(fila.Material || fila.material || '')
    setNotas(fila.Notas || fila.notas || '')

    setArchivoSeleccionado(null)

    const valorFecha = fila.FechaCompra || fila.fechaCompra || fila.Fecha || fila.fecha
    setFechaCompra(valorFecha ? String(valorFecha).split('T')[0] : '')
    
    setModuloPrincipal('compras')
    setPestanaCompras('captura')
  }

  const cancelarEdicion = () => {
    setIdEditando(null)
    setProveedor(''); setCosto(''); setCategoria(''); setProducto('')
    setProyecto(''); setProyectoIdExterno(''); setPrecioUnitario(''); setCantidad(''); setEstatus('Cotizado')
    setUrlSaaS(''); setArchivoSeleccionado(null); setFechaCompra('')
    setMaterial(''); setNotas('')
  }

  const manejarCancelarRegistro = async () => {
    if (!idEditando) return
    if (!window.confirm(`¿Estás seguro de cancelar el registro #${idEditando}?`)) return

    try {
      const respuesta = await fetch(`${API_URL}/api/compras/cancelar/${idEditando}`, {
        method: 'PUT'
      })
      if (!respuesta.ok) throw new Error('Error al cancelar el registro')

      cancelarEdicion()
      cargarTodo()
      setPestanaCompras('consulta')
    } catch (err) {
      alert('Error: ' + err.message)
    }
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
    formData.append('proyectoIdExterno', proyectoIdExterno)
    formData.append('precioUnitario', parseFloat(precioUnitario) || 0)
    formData.append('cantidad', parseInt(cantidad, 10) || 0)
    formData.append('estatus', estatus)
    formData.append('urlSaaS', urlSaaS)
    
    formData.append('material', material)
    formData.append('notas', notas)

    if (fechaCompra) formData.append('fechaCompra', fechaCompra)
    if (archivoSeleccionado) formData.append('archivo', archivoSeleccionado)

    try {
      const respuesta = await fetch(urlEndpoint, { method: metodo, body: formData })
      if (!respuesta.ok) throw new Error(`Error al ${esEdicion ? 'actualizar' : 'guardar'} la compra`)

      cancelarEdicion()
      setGuardando(false)
      cargarTodo()
      setPestanaCompras('consulta')
    } catch (err) {
      alert('Error: ' + err.message)
      setGuardando(false)
    }
  }

  if (cargando) return <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>⌛ Conectando a Azure SQL...</div>
  if (error) return <div style={{ padding: '40px', color: 'red', fontFamily: 'sans-serif' }}>❌ Error: {error}</div>

  return (
    <div style={estilos.layout}>
      {/* BARRA LATERAL */}
      <div style={estilos.sidebar(menuAbierto)}>
        <div>
          <button 
            onClick={() => setMenuAbierto(!menuAbierto)} 
            onMouseEnter={() => setHoverHamburguesa(true)}
            onMouseLeave={() => setHoverHamburguesa(false)}
            style={estilos.btnHamburguesa(hoverHamburguesa)} 
            title="Expandir/Contraer Menú"
          >
            ☰
          </button>
          
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            
            {/* COMPRAS */}
            <div 
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoverModulo('compras')}
              onMouseLeave={() => { setHoverModulo(null); setHoverSubmenuItem(null); }}
            >
              <div 
                onClick={() => { setModuloPrincipal('compras'); setPestanaCompras('consulta'); cancelarEdicion(); }} 
                style={estilos.itemMenu(hoverModulo === 'compras')}
                title="Módulo de Compras"
              >
                <span style={estilos.iconoMenu}>🛒</span>
                {menuAbierto && <span>Compras</span>}
              </div>

              {hoverModulo === 'compras' && (
                <div style={estilos.submenuFlotante}>
                  <div style={estilos.submenuTitulo}>Módulo de Compras</div>
                  <div onMouseEnter={() => setHoverSubmenuItem('c-1')} onMouseLeave={() => setHoverSubmenuItem(null)} onClick={() => { setModuloPrincipal('compras'); setPestanaCompras('consulta'); setHoverModulo(null); }} style={estilos.itemSubmenu(hoverSubmenuItem === 'c-1')}>🔍 Consulta Compras</div>
                  <div onMouseEnter={() => setHoverSubmenuItem('c-2')} onMouseLeave={() => setHoverSubmenuItem(null)} onClick={() => { setModuloPrincipal('compras'); setPestanaCompras('captura'); if (!idEditando) cancelarEdicion(); setHoverModulo(null); }} style={estilos.itemSubmenu(hoverSubmenuItem === 'c-2')}>{idEditando ? `✏️ Editando #${idEditando}` : '➕ Captura Compra / Cotización'}</div>
                  <div onMouseEnter={() => setHoverSubmenuItem('c-3')} onMouseLeave={() => setHoverSubmenuItem(null)} onClick={() => { setModuloPrincipal('compras'); setPestanaCompras('clientes'); setHoverModulo(null); }} style={estilos.itemSubmenu(hoverSubmenuItem === 'c-3')}>🏢 Clientes & Contactos</div>
                  
                  <div onMouseEnter={() => setHoverSubmenuItem('c-5')} onMouseLeave={() => setHoverSubmenuItem(null)} onClick={() => { setModuloPrincipal('compras'); setPestanaCompras('proyectos'); setHoverModulo(null); }} style={estilos.itemSubmenu(hoverSubmenuItem === 'c-5')}>📁 Proyectos</div>
                </div>
              )}
            </div>
            
            {/* INGENIERÍA */}
            <div 
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoverModulo('ingenieria')}
              onMouseLeave={() => { setHoverModulo(null); setHoverSubmenuItem(null); }}
            >
              <div 
                onClick={() => { setModuloPrincipal('ingenieria'); setPestanaIngenieria('explorador'); }} 
                style={estilos.itemMenu(hoverModulo === 'ingenieria')}
                title="Módulo de Ingeniería"
              >
                <span style={estilos.iconoMenu}>🛠️</span>
                {menuAbierto && <span>Ingeniería</span>}
              </div>

              {hoverModulo === 'ingenieria' && (
                <div style={estilos.submenuFlotante}>
                  <div style={estilos.submenuTitulo}>Módulo de Ingeniería</div>
                  <div onMouseEnter={() => setHoverSubmenuItem('i-1')} onMouseLeave={() => setHoverSubmenuItem(null)} onClick={() => { setModuloPrincipal('ingenieria'); setPestanaIngenieria('explorador'); setHoverModulo(null); }} style={estilos.itemSubmenu(hoverSubmenuItem === 'i-1')}>🔍 Explorador BOM & Visor 3D</div>
                  <div onMouseEnter={() => setHoverSubmenuItem('i-2')} onMouseLeave={() => setHoverSubmenuItem(null)} onClick={() => { setModuloPrincipal('ingenieria'); setPestanaIngenieria('avance'); setHoverModulo(null); }} style={estilos.itemSubmenu(hoverSubmenuItem === 'i-2')}>📊 Control de Avance de Fabricación</div>
                  <div onMouseEnter={() => setHoverSubmenuItem('i-3')} onMouseLeave={() => setHoverSubmenuItem(null)} onClick={() => { setModuloPrincipal('ingenieria'); setPestanaIngenieria('nuevo'); setHoverModulo(null); }} style={estilos.itemSubmenu(hoverSubmenuItem === 'i-3')}>➕ Registrar Nueva Pieza / Sub-ensamble</div>
                </div>
              )}
            </div>

            {/* ALMACÉN */}
            <div 
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoverModulo('almacen')}
              onMouseLeave={() => { setHoverModulo(null); setHoverSubmenuItem(null); }}
            >
              <div 
                onClick={() => { setModuloPrincipal('almacen'); setPestanaAlmacen('inventario'); }} 
                style={estilos.itemMenu(hoverModulo === 'almacen')}
                title="Módulo de Almacén"
              >
                <span style={estilos.iconoMenu}>📦</span>
                {menuAbierto && <span>Almacén</span>}
              </div>

              {hoverModulo === 'almacen' && (
                <div style={estilos.submenuFlotante}>
                  <div style={estilos.submenuTitulo}>Control de Almacén</div>
                  <div onMouseEnter={() => setHoverSubmenuItem('a-1')} onMouseLeave={() => setHoverSubmenuItem(null)} onClick={() => { setModuloPrincipal('almacen'); setPestanaAlmacen('inventario'); setHoverModulo(null); }} style={estilos.itemSubmenu(hoverSubmenuItem === 'a-1')}>📊 Inventario General (3D)</div>
                  <div onMouseEnter={() => setHoverSubmenuItem('a-2')} onMouseLeave={() => setHoverSubmenuItem(null)} onClick={() => { setModuloPrincipal('almacen'); setPestanaAlmacen('entradas'); setHoverModulo(null); }} style={estilos.itemSubmenu(hoverSubmenuItem === 'a-2')}>📥 Entradas y Recepción</div>
                </div>
              )}
            </div>

            {/* CHATBOT */}
            <div 
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoverModulo('chatbot')}
              onMouseLeave={() => setHoverModulo(null)}
            >
              <div 
                onClick={() => { setModuloPrincipal('chatbot'); }} 
                style={estilos.itemMenu(hoverModulo === 'chatbot' || moduloPrincipal === 'chatbot')}
                title="Asistente Virtual (Chatbot)"
              >
                <span style={estilos.iconoMenu}>🤖</span>
                {menuAbierto && <span>Chatbot IA</span>}
              </div>
            </div>

          </div>
        </div>

        {/* CONFIGURACIÓN */}
        <div style={{ marginTop: 'auto', paddingBottom: '15px' }}>
          <div 
            onClick={() => setMostrarModalConfig(true)}
            onMouseEnter={() => setHoverConfig(true)}
            onMouseLeave={() => setHoverConfig(false)}
            style={estilos.itemMenu(hoverConfig)}
            title="Configuración del Sistema"
          >
            <span style={estilos.iconoMenu}>⚙️</span>
            {menuAbierto && <span>Configuración</span>}
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div style={estilos.contenidoPrincipal(menuAbierto)}>
        
        {moduloPrincipal === 'compras' && (
          <>
            {pestanaCompras === 'consulta' && (
              <VistaConsulta 
                compras={compras} 
                iniciarEdicion={iniciarEdicion} 
                proveedoresUnicos={proveedoresUnicos} 
                categoriasUnicas={categoriasUnicas} 
                proyectosUnicos={proyectosUnicos} 
              />
            )}
            {pestanaCompras === 'captura' && (
              <FormularioCompra 
                idEditando={idEditando} 
                proveedor={proveedor} setProveedor={setProveedor}
                costo={costo} setCosto={setCosto} 
                categoria={categoria} setCategoria={setCategoria}
                producto={producto} setProducto={setProducto} 
                proyecto={proyecto} setProyecto={setProyecto}
                proyectoIdExterno={proyectoIdExterno} setProyectoIdExterno={setProyectoIdExterno}
                precioUnitario={precioUnitario} setPrecioUnitario={setPrecioUnitario} 
                cantidad={cantidad} setCantidad={setCantidad}
                fechaCompra={fechaCompra} setFechaCompra={setFechaCompra} 
                estatus={estatus} setEstatus={setEstatus}
                material={material} setMaterial={setMaterial}
                notas={notas} setNotas={setNotas}
                setArchivoSeleccionado={setArchivoSeleccionado} 
                guardando={guardando} 
                manejarEnvio={manejarEnvio}
                cancelarEdicion={() => { cancelarEdicion(); setPestanaCompras('consulta'); }}
                manejarCancelarRegistro={manejarCancelarRegistro}
                proveedoresUnicos={proveedoresUnicos} 
                categoriasUnicas={categoriasUnicas} 
                productosUnicos={productosUnicos} 
                materialesUnicos={materialesUnicos} 
                proyectosUnicos={proyectosUnicos}
                proyectoIdsUnicos={proyectoIdsUnicos}
              />
            )}
            {pestanaCompras === 'clientes' && <GestionClientes clientes={clientes} ubicaciones={ubicaciones} contactos={contactos} API_URL={API_URL} recargarDatos={cargarTodo} />}
            {pestanaCompras === 'ubicaciones' && <GestionUbicaciones ubicaciones={ubicaciones} clientes={clientes} API_URL={API_URL} recargarDatos={cargarTodo} />}
            {pestanaCompras === 'proyectos' && <GestionProyectos proyectos={proyectos} clientes={clientes} ubicaciones={ubicaciones} API_URL={API_URL} recargarDatos={cargarTodo} />}
          </>
        )}

        {moduloPrincipal === 'ingenieria' && (
          <GestionIngenieria 
            disenos={disenos} 
            proyectosUnicos={proyectosUnicos} 
            API_URL={API_URL} 
            recargarDatos={cargarTodo}
            subVista={pestanaIngenieria}
            setPestanaIngenieria={setPestanaIngenieria}
          />
        )}

        {moduloPrincipal === 'almacen' && (
          <>
            {pestanaAlmacen === 'inventario' && <GestionAlmacen3D API_URL={API_URL} />}
            {pestanaAlmacen === 'entradas' && <GestionAlmacenInventario compras={compras} API_URL={API_URL} recargarDatos={cargarTodo} />}
          </>
        )}

        {moduloPrincipal === 'chatbot' && (
          <GestionChatbot />
        )}
      </div>

      <ModalConfiguracion 
        abierto={mostrarModalConfig} 
        alCerrar={() => setMostrarModalConfig(false)} 
        API_URL={API_URL} 
      />

    </div>
  )
}

const estilos = {
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' },
  sidebar: (abierto) => ({
    width: abierto ? '250px' : '65px',
    backgroundColor: '#1a252f',
    color: 'white',
    transition: 'width 0.3s ease',
    overflow: 'visible',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
    position: 'fixed',
    height: '100vh',
    zIndex: 1000,
    top: 0,
    left: 0
  }),
  btnHamburguesa: (enHover) => ({
    background: enHover ? 'rgba(255, 255, 255, 0.1)' : 'none',
    border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', padding: '15px 20px', textAlign: 'left', display: 'flex', alignItems: 'center'
  }),
  itemMenu: (enHover) => ({
    padding: '15px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: enHover ? '#007bff' : 'transparent', borderLeft: enHover ? '4px solid #66b0ff' : '4px solid transparent', transition: 'all 0.2s', whiteSpace: 'nowrap', fontWeight: enHover ? 'bold' : 'normal', fontSize: '16px'
  }),
  iconoMenu: { fontSize: '20px', minWidth: '25px', textAlign: 'center' },
  submenuFlotante: {
    position: 'absolute', left: '100%', top: 0, backgroundColor: '#243342', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', borderRadius: '0 8px 8px 0', padding: '6px 0', minWidth: '290px', zIndex: 2000, border: '1px solid rgba(255, 255, 255, 0.1)', borderLeft: 'none'
  },
  submenuTitulo: { padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#8da2b5', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '4px' },
  itemSubmenu: (enHover) => ({
    padding: '10px 16px', fontSize: '13px', cursor: 'pointer', color: enHover ? '#ffffff' : '#cfd8dc', backgroundColor: enHover ? '#007bff' : 'transparent', fontWeight: enHover ? 'bold' : 'normal', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap'
  }),
  contenidoPrincipal: (menuAbierto) => ({
    marginLeft: menuAbierto ? '250px' : '65px', padding: '15px 20px', width: menuAbierto ? 'calc(100% - 250px)' : 'calc(100% - 65px)', transition: 'margin-left 0.3s ease, width 0.3s ease', fontFamily: 'Segoe UI, sans-serif', boxSizing: 'border-box'
  })
}