import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import VistaConsulta from './components/VistaConsulta'
import FormularioCompra from './components/FormularioCompra'
import GestionClientes from './components/GestionClientes'
import GestionProyectos from './components/GestionProyectos'
import GestionIngenieria from './components/GestionIngenieria'
import GestionAlmacenInventario from './components/GestionAlmacenInventario'
import GestionAlmacen3D from './components/GestionAlmacen3D'
import GestionChatbot from './components/GestionChatbot'
import ModalConfiguracion from './components/ModalConfiguracion'

const API_URL = import.meta.env.VITE_API_URL

const PERFILES_INICIALES = [
  {
    id: 'ing',
    nombre: 'Ingeniería y Diseño CAD',
    email: 'ingenieria@protemec.com',
    rol: 'Ingeniería',
    esMaestro: false,
    permisos: {
      compras: { ver: true, editar: false },
      proyectos: { ver: true, editar: true },
      clientes: { ver: false, editar: false },
      ingenieria: { ver: true, editar: true },
      almacen: { ver: true, editar: false },
      chatbot: { ver: true, editar: true }
    }
  },
  {
    id: 'compras',
    nombre: 'Ejecutivo de Compras',
    email: 'compras@protemec.com',
    rol: 'Compras',
    esMaestro: false,
    permisos: {
      compras: { ver: true, editar: true },
      proyectos: { ver: true, editar: false },
      clientes: { ver: true, editar: true },
      ingenieria: { ver: false, editar: false },
      almacen: { ver: true, editar: false },
      chatbot: { ver: true, editar: true }
    }
  },
  {
    id: 'almacen',
    nombre: 'Control de Almacén',
    email: 'almacen@protemec.com',
    rol: 'Almacén',
    esMaestro: false,
    permisos: {
      compras: { ver: true, editar: false },
      proyectos: { ver: false, editar: false },
      clientes: { ver: false, editar: false },
      ingenieria: { ver: true, editar: false },
      almacen: { ver: true, editar: true },
      chatbot: { ver: false, editar: false }
    }
  }
]

const PERFIL_MAESTRO_TOTAL = {
  id: 'master',
  nombre: 'Dirección / Perfil Maestro',
  email: 'admin@protemec.com',
  rol: 'SuperAdmin',
  esMaestro: true,
  permisos: {
    compras: { ver: true, editar: true },
    proyectos: { ver: true, editar: true },
    clientes: { ver: true, editar: true },
    ingenieria: { ver: true, editar: true },
    almacen: { ver: true, editar: true },
    chatbot: { ver: true, editar: true }
  }
}

