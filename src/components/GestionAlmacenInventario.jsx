import { useState, useEffect, useMemo, useCallback } from 'react'

export default function GestionAlmacenInventario({
  compras = [],
  proyectos = [],
  personalRH = [],
  API_URL,
  recargarDatos,
  mostrarToast,
  irAlVisor3D,
  puedeEditar = true
}) {
  const [pestanaInterna, setPestanaInterna] = useState('inventario') // 'inventario' | 'recepcion' | 'prestamos' | 'kardex'
  const [inventario, setInventario] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [procesando, setProcesando] = useState(false)

  // Modal / Panel de Entrada Manual o Suma de Stock
  const [modalEntrada, setModalEntrada] = useState(false)
  const [modoEntrada, setModoEntrada] = useState('existente') // 'existente' | 'nuevo'
  const [idItemEntrada, setIdItemEntrada] = useState('')
  const [nombreNuevoProd, setNombreNuevoProd] = useState('')
  const [ubicacion3DInput, setUbicacion3DInput] = useState('Pieza1')
  const [cantidadEntrada, setCantidadEntrada] = useState('1')
  const [notasEntrada, setNotasEntrada] = useState('')
  const [compraSeleccionada, setCompraSeleccionada] = useState(null)

  // Modal / Panel de Salida o Préstamo de Herramienta
  const [modalSalida, setModalSalida] = useState(false)
  const [itemParaSalida, setItemParaSalida] = useState(null)
  const [tipoSalida, setTipoSalida] = useState('Prestamo Herramienta') // 'Prestamo Herramienta' | 'Salida Consumo'
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('')
  const [cantidadSalida, setCantidadSalida] = useState('1')
  const [proyectoDestino, setProyectoDestino] = useState('')
  const [notasSalida, setNotasSalida] = useState('')

  const cargarAlmacen = useCallback(async () => {
    try {
      const ts = Date.now()
      const [resInv, resMov] = await Promise.all([
        fetch(`${API_URL}/api/inventario?t=${ts}`),
        fetch(`${API_URL}/api/inventario/movimientos?t=${ts}`)
      ])
      if (resInv.ok) setInventario(await resInv.json())
      if (resMov.ok) setMovimientos(await resMov.json())
    } catch {
      // Silencioso
    }
  }, [API_URL])

  useEffect(() => {
    cargarAlmacen()
  }, [cargarAlmacen])

  // Solo mostrar personal ACTIVO de RH para entregas y préstamos
  const personalActivo = useMemo(
    () => personalRH.filter((p) => p.Activo === true || p.Activo === 1),
    [personalRH]
  )

  // Compras listas para recibir en almacén
  const comprasPendientesRecepcion = useMemo(
    () =>
      compras.filter(
        (c) =>
          (c.Estatus || c.estatus) === 'Comprado' &&
          (c.EstatusAlmacen || c.estatusAlmacen) !== 'Recibido en Almacén'
      ),
    [compras]
  )

  // Préstamos de herramienta actualmente abiertos
  const prestamosActivos = useMemo(
    () => movimientos.filter((m) => m.EstatusPrestamo === 'Prestado'),
    [movimientos]
  )

  const inventarioFiltrado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return inventario
    return inventario.filter(
      (item) =>
        String(item.NombreProducto || '').toLowerCase().includes(q) ||
        String(item.Ubicacion3D || '').toLowerCase().includes(q) ||
        String(item.Estado || '').toLowerCase().includes(q)
    )
  }, [inventario, busqueda])

  const abrirModalEntradaManual = (itemPreseleccionado = null, desdeCompra = null) => {
    setCompraSeleccionada(desdeCompra)
    if (itemPreseleccionado) {
      setModoEntrada('existente')
      setIdItemEntrada(String(itemPreseleccionado.ID))
      setNombreNuevoProd(itemPreseleccionado.NombreProducto)
      setUbicacion3DInput(itemPreseleccionado.Ubicacion3D || 'Pieza1')
      setCantidadEntrada('1')
      setNotasEntrada('')
    } else if (desdeCompra) {
      const prodCompra = desdeCompra.Producto || desdeCompra.producto || ''
      const coincidencia = inventario.find(
        (i) => String(i.NombreProducto || '').toLowerCase() === prodCompra.toLowerCase()
      )
      if (coincidencia) {
        setModoEntrada('existente')
        setIdItemEntrada(String(coincidencia.ID))
        setUbicacion3DInput(coincidencia.Ubicacion3D || 'Pieza1')
      } else {
        setModoEntrada('nuevo')
        setNombreNuevoProd(prodCompra)
        setUbicacion3DInput('Pieza1')
      }
      setCantidadEntrada(String(desdeCompra.Cantidad || desdeCompra.cantidad || 1))
      setNotasEntrada(`Recepción de Orden #${desdeCompra.Numero} (${desdeCompra.Proveedor || ''})`)
    } else {
      setModoEntrada('nuevo')
      setIdItemEntrada(inventario[0]?.ID ? String(inventario[0].ID) : '')
      setNombreNuevoProd('')
      setUbicacion3DInput('Pieza1')
      setCantidadEntrada('1')
      setNotasEntrada('')
    }
    setModalEntrada(true)
  }

  const guardarEntradaInventario = async (e) => {
    e.preventDefault()
    setProcesando(true)
    try {
      const payload = {
        compraID: compraSeleccionada ? compraSeleccionada.Numero : null,
        modo: modoEntrada,
        inventarioIDExistente: modoEntrada === 'existente' ? parseInt(idItemEntrada, 10) : null,
        nombreProducto: modoEntrada === 'nuevo' ? nombreNuevoProd.trim() : '',
        ubicacion3D: ubicacion3DInput.trim() || 'Pieza1',
        cantidad: parseInt(cantidadEntrada, 10) || 1,
        notas: notasEntrada.trim()
      }

      const res = await fetch(`${API_URL}/api/inventario/ingresar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Error al registrar entrada en almacén')

      if (mostrarToast) {
        mostrarToast(
          compraSeleccionada
            ? `Compra #${compraSeleccionada.Numero} ingresada al almacén`
            : 'Stock actualizado correctamente en InventarioAlmacen'
        )
      }
      setModalEntrada(false)
      setCompraSeleccionada(null)
      await cargarAlmacen()
      if (recargarDatos) recargarDatos()
    } catch (err) {
      if (mostrarToast) mostrarToast(err.message, 'error')
    } finally {
      setProcesando(false)
    }
  }

  const abrirModalSalidaItem = (item, tipoInicial = 'Prestamo Herramienta') => {
    setItemParaSalida(item)
    setTipoSalida(tipoInicial)
    setEmpleadoSeleccionado(personalActivo[0]?.EmpleadoID ? String(personalActivo[0].EmpleadoID) : '')
    setCantidadSalida('1')
    setProyectoDestino('')
    setNotasSalida('')
    setModalSalida(true)
  }

  const registrarSalidaOPrestamo = async (e) => {
    e.preventDefault()
    if (!itemParaSalida) return
    if (!empleadoSeleccionado) {
      if (mostrarToast) mostrarToast('Selecciona un colaborador activo de RH', 'alerta')
      return
    }

    setProcesando(true)
    try {
      const res = await fetch(`${API_URL}/api/inventario/salida`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventarioID: itemParaSalida.ID,
          tipoMovimiento: tipoSalida,
          cantidad: parseInt(cantidadSalida, 10) || 1,
          empleadoID: parseInt(empleadoSeleccionado, 10),
          proyecto: proyectoDestino,
          notas: notasSalida
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar la salida')

      if (mostrarToast) mostrarToast(data.mensaje)
      setModalSalida(false)
      await cargarAlmacen()
      if (recargarDatos) recargarDatos()
    } catch (err) {
      if (mostrarToast) mostrarToast(err.message, 'error')
    } finally {
      setProcesando(false)
    }
  }

  const marcarHerramientaDevuelta = async (mov) => {
    setProcesando(true)
    try {
      const res = await fetch(`${API_URL}/api/inventario/prestamo/${mov.MovimientoID}/devolver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notasDevolucion: 'Reintegrado en buen estado' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al devolver herramienta')

      if (mostrarToast) mostrarToast(`"${mov.NombreProducto}" devuelto al stock`)
      await cargarAlmacen()
    } catch (err) {
      if (mostrarToast) mostrarToast(err.message, 'error')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* TARJETAS DE RESUMEN DE ALMACÉN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        <div className="pro-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '11.5px', color: '#86868b', fontWeight: 600 }}>ARTÍCULOS EN CATÁLOGO</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#1d1d1f', marginTop: '4px' }}>
            {inventario.length}
          </div>
          <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>
            Unidades totales: {inventario.reduce((acc, i) => acc + (Number(i.CantidadStock) || 0), 0)}
          </span>
        </div>

        <div className="pro-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '11.5px', color: '#86868b', fontWeight: 600 }}>COMPRAS POR RECIBIR</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: comprasPendientesRecepcion.length > 0 ? '#d97706' : '#1d1d1f', marginTop: '4px' }}>
            {comprasPendientesRecepcion.length}
          </div>
          <span style={{ fontSize: '11.5px', color: '#86868b' }}>Estatus &ldquo;Comprado&rdquo; pendientes</span>
        </div>

        <div className="pro-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '11.5px', color: '#86868b', fontWeight: 600 }}>HERRAMIENTAS EN PRÉSTAMO</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: prestamosActivos.length > 0 ? '#0071e3' : '#1d1d1f', marginTop: '4px' }}>
            {prestamosActivos.length}
          </div>
          <span style={{ fontSize: '11.5px', color: '#0071e3', fontWeight: 600 }}>
            Asignadas a personal activo
          </span>
        </div>

        <div className="pro-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '11.5px', color: '#86868b', fontWeight: 600 }}>PERSONAL ACTIVO AUTORIZADO</span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#1d1d1f', marginTop: '4px' }}>
            {personalActivo.length}
          </div>
          <span style={{ fontSize: '11.5px', color: '#86868b' }}>Habilitados por RH para entregas</span>
        </div>
      </div>

      {/* BARRA DE NAVEGACIÓN Y ACCIONES DE ALMACÉN */}
      <div className="pro-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="pro-segmented">
          <button
            type="button"
            className={`pro-segmented-btn ${pestanaInterna === 'inventario' ? 'active' : ''}`}
            onClick={() => setPestanaInterna('inventario')}
          >
            📦 Existencias y Salidas ({inventario.length})
          </button>
          <button
            type="button"
            className={`pro-segmented-btn ${pestanaInterna === 'prestamos' ? 'active' : ''}`}
            onClick={() => setPestanaInterna('prestamos')}
          >
            🛠️ Préstamos de Herramienta ({prestamosActivos.length})
          </button>
          <button
            type="button"
            className={`pro-segmented-btn ${pestanaInterna === 'recepcion' ? 'active' : ''}`}
            onClick={() => setPestanaInterna('recepcion')}
          >
            📥 Recepción de Compras ({comprasPendientesRecepcion.length})
          </button>
          <button
            type="button"
            className={`pro-segmented-btn ${pestanaInterna === 'kardex' ? 'active' : ''}`}
            onClick={() => setPestanaInterna('kardex')}
          >
            📋 Historial Kardex ({movimientos.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {puedeEditar && (
            <button
              type="button"
              onClick={() => abrirModalEntradaManual(null, null)}
              className="pro-btn pro-btn-primary"
            >
              ➕ Añadir Artículo / Sumar Stock
            </button>
          )}
          {irAlVisor3D && (
            <button type="button" onClick={irAlVisor3D} className="pro-btn pro-btn-secondary">
              🧊 Ver en Gemelo 3D
            </button>
          )}
        </div>
      </div>

      {/* PESTAÑA 1: EXISTENCIAS, SUMA RÁPIDA, SALIDAS Y PRÉSTAMOS */}
      {pestanaInterna === 'inventario' && (
        <div className="pro-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '12px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '15.5px', margin: 0 }}>Inventario Físico en Almacén (`InventarioAlmacen`)</h3>
            <input
              type="text"
              placeholder="🔍 Buscar por producto, herramienta o ubicación 3D (ej. Pieza8)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pro-input"
              style={{ maxWidth: '380px' }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>ID</th>
                  <th style={{ padding: '10px 12px' }}>Producto / Herramienta</th>
                  <th style={{ padding: '10px 12px' }}>Ubicación 3D</th>
                  <th style={{ padding: '10px 12px' }}>Estado</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Stock Actual</th>
                  <th style={{ padding: '10px 12px' }}>Última Actualización</th>
                  {puedeEditar && <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acciones de Almacén</th>}
                </tr>
              </thead>
              <tbody>
                {inventarioFiltrado.map((item) => {
                  const sinStock = (Number(item.CantidadStock) || 0) <= 0
                  return (
                    <tr key={item.ID} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td className="pro-mono" style={{ padding: '10px 12px', fontWeight: 700 }}>#{item.ID}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1d1d1f' }}>{item.NombreProducto}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className="pro-badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                          📍 {item.Ubicacion3D || 'Sin asignar'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          className="pro-badge"
                          style={{
                            backgroundColor: sinStock ? '#fef2f2' : '#ecfdf5',
                            color: sinStock ? '#991b1b' : '#065f46'
                          }}
                        >
                          {item.Estado || (sinStock ? 'Agotado' : 'Almacenado')}
                        </span>
                      </td>
                      <td className="pro-mono" style={{ padding: '10px 12px', textAlign: 'right', fontSize: '14.5px', fontWeight: 800, color: sinStock ? '#dc2626' : '#1d1d1f' }}>
                        {item.CantidadStock}
                      </td>
                      <td className="pro-mono" style={{ padding: '10px 12px', fontSize: '11.5px', color: '#86868b' }}>
                        {item.FechaActualizacion ? new Date(item.FechaActualizacion).toLocaleString('es-MX') : '—'}
                      </td>
                      {puedeEditar && (
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => abrirModalEntradaManual(item, null)}
                              className="pro-btn pro-btn-secondary pro-btn-sm"
                              title="Sumar unidades a este artículo"
                            >
                              ＋ Sumar Stock
                            </button>
                            <button
                              type="button"
                              disabled={sinStock}
                              onClick={() => abrirModalSalidaItem(item, 'Prestamo Herramienta')}
                              className="pro-btn pro-btn-primary pro-btn-sm"
                              title="Prestar herramienta a personal activo"
                            >
                              🛠️ Prestar
                            </button>
                            <button
                              type="button"
                              disabled={sinStock}
                              onClick={() => abrirModalSalidaItem(item, 'Salida Consumo')}
                              className="pro-btn pro-btn-dark pro-btn-sm"
                              title="Dar salida definitiva por consumo"
                            >
                              📤 Dar Salida
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: PRÉSTAMOS DE HERRAMIENTA ACTIVOS Y DEVOLUCIONES */}
      {pestanaInterna === 'prestamos' && (
        <div className="pro-card" style={{ padding: '18px' }}>
          <h3 style={{ fontSize: '15.5px', marginBottom: '12px' }}>
            🛠️ Herramientas Prestadas Pendientes de Devolución
          </h3>
          {prestamosActivos.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#86868b' }}>
              No hay herramientas prestadas pendientes de devolución en este momento.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: '#f8fafc', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Folio</th>
                    <th style={{ padding: '10px 12px' }}>Herramienta / Equipo</th>
                    <th style={{ padding: '10px 12px' }}>Cant.</th>
                    <th style={{ padding: '10px 12px' }}>Entregado a (Personal RH)</th>
                    <th style={{ padding: '10px 12px' }}>Proyecto / Destino</th>
                    <th style={{ padding: '10px 12px' }}>Fecha Salida</th>
                    <th style={{ padding: '10px 12px' }}>Notas</th>
                    {puedeEditar && <th style={{ padding: '10px 12px', textAlign: 'right' }}>Devolución</th>}
                  </tr>
                </thead>
                <tbody>
                  {prestamosActivos.map((mov) => (
                    <tr key={mov.MovimientoID} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td className="pro-mono" style={{ padding: '10px 12px' }}>#{mov.MovimientoID}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{mov.NombreProducto}</td>
                      <td className="pro-mono" style={{ padding: '10px 12px', fontWeight: 700 }}>{mov.Cantidad}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <strong>{mov.NombreEmpleado}</strong>
                        {mov.Departamento && <div style={{ fontSize: '11px', color: '#86868b' }}>{mov.Departamento}</div>}
                      </td>
                      <td style={{ padding: '10px 12px' }}>{mov.Proyecto || 'Uso General Planta'}</td>
                      <td className="pro-mono" style={{ padding: '10px 12px', fontSize: '11.5px' }}>
                        {new Date(mov.FechaMovimiento).toLocaleString('es-MX')}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#515154' }}>{mov.Notas || '—'}</td>
                      {puedeEditar && (
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <button
                            type="button"
                            disabled={procesando}
                            onClick={() => marcarHerramientaDevuelta(mov)}
                            className="pro-btn pro-btn-success pro-btn-sm"
                          >
                            ✓ Recibir Devolución
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 3: RECEPCIÓN DESDE COMPRAS */}
      {pestanaInterna === 'recepcion' && (
        <div className="pro-card" style={{ padding: '18px' }}>
          <h3 style={{ fontSize: '15.5px', marginBottom: '12px' }}>
            📥 Órdenes con Estatus &ldquo;Comprado&rdquo; Pendientes de Ingresar al Almacén
          </h3>
          {comprasPendientesRecepcion.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#86868b' }}>
              Todas las compras con estatus &ldquo;Comprado&rdquo; ya han sido recibidas en el almacén.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: '#f8fafc', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Compra #</th>
                    <th style={{ padding: '10px 12px' }}>Producto</th>
                    <th style={{ padding: '10px 12px' }}>Material / Categoría</th>
                    <th style={{ padding: '10px 12px' }}>Proveedor</th>
                    <th style={{ padding: '10px 12px' }}>Proyecto</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Cantidad</th>
                    {puedeEditar && <th style={{ padding: '10px 12px', textAlign: 'right' }}>Ingresar</th>}
                  </tr>
                </thead>
                <tbody>
                  {comprasPendientesRecepcion.map((c) => (
                    <tr key={c.Numero} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td className="pro-mono" style={{ padding: '10px 12px', fontWeight: 700 }}>#{c.Numero}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{c.Producto}</td>
                      <td style={{ padding: '10px 12px' }}>{c.Material || c.Categoria || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{c.Proveedor}</td>
                      <td style={{ padding: '10px 12px' }}>{c.Proyecto || 'Stock General'}</td>
                      <td className="pro-mono" style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                        {c.Cantidad}
                      </td>
                      {puedeEditar && (
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => abrirModalEntradaManual(null, c)}
                            className="pro-btn pro-btn-primary pro-btn-sm"
                          >
                            📥 Dar Entrada a Almacén
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 4: HISTORIAL COMPLETO KARDEX */}
      {pestanaInterna === 'kardex' && (
        <div className="pro-card" style={{ padding: '18px' }}>
          <h3 style={{ fontSize: '15.5px', marginBottom: '12px' }}>
            📋 Bitácora Histórica de Entradas, Salidas y Préstamos (`MovimientosAlmacen`)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Fecha</th>
                  <th style={{ padding: '10px 12px' }}>Tipo Movimiento</th>
                  <th style={{ padding: '10px 12px' }}>Artículo / Herramienta</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Cant.</th>
                  <th style={{ padding: '10px 12px' }}>Responsable (RH)</th>
                  <th style={{ padding: '10px 12px' }}>Proyecto</th>
                  <th style={{ padding: '10px 12px' }}>Estado Préstamo</th>
                  <th style={{ padding: '10px 12px' }}>Notas</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => {
                  const esEntrada = m.TipoMovimiento.includes('Entrada') || m.TipoMovimiento.includes('Recepcion')
                  return (
                    <tr key={m.MovimientoID} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td className="pro-mono" style={{ padding: '9px 12px', fontSize: '11.5px' }}>
                        {new Date(m.FechaMovimiento).toLocaleString('es-MX')}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span
                          className="pro-badge"
                          style={{
                            backgroundColor: esEntrada ? '#ecfdf5' : m.TipoMovimiento === 'Prestamo Herramienta' ? '#eff6ff' : '#fef2f2',
                            color: esEntrada ? '#065f46' : m.TipoMovimiento === 'Prestamo Herramienta' ? '#1d4ed8' : '#991b1b'
                          }}
                        >
                          {m.TipoMovimiento}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', fontWeight: 700 }}>{m.NombreProducto}</td>
                      <td className="pro-mono" style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700 }}>
                        {esEntrada ? `+${m.Cantidad}` : `-${m.Cantidad}`}
                      </td>
                      <td style={{ padding: '9px 12px' }}>{m.NombreEmpleado || 'Almacén'}</td>
                      <td style={{ padding: '9px 12px' }}>{m.Proyecto || '—'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        {m.EstatusPrestamo ? (
                          <span
                            className="pro-badge"
                            style={{
                              backgroundColor: m.EstatusPrestamo === 'Devuelto' ? '#ecfdf5' : '#fffbeb',
                              color: m.EstatusPrestamo === 'Devuelto' ? '#065f46' : '#92400e'
                            }}
                          >
                            {m.EstatusPrestamo}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '9px 12px', color: '#515154' }}>{m.Notas || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PARA ENTRADA MANUAL / SUMA DE STOCK / RECEPCIÓN DE COMPRA */}
      {modalEntrada && (
        <div className="pro-modal-backdrop" onClick={() => setModalEntrada(false)}>
          <div className="pro-modal-window" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="pro-modal-header">
              <h3 style={{ fontSize: '16px', margin: 0 }}>
                {compraSeleccionada
                  ? `📥 Recibir Compra #${compraSeleccionada.Numero} en Almacén`
                  : '➕ Alta de Producto o Suma de Stock en Almacén'}
              </h3>
              <button onClick={() => setModalEntrada(false)} className="pro-btn pro-btn-secondary pro-btn-sm">✕</button>
            </div>

            <form onSubmit={guardarEntradaInventario} className="pro-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="pro-segmented" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <button
                  type="button"
                  className={`pro-segmented-btn ${modoEntrada === 'existente' ? 'active' : ''}`}
                  onClick={() => setModoEntrada('existente')}
                >
                  📦 Sumar a Existente
                </button>
                <button
                  type="button"
                  className={`pro-segmented-btn ${modoEntrada === 'nuevo' ? 'active' : ''}`}
                  onClick={() => setModoEntrada('nuevo')}
                >
                  ✨ Nuevo Producto / Herramienta
                </button>
              </div>

              {modoEntrada === 'existente' ? (
                <div>
                  <label className="pro-label">Selecciona el Artículo de `InventarioAlmacen` *</label>
                  <select
                    value={idItemEntrada}
                    onChange={(e) => {
                      setIdItemEntrada(e.target.value)
                      const sel = inventario.find((i) => String(i.ID) === e.target.value)
                      if (sel?.Ubicacion3D) setUbicacion3DInput(sel.Ubicacion3D)
                    }}
                    required
                    className="pro-select"
                  >
                    <option value="">-- Seleccionar --</option>
                    {inventario.map((i) => (
                      <option key={i.ID} value={i.ID}>
                        #{i.ID} - {i.NombreProducto} (Stock actual: {i.CantidadStock})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="pro-label">Nombre del Nuevo Producto o Herramienta *</label>
                  <input
                    type="text"
                    placeholder="Ej. TALADRO MILWAUKEE M18 / ACERO 1045..."
                    value={nombreNuevoProd}
                    onChange={(e) => setNombreNuevoProd(e.target.value)}
                    required
                    className="pro-input"
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="pro-label">Cantidad a Ingresar *</label>
                  <input
                    type="number"
                    min="1"
                    value={cantidadEntrada}
                    onChange={(e) => setCantidadEntrada(e.target.value)}
                    required
                    className="pro-input pro-mono"
                  />
                </div>
                <div>
                  <label className="pro-label">Ubicación 3D (Rack / Nodo GLB) *</label>
                  <input
                    type="text"
                    placeholder="Ej. Pieza1, Pieza8, Pieza12..."
                    value={ubicacion3DInput}
                    onChange={(e) => setUbicacion3DInput(e.target.value)}
                    required
                    className="pro-input pro-mono"
                  />
                </div>
              </div>

              <div>
                <label className="pro-label">Notas / Referencia de Entrada</label>
                <input
                  type="text"
                  placeholder="Ej. Inventario físico inicial, ajuste de stock..."
                  value={notasEntrada}
                  onChange={(e) => setNotasEntrada(e.target.value)}
                  className="pro-input"
                />
              </div>

              <div className="pro-modal-footer" style={{ padding: '12px 0 0 0' }}>
                <button type="button" onClick={() => setModalEntrada(false)} className="pro-btn pro-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={procesando} className="pro-btn pro-btn-primary">
                  {procesando ? 'Guardando...' : '💾 Confirmar Entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA SALIDA DE MATERIAL O PRÉSTAMO DE HERRAMIENTA */}
      {modalSalida && itemParaSalida && (
        <div className="pro-modal-backdrop" onClick={() => setModalSalida(false)}>
          <div className="pro-modal-window" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="pro-modal-header">
              <div>
                <h3 style={{ fontSize: '16px', margin: 0 }}>
                  {tipoSalida === 'Prestamo Herramienta' ? '🛠️ Préstamo de Herramienta' : '📤 Salida de Material de Almacén'}
                </h3>
                <span style={{ fontSize: '12px', color: '#86868b' }}>
                  Artículo: <strong>{itemParaSalida.NombreProducto}</strong> (Disponible: {itemParaSalida.CantidadStock})
                </span>
              </div>
              <button onClick={() => setModalSalida(false)} className="pro-btn pro-btn-secondary pro-btn-sm">✕</button>
            </div>

            <form onSubmit={registrarSalidaOPrestamo} className="pro-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="pro-segmented" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <button
                  type="button"
                  className={`pro-segmented-btn ${tipoSalida === 'Prestamo Herramienta' ? 'active' : ''}`}
                  onClick={() => setTipoSalida('Prestamo Herramienta')}
                >
                  🛠️ Préstamo (Retornable)
                </button>
                <button
                  type="button"
                  className={`pro-segmented-btn ${tipoSalida === 'Salida Consumo' ? 'active' : ''}`}
                  onClick={() => setTipoSalida('Salida Consumo')}
                >
                  📤 Salida Definitiva (Consumo)
                </button>
              </div>

              <div>
                <label className="pro-label">Entregar a Colaborador (Solo Personal Activo en RH) *</label>
                <select
                  value={empleadoSeleccionado}
                  onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
                  required
                  className="pro-select"
                >
                  <option value="">-- Selecciona quién recibe --</option>
                  {personalActivo.map((emp) => (
                    <option key={emp.EmpleadoID} value={emp.EmpleadoID}>
                      {emp.NombreCompleto} — ({emp.Departamento} {emp.Puesto ? `· ${emp.Puesto}` : ''})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '11px', color: '#86868b' }}>
                  * Los empleados dados de baja en RH se ocultan automáticamente de esta lista.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                <div>
                  <label className="pro-label">Cantidad a Entregar *</label>
                  <input
                    type="number"
                    min="1"
                    max={itemParaSalida.CantidadStock}
                    value={cantidadSalida}
                    onChange={(e) => setCantidadSalida(e.target.value)}
                    required
                    className="pro-input pro-mono"
                  />
                </div>
                <div>
                  <label className="pro-label">Proyecto / Orden de Trabajo</label>
                  <select
                    value={proyectoDestino}
                    onChange={(e) => setProyectoDestino(e.target.value)}
                    className="pro-select"
                  >
                    <option value="">Uso General de Planta</option>
                    {proyectos.map((p, idx) => (
                      <option key={idx} value={p.NombreProyecto || p}>
                        {p.NombreProyecto || p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="pro-label">Observaciones / Estado de Entrega</label>
                <input
                  type="text"
                  placeholder="Ej. Se entrega con estuche completo, para ensamble en bahía 2..."
                  value={notasSalida}
                  onChange={(e) => setNotasSalida(e.target.value)}
                  className="pro-input"
                />
              </div>

              <div className="pro-modal-footer" style={{ padding: '12px 0 0 0' }}>
                <button type="button" onClick={() => setModalSalida(false)} className="pro-btn pro-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={procesando} className="pro-btn pro-btn-primary">
                  {procesando ? 'Registrando...' : '✓ Autorizar y Descontar Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}