export default function App() {
  // Estados de Seguridad, Perfiles y Credenciales de Emergencia
  const [perfilesUsuarios, setPerfilesUsuarios] = useState(() => {
    try {
      const guardado = localStorage.getItem('protemec_rbac_perfiles')
      return guardado ? JSON.parse(guardado) : PERFILES_INICIALES
    } catch {
      return PERFILES_INICIALES
    }
  })

  const [credencialesMaestras, setCredencialesMaestras] = useState(() => {
    try {
      const guardado = localStorage.getItem('protemec_master_creds')
      return guardado ? JSON.parse(guardado) : { usuario: 'admin', password: 'ProteMaster2026' }
    } catch {
      return { usuario: 'admin', password: 'ProteMaster2026' }
    }
  })

  const [usuarioActual, setUsuarioActual] = useState(() => {
    try {
      const sesion = localStorage.getItem('protemec_sesion_activa')
      return sesion ? JSON.parse(sesion) : null
    } catch {
      return null
    }
  })

  // Estados de la Pantalla de Login
  const [modoLogin, setModoLogin] = useState('entra') // 'entra' | 'maestro'
  const [emailEntraInput, setEmailEntraInput] = useState('admin@protemec.com')
  const [userMaestroInput, setUserMaestroInput] = useState('')
  const [passMaestroInput, setPassMaestroInput] = useState('')
  const [errorLogin, setErrorLogin] = useState('')

  useEffect(() => {
    localStorage.setItem('protemec_rbac_perfiles', JSON.stringify(perfilesUsuarios))
  }, [perfilesUsuarios])

  useEffect(() => {
    localStorage.setItem('protemec_master_creds', JSON.stringify(credencialesMaestras))
  }, [credencialesMaestras])

  useEffect(() => {
    if (usuarioActual) {
      localStorage.setItem('protemec_sesion_activa', JSON.stringify(usuarioActual))
    } else {
      localStorage.removeItem('protemec_sesion_activa')
    }
  }, [usuarioActual])

  // Sincronizar permisos en vivo si el usuario actual es uno de los perfiles editados
  const usuarioConPermisosActualizados = useMemo(() => {
    if (!usuarioActual) return null
    if (usuarioActual.esMaestro) return PERFIL_MAESTRO_TOTAL
    return perfilesUsuarios.find((p) => p.id === usuarioActual.id) || usuarioActual
  }, [usuarioActual, perfilesUsuarios])

  // Navegación Principal
  const [moduloActivo, setModuloActivo] = useState('compras')
  const [sidebarColapsado, setSidebarColapsado] = useState(false)
  const [subVistaIngenieria, setSubVistaIngenieria] = useState('explorador')
  const [subVistaAlmacen, setSubVistaAlmacen] = useState('inventario')

  // Estados de Datos Globales (Azure SQL)
  const [compras, setCompras] = useState([])
  const [clientes, setClientes] = useState([])
  const [ubicaciones, setUbicaciones] = useState([])
  const [contactos, setContactos] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [disenos, setDisenos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [sincronizando, setSincronizando] = useState(false)

  // Ventanas Emergentes (Modales)
  const [modalCompraAbierto, setModalCompraAbierto] = useState(false)
  const [modalConfigAbierto, setModalConfigAbierto] = useState(false)
  const [confirmacionModal, setConfirmacionModal] = useState(null)

  // Notificaciones tipo Apple Dynamic Island
  const [notificacion, setNotificacion] = useState(null)

  const mostrarToast = useCallback((mensaje, tipo = 'exito') => {
    setNotificacion({ mensaje, tipo })
    setTimeout(() => {
      setNotificacion((actual) => (actual?.mensaje === mensaje ? null : actual))
    }, 3600)
  }, [])

  // Estados del Formulario de Compras
  const [idEditando, setIdEditando] = useState(null)
  const [proveedor, setProveedor] = useState('')
  const [costo, setCosto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [producto, setProducto] = useState('')
  const [proyecto, setProyecto] = useState('')
  const [proyectoIdExterno, setProyectoIdExterno] = useState('')
  const [precioUnitario, setPrecioUnitario] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [fechaCompra, setFechaCompra] = useState('')
  const [estatus, setEstatus] = useState('Comprado')
  const [material, setMaterial] = useState('')
  const [notas, setNotas] = useState('')
  const [urlSaaS, setUrlSaaS] = useState('')
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const recargarDatos = useCallback(async (silencioso = false) => {
    if (!silencioso) setSincronizando(true)
    const ts = Date.now()

    const fetchSeguro = async (endpoint) => {
      try {
        const res = await fetch(`${API_URL}${endpoint}?t=${ts}`)
        if (!res.ok) return null
        return await res.json()
      } catch {
        return null
      }
    }

    const [
      datosCompras,
      datosClientes,
      datosUbicaciones,
      datosContactos,
      datosProyectos,
      datosIngenieria
    ] = await Promise.all([
      fetchSeguro('/api/datos'),
      fetchSeguro('/api/clientes'),
      fetchSeguro('/api/ubicaciones'),
      fetchSeguro('/api/contactos'),
      fetchSeguro('/api/proyectos'),
      fetchSeguro('/api/ingenieria')
    ])

    if (Array.isArray(datosCompras)) setCompras(datosCompras)
    if (Array.isArray(datosClientes)) setClientes(datosClientes)
    if (Array.isArray(datosUbicaciones)) setUbicaciones(datosUbicaciones)
    if (Array.isArray(datosContactos)) setContactos(datosContactos)
    if (Array.isArray(datosProyectos)) setProyectos(datosProyectos)
    if (Array.isArray(datosIngenieria)) setDisenos(datosIngenieria)

    setCargando(false)
    setSincronizando(false)
  }, [])

  useEffect(() => {
    recargarDatos()
  }, [recargarDatos])

  const proveedoresUnicos = useMemo(
    () => [...new Set(compras.map((c) => c.Proveedor || c.proveedor).filter(Boolean))],
    [compras]
  )
  const categoriasUnicas = useMemo(
    () => [...new Set(compras.map((c) => c.Categoria || c.categoria).filter(Boolean))],
    [compras]
  )
  const productosUnicos = useMemo(
    () => [...new Set(compras.map((c) => c.Producto || c.producto).filter(Boolean))],
    [compras]
  )
  const materialesUnicos = useMemo(
    () => [...new Set(compras.map((c) => c.Material || c.material).filter(Boolean))],
    [compras]
  )
  const proyectosUnicos = useMemo(() => {
    const deTablaProyectos = proyectos.map((p) => p.NombreProyecto).filter(Boolean)
    const deCompras = compras.map((c) => c.Proyecto || c.proyecto).filter(Boolean)
    return [...new Set([...deTablaProyectos, ...deCompras])]
  }, [proyectos, compras])

  const proyectoIdsUnicos = useMemo(() => {
    const deTablaProyectos = proyectos.map((p) => p.ProyectoID_Externo).filter(Boolean)
    const deCompras = compras.map((c) => c.ProyectoID_Externo || c.proyectoID_Externo).filter(Boolean)
    return [...new Set([...deTablaProyectos, ...deCompras])]
  }, [proyectos, compras])

  // Funciones de inicio de sesión
  const iniciarSesionEntraID = (e) => {
    e.preventDefault()
    setErrorLogin('')
    const correoLimpio = emailEntraInput.trim().toLowerCase()
    if (correoLimpio === 'admin@protemec.com') {
      setUsuarioActual(PERFIL_MAESTRO_TOTAL)
      mostrarToast('Sesión iniciada con Microsoft Entra ID (Perfil Maestro)')
      return
    }
    const perfilEncontrado = perfilesUsuarios.find((p) => p.email.toLowerCase() === correoLimpio)
    if (!perfilEncontrado) {
      setErrorLogin('Este correo no está registrado en los perfiles del ERP. Usa la Llave Maestra para darlo de alta.')
      return
    }
    setUsuarioActual(perfilEncontrado)
    const primerModuloPermitido = Object.keys(perfilEncontrado.permisos).find(
      (k) => perfilEncontrado.permisos[k]?.ver
    )
    if (primerModuloPermitido) setModuloActivo(primerModuloPermitido)
    mostrarToast(`Bienvenido, ${perfilEncontrado.nombre}`)
  }

  const iniciarSesionMaestra = (e) => {
    e.preventDefault()
    setErrorLogin('')
    if (
      userMaestroInput.trim() === credencialesMaestras.usuario &&
      passMaestroInput === credencialesMaestras.password
    ) {
      setUsuarioActual(PERFIL_MAESTRO_TOTAL)
      setUserMaestroInput('')
      setPassMaestroInput('')
      mostrarToast('Acceso Maestro de Emergencia Activado')
    } else {
      setErrorLogin('Usuario o contraseña maestra incorrectos')
    }
  }

  const cancelarEdicion = () => {
    setIdEditando(null)
    setProveedor('')
    setCosto('')
    setCategoria('')
    setProducto('')
    setProyecto('')
    setProyectoIdExterno('')
    setPrecioUnitario('')
    setCantidad('1')
    setFechaCompra('')
    setEstatus('Comprado')
    setMaterial('')
    setNotas('')
    setUrlSaaS('')
    setArchivoSeleccionado(null)
    setModalCompraAbierto(false)
  }

  const abrirModalNuevaCompra = () => {
    cancelarEdicion()
    setFechaCompra(new Date().toISOString().split('T')[0])
    setModalCompraAbierto(true)
  }

  const iniciarEdicion = (fila) => {
    const id = fila.Numero ?? fila.ID ?? fila.Id ?? fila.id
    setIdEditando(id)
    setProveedor(fila.Proveedor || fila.proveedor || '')
    setCosto(fila.Costo ?? fila.costo ?? '')
    setCategoria(fila.Categoria || fila.categoria || '')
    setProducto(fila.Producto || fila.producto || '')
    setProyecto(fila.Proyecto || fila.proyecto || '')
    setProyectoIdExterno(fila.ProyectoID_Externo || fila.proyectoID_Externo || '')
    setPrecioUnitario(fila.PrecioUnitario ?? fila.precioUnitario ?? '')
    setCantidad(fila.Cantidad ?? fila.cantidad ?? '1')
    setEstatus(fila.Estatus || fila.estatus || 'Comprado')
    setMaterial(fila.Material || fila.material || '')
    setNotas(fila.Notas || fila.notas || '')
    setUrlSaaS(fila.URL_SaaS || fila.urlSaaS || '')
    setArchivoSeleccionado(null)

    const valorFecha = fila.FechaCompra || fila.fechaCompra || fila.Fecha || fila.fecha
    setFechaCompra(valorFecha ? String(valorFecha).split('T')[0] : '')
    setModalCompraAbierto(true)
  }

  const manejarEnvio = async (e) => {
    e.preventDefault()
    setGuardando(true)

    const esEdicion = idEditando !== null
    const urlEndpoint = esEdicion ? `${API_URL}/api/compras/${idEditando}` : `${API_URL}/api/compras`
    const metodo = esEdicion ? 'PUT' : 'POST'

    try {
      let respuesta
      if (archivoSeleccionado) {
        const formData = new FormData()
        formData.append('proveedor', proveedor)
        formData.append('costo', parseFloat(costo) || 0)
        formData.append('categoria', categoria)
        formData.append('producto', producto)
        formData.append('proyecto', proyecto)
        formData.append('proyectoIdExterno', proyectoIdExterno)
        formData.append('precioUnitario', parseFloat(precioUnitario) || 0)
        formData.append('cantidad', parseFloat(cantidad) || 1)
        formData.append('fechaCompra', fechaCompra || '')
        formData.append('estatus', estatus || 'Comprado')
        formData.append('material', material)
        formData.append('notas', notas)
        if (urlSaaS) formData.append('urlSaaS', urlSaaS)
        formData.append('archivo', archivoSeleccionado)

        respuesta = await fetch(urlEndpoint, { method: metodo, body: formData })
      } else {
        const datosEnvio = {
          proveedor,
          costo: parseFloat(costo) || 0,
          categoria,
          producto,
          proyecto,
          proyectoIdExterno,
          precioUnitario: parseFloat(precioUnitario) || 0,
          cantidad: parseFloat(cantidad) || 1,
          urlSaaS,
          fechaCompra: fechaCompra || null,
          estatus: estatus || 'Comprado',
          material,
          notas
        }

        respuesta = await fetch(urlEndpoint, {
          method: metodo,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosEnvio)
        })
      }

      if (!respuesta.ok) throw new Error(`No se pudo ${esEdicion ? 'actualizar' : 'registrar'} la operación`)

      mostrarToast(esEdicion ? `Registro #${idEditando} actualizado` : 'Nueva compra registrada en Azure SQL')
      cancelarEdicion()
      await recargarDatos(true)
    } catch (err) {
      mostrarToast(err.message, 'error')
    } finally {
      setGuardando(false)
    }
  }

  const manejarCancelarRegistro = () => {
    if (!idEditando) return
    setConfirmacionModal({
      titulo: `¿Cancelar el Registro #${idEditando}?`,
      descripcion: `El registro de "${producto || 'este artículo'}" pasará a estatus Cancelado.`,
      textoConfirmar: 'Sí, cancelar registro',
      alConfirmar: async () => {
        setGuardando(true)
        try {
          const res = await fetch(`${API_URL}/api/compras/${idEditando}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              proveedor,
              costo: parseFloat(costo) || 0,
              categoria,
              producto,
              proyecto,
              proyectoIdExterno,
              precioUnitario: parseFloat(precioUnitario) || 0,
              cantidad: parseFloat(cantidad) || 1,
              urlSaaS,
              fechaCompra: fechaCompra || null,
              estatus: 'Cancelado',
              material,
              notas
            })
          })
          if (!res.ok) throw new Error('Error al cancelar el registro')
          mostrarToast(`Registro #${idEditando} cancelado`, 'alerta')
          setConfirmacionModal(null)
          cancelarEdicion()
          await recargarDatos(true)
        } catch (err) {
          mostrarToast(err.message, 'error')
        } finally {
          setGuardando(false)
        }
      }
    })
  }

  // PANTALLA DE LOGIN (SI NO HAY SESIÓN ACTIVA)
  if (!usuarioConPermisosActualizados) {
    return (
      <div style={estilos.loginScreen}>
        <div className="pro-card" style={estilos.loginCard}>
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <div style={{ ...estilos.brandLogo, width: '48px', height: '48px', fontSize: '22px', margin: '0 auto 12px' }}>
              P
            </div>
            <h2 style={{ fontSize: '21px' }}>PROTEMEC CLOUD ERP</h2>
            <p style={{ fontSize: '13px', color: '#86868b', marginTop: '4px' }}>
              Control Industrial, Ingeniería CAD 3D y Finanzas
            </p>
          </div>

          <div className="pro-segmented" style={{ width: '100%', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <button
              type="button"
              className={`pro-segmented-btn ${modoLogin === 'entra' ? 'active' : ''}`}
              onClick={() => { setModoLogin('entra'); setErrorLogin('') }}
              style={{ justifyContent: 'center' }}
            >
              🛡️ Microsoft Entra ID
            </button>
            <button
              type="button"
              className={`pro-segmented-btn ${modoLogin === 'maestro' ? 'active' : ''}`}
              onClick={() => { setModoLogin('maestro'); setErrorLogin('') }}
              style={{ justifyContent: 'center' }}
            >
              🔑 Llave Maestra
            </button>
          </div>

          {errorLogin && (
            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#991b1b', fontSize: '12px', marginBottom: '14px', fontWeight: 600 }}>
              ⚠️ {errorLogin}
            </div>
          )}

          {modoLogin === 'entra' ? (
            <form onSubmit={iniciarSesionEntraID} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="pro-label">Selecciona o ingresa cuenta Microsoft Entra ID</label>
                <select
                  value={emailEntraInput}
                  onChange={(e) => setEmailEntraInput(e.target.value)}
                  className="pro-select"
                  style={{ marginBottom: '8px' }}
                >
                  <option value="admin@protemec.com">👑 admin@protemec.com (Perfil Maestro)</option>
                  {perfilesUsuarios.map((p) => (
                    <option key={p.id} value={p.email}>
                      👤 {p.email} ({p.nombre})
                    </option>
                  ))}
                </select>
                <input
                  type="email"
                  value={emailEntraInput}
                  onChange={(e) => setEmailEntraInput(e.target.value)}
                  placeholder="correo@protemec.com"
                  required
                  className="pro-input pro-mono"
                />
              </div>

              <button type="submit" className="pro-btn pro-btn-primary" style={{ padding: '11px' }}>
                Iniciar sesión con Microsoft Entra ID
              </button>
            </form>
          ) : (
            <form onSubmit={iniciarSesionMaestra} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: '#515154', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                Acceso directo sin validación de Microsoft Entra ID (Por defecto: <code>admin</code> / <code>ProteMaster2026</code>)
              </div>
              <div>
                <label className="pro-label">Usuario Maestro</label>
                <input
                  type="text"
                  value={userMaestroInput}
                  onChange={(e) => setUserMaestroInput(e.target.value)}
                  placeholder="admin"
                  required
                  className="pro-input pro-mono"
                />
              </div>
              <div>
                <label className="pro-label">Contraseña Maestra</label>
                <input
                  type="password"
                  value={passMaestroInput}
                  onChange={(e) => setPassMaestroInput(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="pro-input pro-mono"
                />
              </div>
              <button type="submit" className="pro-btn pro-btn-dark" style={{ padding: '11px' }}>
                🔓 Desbloquear con Llave Maestra
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  const permisosModuloActual = usuarioConPermisosActualizados.permisos?.[moduloActivo] || { ver: true, editar: true }
  const puedeEditarModuloActual = Boolean(usuarioConPermisosActualizados.esMaestro || permisosModuloActual.editar)

  const menuNavegacion = [
    { id: 'compras', label: 'Compras y Finanzas', icono: '💳', badge: compras.length },
    { id: 'proyectos', label: 'Proyectos', icono: '📁', badge: proyectos.length },
    { id: 'clientes', label: 'Clientes y Directorio', icono: '🏢', badge: clientes.length },
    { id: 'ingenieria', label: 'Ingeniería y BOM 3D', icono: '⚙️', badge: disenos.length },
    { id: 'almacen', label: 'Almacén Digital 3D', icono: '📦', badge: null },
    { id: 'chatbot', label: 'Asistente IA', icono: '✨', badge: 'AI' }
  ].filter((item) => usuarioConPermisosActualizados.esMaestro || usuarioConPermisosActualizados.permisos?.[item.id]?.ver)

  const infoEncabezado = {
    compras: {
      titulo: 'Módulo de Compras y Cotizaciones',
      subtitulo: 'Control financiero, órdenes de compra y archivos en Azure Blob Storage'
    },
    proyectos: {
      titulo: 'Portafolio de Proyectos',
      subtitulo: 'Gestión de folios externos, clientes asignados y plantas operativas'
    },
    clientes: {
      titulo: 'Relación con Clientes (CRM)',
      subtitulo: 'Catálogo corporativo de empresas, ubicaciones industriales y directorio'
    },
    ingenieria: {
      titulo: 'Ingeniería, CAD 3D y Estructura BOM',
      subtitulo: 'Árbol jerárquico de ensambles, Kanban Drag & Drop y Calendario MS Project'
    },
    almacen: {
      titulo: 'Gemelo Digital de Almacén e Inventario',
      subtitulo: 'Recepción de mercancía y localización espacial en tiempo real'
    },
    chatbot: {
      titulo: 'Protemec Intelligence',
      subtitulo: 'Copiloto empresarial conectado a tus operaciones'
    }
  }[moduloActivo] || { titulo: 'Protemec ERP', subtitulo: '' }

  return (
    <div style={estilos.appLayout}>
      {notificacion && (
        <div style={estilos.toastIsland(notificacion.tipo)}>
          <span>{notificacion.tipo === 'exito' ? '✓' : notificacion.tipo === 'error' ? '✕' : '⚠️'}</span>
          <span>{notificacion.mensaje}</span>
        </div>
      )}

      {/* BARRA LATERAL */}
      <aside style={estilos.sidebar(sidebarColapsado)}>
        <div style={estilos.sidebarBrand}>
          <div style={estilos.brandLogo}>P</div>
          {!sidebarColapsado && (
            <div style={{ overflow: 'hidden' }}>
              <div style={estilos.brandTitle}>PROTEMEC</div>
              <div style={estilos.brandSubtitle}>Enterprise Cloud ERP</div>
            </div>
          )}
          <button
            onClick={() => setSidebarColapsado(!sidebarColapsado)}
            style={estilos.btnColapsar}
            title={sidebarColapsado ? 'Expandir menú' : 'Contraer menú'}
          >
            {sidebarColapsado ? '»' : '«'}
          </button>
        </div>

        <div style={estilos.navGroupLabel}>
          {!sidebarColapsado ? 'MÓDULOS AUTORIZADOS' : '•••'}
        </div>

        <nav style={estilos.navMenu}>
          {menuNavegacion.map((item) => {
            const activo = moduloActivo === item.id
            return (
              <button
                key={item.id}
                onClick={() => setModuloActivo(item.id)}
                style={estilos.navItem(activo, sidebarColapsado)}
                title={sidebarColapsado ? item.label : ''}
              >
                <span style={{ fontSize: '16px', lineHeight: 1 }}>{item.icono}</span>
                {!sidebarColapsado && (
                  <>
                    <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                    {item.badge !== null && item.badge !== 0 && (
                      <span style={estilos.navBadge(activo)}>{item.badge}</span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        <div style={estilos.sidebarFooter}>
          <button
            onClick={() => setModalConfigAbierto(true)}
            style={estilos.navItem(false, sidebarColapsado)}
            title="Permisos y Configuración"
          >
            <span style={{ fontSize: '16px' }}>🛡️</span>
            {!sidebarColapsado && (
              <span style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>Perfiles y Accesos</span>
            )}
          </button>

          {!sidebarColapsado && (
            <div style={estilos.azureStatusCard}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#1d1d1f', marginBottom: '2px' }}>
                {usuarioConPermisosActualizados.esMaestro ? '👑 ' : '👤 '}
                {usuarioConPermisosActualizados.nombre}
              </div>
              <div className="pro-mono" style={{ fontSize: '10.5px', color: '#86868b', marginBottom: '8px' }}>
                {usuarioConPermisosActualizados.email}
              </div>

              {/* Selector rápido de perfil para pruebas inmediatas */}
              <select
                value={usuarioConPermisosActualizados.id}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'master') {
                    setUsuarioActual(PERFIL_MAESTRO_TOTAL)
                  } else {
                    const p = perfilesUsuarios.find((x) => x.id === val)
                    if (p) setUsuarioActual(p)
                  }
                }}
                className="pro-select"
                style={{ fontSize: '11px', padding: '5px 8px', marginBottom: '6px' }}
              >
                <option value="master">Cambiar vista: Perfil Maestro</option>
                {perfilesUsuarios.map((p) => (
                  <option key={p.id} value={p.id}>Vista: {p.nombre}</option>
                ))}
              </select>

              <button
                onClick={() => setUsuarioActual(null)}
                className="pro-btn pro-btn-secondary pro-btn-sm"
                style={{ width: '100%', fontSize: '11px', padding: '5px' }}
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <div style={estilos.mainWrapper}>
        <header style={estilos.topHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1d1d1f' }}>
                {infoEncabezado.titulo}
              </h1>
              {!puedeEditarModuloActual && (
                <span className="pro-badge" style={{ backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
                  🔒 Modo Solo Lectura
                </span>
              )}
            </div>
            <p style={{ fontSize: '12.5px', color: '#86868b', marginTop: '1px' }}>
              {infoEncabezado.subtitulo}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {moduloActivo === 'ingenieria' && (
              <div className="pro-segmented">
                <button
                  className={`pro-segmented-btn ${subVistaIngenieria === 'explorador' ? 'active' : ''}`}
                  onClick={() => setSubVistaIngenieria('explorador')}
                >
                  🧊 Explorador 3D
                </button>
                <button
                  className={`pro-segmented-btn ${subVistaIngenieria === 'avance' ? 'active' : ''}`}
                  onClick={() => setSubVistaIngenieria('avance')}
                >
                  📊 Control de Avance (Kanban / Calendario)
                </button>
                {puedeEditarModuloActual && (
                  <button
                    className={`pro-segmented-btn ${subVistaIngenieria === 'nuevo' ? 'active' : ''}`}
                    onClick={() => setSubVistaIngenieria('nuevo')}
                  >
                    ➕ Registrar Pieza
                  </button>
                )}
              </div>
            )}

            {moduloActivo === 'almacen' && (
              <div className="pro-segmented">
                <button
                  className={`pro-segmented-btn ${subVistaAlmacen === 'inventario' ? 'active' : ''}`}
                  onClick={() => setSubVistaAlmacen('inventario')}
                >
                  📋 Recepción y Stock
                </button>
                <button
                  className={`pro-segmented-btn ${subVistaAlmacen === 'visor3d' ? 'active' : ''}`}
                  onClick={() => setSubVistaAlmacen('visor3d')}
                >
                  📦 Gemelo Digital 3D
                </button>
              </div>
            )}

            <button
              onClick={() => recargarDatos()}
              className="pro-btn pro-btn-secondary"
              title="Actualizar datos desde Azure SQL"
            >
              <span>↻</span>
              <span>Sincronizar</span>
            </button>

            {moduloActivo === 'compras' && puedeEditarModuloActual && (
              <button onClick={abrirModalNuevaCompra} className="pro-btn pro-btn-primary">
                <span>＋</span>
                <span>Nueva Compra / Cotización</span>
              </button>
            )}
          </div>
        </header>

        <main style={estilos.mainContent}>
          {cargando ? (
            <div style={estilos.loaderContainer}>
              <div style={estilos.appleSpinner} />
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginTop: '14px' }}>
                Conectando con Azure SQL Database...
              </h3>
            </div>
          ) : (
            <div key={moduloActivo} className="animate-view">
              {moduloActivo === 'compras' && (
                <VistaConsulta
                  compras={compras}
                  iniciarEdicion={iniciarEdicion}
                  abrirModalNuevaCompra={abrirModalNuevaCompra}
                  proveedoresUnicos={proveedoresUnicos}
                  categoriasUnicas={categoriasUnicas}
                  proyectosUnicos={proyectosUnicos}
                  puedeEditar={puedeEditarModuloActual}
                />
              )}

              {moduloActivo === 'proyectos' && (
                <GestionProyectos
                  proyectos={proyectos}
                  clientes={clientes}
                  ubicaciones={ubicaciones}
                  API_URL={API_URL}
                  recargarDatos={() => recargarDatos(true)}
                  mostrarToast={mostrarToast}
                />
              )}

              {moduloActivo === 'clientes' && (
                <GestionClientes
                  clientes={clientes}
                  ubicaciones={ubicaciones}
                  contactos={contactos}
                  API_URL={API_URL}
                  recargarDatos={() => recargarDatos(true)}
                  mostrarToast={mostrarToast}
                />
              )}

              {moduloActivo === 'ingenieria' && (
                <GestionIngenieria
                  disenos={disenos}
                  proyectosUnicos={proyectosUnicos}
                  API_URL={API_URL}
                  recargarDatos={() => recargarDatos(true)}
                  subVista={subVistaIngenieria}
                  setPestanaIngenieria={setSubVistaIngenieria}
                  mostrarToast={mostrarToast}
                  puedeEditar={puedeEditarModuloActual}
                />
              )}

              {moduloActivo === 'almacen' && (
                subVistaAlmacen === 'inventario' ? (
                  <GestionAlmacenInventario
                    compras={compras}
                    API_URL={API_URL}
                    recargarDatos={() => recargarDatos(true)}
                    mostrarToast={mostrarToast}
                    irAlVisor3D={() => setSubVistaAlmacen('visor3d')}
                  />
                ) : (
                  <GestionAlmacen3D API_URL={API_URL} />
                )
              )}

              {moduloActivo === 'chatbot' && <GestionChatbot compras={compras} proyectos={proyectos} />}
            </div>
          )}
        </main>
      </div>

      {/* PORTAL PARA FORMULARIO DE COMPRA */}
      {modalCompraAbierto &&
        createPortal(
          <div className="pro-modal-backdrop" onClick={cancelarEdicion}>
            <div
              className="pro-modal-window"
              style={{ maxWidth: '880px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pro-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={estilos.modalIconBadge(idEditando)}>{idEditando ? '✏️' : '＋'}</span>
                  <div>
                    <h3 style={{ fontSize: '16px', margin: 0 }}>
                      {idEditando ? `Modificar Registro #${idEditando}` : 'Registrar Nueva Compra o Cotización'}
                    </h3>
                  </div>
                </div>
                <button onClick={cancelarEdicion} style={estilos.btnCloseCircle}>✕</button>
              </div>

              <div className="pro-modal-body">
                <FormularioCompra
                  idEditando={idEditando}
                  proveedor={proveedor}
                  setProveedor={setProveedor}
                  costo={costo}
                  setCosto={setCosto}
                  categoria={categoria}
                  setCategoria={setCategoria}
                  producto={producto}
                  setProducto={setProducto}
                  proyecto={proyecto}
                  setProyecto={setProyecto}
                  proyectoIdExterno={proyectoIdExterno}
                  setProyectoIdExterno={setProyectoIdExterno}
                  precioUnitario={precioUnitario}
                  setPrecioUnitario={setPrecioUnitario}
                  cantidad={cantidad}
                  setCantidad={setCantidad}
                  fechaCompra={fechaCompra}
                  setFechaCompra={setFechaCompra}
                  estatus={estatus}
                  setEstatus={setEstatus}
                  material={material}
                  setMaterial={setMaterial}
                  notas={notas}
                  setNotas={setNotas}
                  setArchivoSeleccionado={setArchivoSeleccionado}
                  guardando={guardando}
                  manejarEnvio={manejarEnvio}
                  cancelarEdicion={cancelarEdicion}
                  manejarCancelarRegistro={manejarCancelarRegistro}
                  proveedoresUnicos={proveedoresUnicos}
                  categoriasUnicas={categoriasUnicas}
                  productosUnicos={productosUnicos}
                  materialesUnicos={materialesUnicos}
                  proyectosUnicos={proyectosUnicos}
                  proyectoIdsUnicos={proyectoIdsUnicos}
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* PORTAL PARA CONFIRMACIÓN DE CANCELACIÓN */}
      {confirmacionModal &&
        createPortal(
          <div className="pro-modal-backdrop" onClick={() => setConfirmacionModal(null)}>
            <div className="pro-modal-window" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
              <div className="pro-modal-body" style={{ textAlign: 'center', padding: '28px 24px 20px' }}>
                <div style={estilos.warningCircle}>⚠️</div>
                <h3 style={{ fontSize: '17px', marginBottom: '8px' }}>{confirmacionModal.titulo}</h3>
                <p style={{ fontSize: '13px', color: '#515154' }}>{confirmacionModal.descripcion}</p>
              </div>
              <div className="pro-modal-footer">
                <button type="button" onClick={() => setConfirmacionModal(null)} className="pro-btn pro-btn-secondary" style={{ flex: 1 }}>
                  Conservar
                </button>
                <button type="button" onClick={confirmacionModal.alConfirmar} className="pro-btn pro-btn-danger" style={{ flex: 1 }}>
                  {confirmacionModal.textoConfirmar}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL DE SEGURIDAD, PERFILES RBAC Y ENTRA ID */}
      <ModalConfiguracion
        abierto={modalConfigAbierto}
        alCerrar={() => setModalConfigAbierto(false)}
        API_URL={API_URL}
        perfilesUsuarios={perfilesUsuarios}
        setPerfilesUsuarios={setPerfilesUsuarios}
        credencialesMaestras={credencialesMaestras}
        setCredencialesMaestras={setCredencialesMaestras}
        usuarioActual={usuarioConPermisosActualizados}
        mostrarToast={mostrarToast}
      />
    </div>
  )
}

const estilos = {
  loginScreen: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at top, #ffffff 0%, #e8e8ed 100%)',
    padding: '20px'
  },
  loginCard: {
    width: '100%',
    maxWidth: '430px',
    padding: '32px',
    borderRadius: '22px',
    boxShadow: '0 24px 48px rgba(0,0,0,0.08)'
  },
  appLayout: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: 'var(--bg-canvas)'
  },
  sidebar: (colapsado) => ({
    width: colapsado ? '74px' : '264px',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRight: '1px solid var(--border-light)',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 12px',
    transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'sticky',
    top: 0,
    height: '100vh',
    zIndex: 100
  }),
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px 6px 16px 6px',
    borderBottom: '1px solid var(--border-light)',
    marginBottom: '14px'
  },
  brandLogo: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #1d1d1f 0%, #434346 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '16px',
    flexShrink: 0
  },
  brandTitle: {
    fontWeight: 800,
    fontSize: '14px',
    letterSpacing: '-0.02em',
    color: '#1d1d1f'
  },
  brandSubtitle: {
    fontSize: '11px',
    color: '#86868b',
    fontWeight: 500
  },
  btnColapsar: {
    marginLeft: 'auto',
    background: 'transparent',
    border: 'none',
    color: '#86868b',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px 6px'
  },
  navGroupLabel: {
    fontSize: '10.5px',
    fontWeight: 700,
    color: '#86868b',
    padding: '0 10px',
    marginBottom: '8px',
    letterSpacing: '0.06em'
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1
  },
  navItem: (activo, colapsado) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: colapsado ? 'center' : 'flex-start',
    gap: '11px',
    padding: '10px 12px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: activo ? '#0071e3' : 'transparent',
    color: activo ? '#ffffff' : '#3a3a3c',
    fontWeight: activo ? 600 : 500,
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    width: '100%'
  }),
  navBadge: (activo) => ({
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: '999px',
    backgroundColor: activo ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.06)',
    color: activo ? '#ffffff' : '#515154'
  }),
  sidebarFooter: {
    borderTop: '1px solid var(--border-light)',
    paddingTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  azureStatusCard: {
    backgroundColor: '#f5f5f7',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,0.05)'
  },
  mainWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0
  },
  topHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 90,
    backgroundColor: 'rgba(245, 245, 247, 0.82)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: '1px solid var(--border-light)',
    padding: '16px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap'
  },
  mainContent: {
    padding: '24px 28px',
    flex: 1
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '65vh'
  },
  appleSpinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(0, 113, 227, 0.18)',
    borderTopColor: '#0071e3',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  modalIconBadge: (esEdicion) => ({
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: esEdicion ? 'rgba(0, 113, 227, 0.12)' : 'rgba(16, 185, 129, 0.12)',
    color: esEdicion ? '#0071e3' : '#059669',
    fontWeight: 700,
    fontSize: '16px'
  }),
  btnCloseCircle: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#e8e8ed',
    color: '#515154',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer'
  },
  warningCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#fef2f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    margin: '0 auto 14px'
  },
  toastIsland: (tipo) => ({
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    backgroundColor: '#1d1d1f',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '999px',
    boxShadow: '0 14px 30px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    fontWeight: 600,
    border: `1px solid ${tipo === 'error' ? '#ef4444' : tipo === 'alerta' ? '#f59e0b' : 'rgba(255,255,255,0.15)'}`,
    animation: 'toastPop 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
  })
}