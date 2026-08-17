import React, { useState } from 'react'
import GlbViewer from './GlbViewer'

export default function GestionIngenieria({ 
  disenos = [], 
  proyectosUnicos = [], 
  API_URL, 
  recargarDatos,
  subVista = 'explorador',
  setPestanaIngenieria
}) {
  // Filtros y Búsqueda
  const [proyectoFiltro, setProyectoFiltro] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Formulario y Modo Edición
  const [elementoEditando, setElementoEditando] = useState(null)
  const [nombre, setNombre] = useState('')
  const [proyectoForm, setProyectoForm] = useState('')
  const [tipoNivel, setTipoNivel] = useState('Ensamble')
  const [padreID, setPadreID] = useState('')
  const [cantidadRequerida, setCantidadRequerida] = useState(1)
  const [archivoGlb, setArchivoGlb] = useState(null)
  const [archivoPdf, setArchivoPdf] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [modeloSeleccionado, setModeloSeleccionado] = useState(null)

  // Acordeón (Filas desplegadas)
  const [filasAbiertas, setFilasAbiertas] = useState({})

  const toggleFila = (id) => {
    setFilasAbiertas(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Cargar datos en el formulario para editar
  const iniciarEdicion = (item) => {
    setElementoEditando(item.ID)
    setNombre(item.Nombre || '')
    setProyectoForm(item.Proyecto || '')
    setTipoNivel(item.TipoNivel || 'Ensamble')
    setPadreID(item.PadreID || '')
    setCantidadRequerida(item.CantidadRequerida || 1)
    setArchivoGlb(null)
    setArchivoPdf(null)
    if (setPestanaIngenieria) setPestanaIngenieria('nuevo')
  }

  // Filtrado de elementos por proyecto y texto
  const disenosFiltrados = disenos.filter(d => {
    const coincideProyecto = proyectoFiltro ? d.Proyecto === proyectoFiltro : true
    const coincideTexto = d.Nombre ? d.Nombre.toLowerCase().includes(busqueda.toLowerCase()) : true
    return coincideProyecto && coincideTexto
  })

  // Padres disponibles (evitando seleccionarse a sí mismo como padre al editar)
  const padresDisponibles = disenos.filter(
    d => (d.TipoNivel === 'Ensamble' || d.TipoNivel === 'Subensamble') && 
         (!proyectoForm || d.Proyecto === proyectoForm) && 
         d.ID !== elementoEditando
  )

  const manejarEnvio = async (e) => {
    e.preventDefault()
    if (!proyectoForm || !nombre) {
      alert('Por favor selecciona un proyecto e ingresa un nombre.')
      return
    }

    setGuardando(true)
    const formData = new FormData()
    formData.append('nombre', nombre)
    formData.append('proyecto', proyectoForm)
    formData.append('tipoNivel', tipoNivel)
    formData.append('padreID', padreID || '')
    formData.append('cantidadRequerida', cantidadRequerida || 1)
    if (archivoGlb) formData.append('archivoGlb', archivoGlb)
    if (archivoPdf) formData.append('archivoPdf', archivoPdf)

    if (elementoEditando) {
      const itemActual = disenos.find(d => d.ID === elementoEditando)
      if (itemActual?.UrlGLB) formData.append('urlGlbActual', itemActual.UrlGLB)
      if (itemActual?.UrlPDF) formData.append('urlPdfActual', itemActual.UrlPDF)
    }

    try {
      const urlEndpoint = elementoEditando 
        ? `${API_URL}/api/ingenieria/${elementoEditando}` 
        : `${API_URL}/api/ingenieria`
      
      const metodo = elementoEditando ? 'PUT' : 'POST'

      const res = await fetch(urlEndpoint, {
        method: metodo,
        body: formData,
      })

      let mensajeDetallado = 'Error al guardar en la base de datos'
      if (!res.ok) {
        try {
          const errorBody = await res.text()
          if (errorBody) mensajeDetallado = errorBody
        } catch (e) {}
        throw new Error(mensajeDetallado)
      }

      // Limpiar formulario
      setNombre('')
      setPadreID('')
      setCantidadRequerida(1)
      setArchivoGlb(null)
      setArchivoPdf(null)
      setElementoEditando(null)

      const inputGlb = document.getElementById('file-glb')
      const inputPdf = document.getElementById('file-pdf')
      if (inputGlb) inputGlb.value = ''
      if (inputPdf) inputPdf.value = ''

      await recargarDatos()
      alert(elementoEditando ? '¡Registro actualizado con éxito!' : '¡Registro guardado con éxito!')
      if (setPestanaIngenieria) setPestanaIngenieria('explorador')
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  // Actualizar cantidades en tiempo real
  const actualizarCantidades = async (id, nuevaLista, nuevaRequerida) => {
    try {
      const res = await fetch(`${API_URL}/api/ingenieria/${id}/avance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidadLista: nuevaLista, cantidadRequerida: nuevaRequerida })
      })

      if (!res.ok) {
        const textoError = await res.text()
        throw new Error(textoError || `Error HTTP: ${res.status}`)
      }

      recargarDatos()
    } catch (err) {
      alert('Error al actualizar cantidades: ' + err.message)
    }
  }

  // CÁLCULO DE CONJUNTOS / ENSAMBLES COMPLETOS LISTOS
  const calcularAvanceAcumulado = (nodoId, multiplicadorPadre = 1) => {
    const elemento = disenosFiltrados.find(d => d.ID === nodoId)
    if (!elemento) return { reqTotal: 0, listaTotal: 0 }

    const reqUnitaria = elemento.CantidadRequerida || 1
    const reqEfectiva = reqUnitaria * multiplicadorPadre
    const hijos = disenosFiltrados.filter(d => d.PadreID === nodoId)

    if (hijos.length === 0) {
      return {
        reqTotal: reqEfectiva,
        listaTotal: elemento.CantidadLista || 0
      }
    }

    let totalReqPiezas = 0
    let conjuntosPosibles = Infinity

    hijos.forEach(hijo => {
      const acum = calcularAvanceAcumulado(hijo.ID, reqEfectiva)
      totalReqPiezas += acum.reqTotal

      const reqPorPadre = hijo.CantidadRequerida || 1
      const conjuntosQueAporta = Math.floor((acum.listaTotal) / reqPorPadre)
      if (conjuntosQueAporta < conjuntosPosibles) {
        conjuntosPosibles = conjuntosQueAporta
      }
    })

    if (conjuntosPosibles === Infinity) conjuntosPosibles = 0

    return { 
      reqTotal: reqEfectiva, 
      listaTotal: conjuntosPosibles,
      piezasEfectivasReq: totalReqPiezas
    }
  }

  // Render para Explorador BOM y Visor 3D
  const renderizarFilasExplorador = (padreId = null, nivelProfundidad = 0) => {
    const nodos = disenosFiltrados.filter(d => {
      if (padreId === null) return !d.PadreID || d.TipoNivel === 'Ensamble'
      return d.PadreID === padreId
    })

    return nodos.map((item) => {
      const tieneHijos = disenosFiltrados.some(h => h.PadreID === item.ID)
      const estaAbierto = !!filasAbiertas[item.ID]

      return (
        <React.Fragment key={item.ID}>
          <tr style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: nivelProfundidad === 0 ? '#ffffff' : nivelProfundidad === 1 ? '#fdfdfd' : '#f8f9fa' }}>
            <td style={{ padding: '8px', paddingLeft: `${10 + nivelProfundidad * 18}px` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {tieneHijos ? (
                  <button onClick={() => toggleFila(item.ID)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', width: '16px', color: '#555' }}>
                    {estaAbierto ? '▼' : '▶'}
                  </button>
                ) : (
                  <span style={{ width: '16px', display: 'inline-block', textAlign: 'center', color: '#ccc' }}>•</span>
                )}
                
                <span style={{ 
                  fontSize: '10px', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold',
                  backgroundColor: item.TipoNivel === 'Ensamble' ? '#e3f2fd' : item.TipoNivel === 'Subensamble' ? '#fff3cd' : '#e8f5e9',
                  color: item.TipoNivel === 'Ensamble' ? '#0d47a1' : item.TipoNivel === 'Subensamble' ? '#856404' : '#1b5e20'
                }}>
                  {item.TipoNivel ? item.TipoNivel[0] : 'E'}
                </span>

                <span style={{ fontWeight: item.TipoNivel === 'Ensamble' ? 'bold' : 'normal', fontSize: '13px' }}>
                  {item.Nombre}
                </span>
              </div>
            </td>

            <td style={{ padding: '8px', textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                <button 
                  onClick={() => iniciarEdicion(item)} 
                  title="Editar elemento"
                  style={{ backgroundColor: '#ffc107', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                >
                  ✏️
                </button>

                {item.UrlGLB ? (
                  <button 
                    onClick={() => setModeloSeleccionado(item.UrlGLB)} 
                    style={{ 
                      backgroundColor: modeloSeleccionado === item.UrlGLB ? '#28a745' : '#007bff', 
                      color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '500' 
                    }}
                  >
                    {modeloSeleccionado === item.UrlGLB ? '✓' : '👁️ 3D'}
                  </button>
                ) : (
                  <span style={{ fontSize: '11px', color: '#ccc' }}>-</span>
                )}

                {item.UrlPDF && (
                  <a href={item.UrlPDF} target="_blank" rel="noreferrer" style={{ backgroundColor: '#dc3545', color: '#fff', textDecoration: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                    📄
                  </a>
                )}
              </div>
            </td>
          </tr>

          {estaAbierto && renderizarFilasExplorador(item.ID, nivelProfundidad + 1)}
        </React.Fragment>
      )
    })
  }

  // Render para Tabla de Control de Avance
  const renderizarFilasAvance = (padreId = null, nivelProfundidad = 0, multiplicadorAcumulado = 1) => {
    const nodos = disenosFiltrados.filter(d => {
      if (padreId === null) return !d.PadreID || d.TipoNivel === 'Ensamble'
      return d.PadreID === padreId
    })

    return nodos.map((item) => {
      const tieneHijos = disenosFiltrados.some(h => h.PadreID === item.ID)
      const estaAbierto = !!filasAbiertas[item.ID]

      const reqUnitaria = item.CantidadRequerida || 1
      const multiplicadorActual = multiplicadorAcumulado * reqUnitaria

      let reqTotal = reqUnitaria * multiplicadorAcumulado
      let listaTotal = item.CantidadLista || 0

      if (tieneHijos) {
        const acumulado = calcularAvanceAcumulado(item.ID, multiplicadorAcumulado)
        listaTotal = acumulado.listaTotal
      }

      const porcentaje = reqTotal > 0 ? Math.min(100, Math.round((listaTotal / reqTotal) * 100)) : 0
      const colorBarra = porcentaje === 100 ? '#28a745' : porcentaje > 0 ? '#ffc107' : '#dc3545'

      return (
        <React.Fragment key={item.ID}>
          <tr style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: nivelProfundidad === 0 ? '#ffffff' : nivelProfundidad === 1 ? '#fdfdfd' : '#f8f9fa' }}>
            <td style={{ padding: '10px', paddingLeft: `${10 + nivelProfundidad * 20}px` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {tieneHijos ? (
                  <button onClick={() => toggleFila(item.ID)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', width: '16px', color: '#555' }}>
                    {estaAbierto ? '▼' : '▶'}
                  </button>
                ) : (
                  <span style={{ width: '16px', display: 'inline-block', textAlign: 'center', color: '#ccc' }}>•</span>
                )}

                <span style={{ 
                  fontSize: '10px', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold',
                  backgroundColor: item.TipoNivel === 'Ensamble' ? '#e3f2fd' : item.TipoNivel === 'Subensamble' ? '#fff3cd' : '#e8f5e9',
                  color: item.TipoNivel === 'Ensamble' ? '#0d47a1' : item.TipoNivel === 'Subensamble' ? '#856404' : '#1b5e20'
                }}>
                  {item.TipoNivel}
                </span>

                <strong style={{ fontSize: '13px' }}>{item.Nombre}</strong>
              </div>
            </td>

            <td style={{ padding: '10px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <input 
                  type="number" 
                  min="1" 
                  defaultValue={reqUnitaria} 
                  onBlur={(e) => {
                    const val = parseInt(e.target.value, 10)
                    if (!isNaN(val) && val > 0 && val !== reqUnitaria) {
                      actualizarCantidades(item.ID, item.CantidadLista || 0, val)
                    }
                  }} 
                  style={{ width: '50px', padding: '3px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ced4da', fontWeight: 'bold' }}
                />
                {nivelProfundidad > 0 && (
                  <span style={{ fontSize: '11px', color: '#6c757d' }}>
                    (Total: <strong>{reqTotal}</strong>)
                  </span>
                )}
              </div>
            </td>

            <td style={{ padding: '10px', textAlign: 'center' }}>
              {tieneHijos ? (
                <span style={{ fontWeight: 'bold', color: '#0d47a1', background: '#e3f2fd', padding: '4px 12px', borderRadius: '4px', fontSize: '13px' }}>
                  {listaTotal}
                </span>
              ) : (
                <input 
                  type="number" 
                  min="0" 
                  max={reqTotal * 2}
                  defaultValue={item.CantidadLista || 0} 
                  onBlur={(e) => {
                    const val = parseInt(e.target.value, 10)
                    if (!isNaN(val) && val >= 0 && val !== (item.CantidadLista || 0)) {
                      actualizarCantidades(item.ID, val, reqUnitaria)
                    }
                  }} 
                  style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ced4da', fontWeight: 'bold' }}
                />
              )}
            </td>

            <td style={{ padding: '10px', width: '180px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, backgroundColor: '#e9ecef', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${porcentaje}%`, backgroundColor: colorBarra, height: '100%', transition: 'width 0.3s' }}></div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', width: '35px', textAlign: 'right' }}>{porcentaje}%</span>
              </div>
            </td>

            <td style={{ padding: '10px', textAlign: 'center' }}>
              <span style={{ 
                fontSize: '11px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold',
                backgroundColor: porcentaje === 100 ? '#d4edda' : porcentaje > 0 ? '#fff3cd' : '#f8d7da',
                color: porcentaje === 100 ? '#155724' : porcentaje > 0 ? '#856404' : '#721c24'
              }}>
                {porcentaje === 100 ? '✅ Completado' : porcentaje > 0 ? '⌛ En Proceso' : '🔴 Pendiente'}
              </span>
            </td>
          </tr>

          {estaAbierto && renderizarFilasAvance(item.ID, nivelProfundidad + 1, multiplicadorActual)}
        </React.Fragment>
      )
    })
  }

  // Resumen general del proyecto
  const ensamblesRaiz = disenosFiltrados.filter(d => !d.PadreID || d.TipoNivel === 'Ensamble')
  let totalRequeridoEnsamble = 0
  let totalListoEnsamble = 0

  ensamblesRaiz.forEach(e => {
    const req = e.CantidadRequerida || 1
    totalRequeridoEnsamble += req
    const acum = calcularAvanceAcumulado(e.ID, 1)
    totalListoEnsamble += acum.listaTotal
  })

  const PorcentajeGeneral = totalRequeridoEnsamble > 0 ? Math.round((totalListoEnsamble / totalRequeridoEnsamble) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
      
      {/* FILTRO SUPERIOR GENERAL */}
      {subVista !== 'nuevo' && (
        <div style={{ background: '#ffffff', padding: '12px 20px', borderRadius: '8px', border: '1px solid #e0e0e0', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ flex: '1', minWidth: '220px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '12px', display: 'block', marginBottom: '4px', color: '#495057' }}>📁 Proyecto Seleccionado:</label>
            <select value={proyectoFiltro} onChange={(e) => setProyectoFiltro(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '13px' }}>
              <option value="">-- Todos los Proyectos --</option>
              {proyectosUnicos.map((p, i) => (
                <option key={i} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '2', minWidth: '300px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '12px', display: 'block', marginBottom: '4px', color: '#495057' }}>🔎 Búsqueda de Pieza o Componente:</label>
            <input 
              type="text" 
              placeholder="Filtrar por nombre..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
              style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      )}

      {/* PESTAÑA 1: EXPLORADOR BOM + VISOR 3D */}
      {subVista === 'explorador' && (
        <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', gap: '20px', width: '100%', boxSizing: 'border-box', alignItems: 'start' }}>
          <div style={{ background: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0', boxSizing: 'border-box', height: '640px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ marginTop: 0, marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px', color: '#333' }}>
              📂 Estructura del Ensamble (BOM)
            </h4>
            <div style={{ overflowY: 'auto', maxHeight: '570px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: '12px' }}>
                    <th style={{ padding: '8px' }}>Nombre / Elemento</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {disenosFiltrados.length === 0 ? (
                    <tr><td colSpan="2" style={{ padding: '15px', textAlign: 'center', color: '#777', fontSize: '13px' }}>No hay elementos registrados.</td></tr>
                  ) : (
                    renderizarFilasExplorador()
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0', boxSizing: 'border-box', height: '640px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ marginTop: 0, marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px', color: '#333' }}>
              🧊 Visor de Modelo 3D
            </h4>
            <div style={{ width: '100%', height: '570px', position: 'relative' }}>
              {modeloSeleccionado ? (
                <GlbViewer key={modeloSeleccionado} modelUrl={modeloSeleccionado} />
              ) : (
                <div style={{ height: '570px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', border: '2px dashed #ddd', borderRadius: '8px', color: '#888', textAlign: 'center' }}>
                  <div>
                    <p style={{ fontSize: '15px', margin: '0 0 8px 0', fontWeight: 'bold' }}>📦 Inspección 3D</p>
                    <p style={{ fontSize: '13px', color: '#aaa', margin: 0 }}>Haz clic en "👁️ 3D" en cualquier pieza de la izquierda para cargarla.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: CONTROL DE AVANCE */}
      {subVista === 'avance' && (
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ background: '#f8f9fa', padding: '15px 20px', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#17a2b8' }}>📊 Avance General de Ensambles Completos</h3>
              <p style={{ margin: '4px 0 0 0', color: '#6c757d', fontSize: '13px' }}>
                Ensambles Terminados: <strong>{totalListoEnsamble}</strong> / {totalRequeridoEnsamble} requeridos
              </p>
            </div>
            
            <div style={{ minWidth: '220px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                <span>Progreso Total:</span>
                <span>{PorcentajeGeneral}%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#e9ecef', height: '16px', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${PorcentajeGeneral}%`, backgroundColor: PorcentajeGeneral === 100 ? '#28a745' : '#17a2b8', height: '100%', transition: 'width 0.4s ease' }}></div>
              </div>
            </div>
          </div>

          <h4 style={{ marginTop: 0, marginBottom: '12px', borderBottom: '2px solid #e0e0e0', paddingBottom: '8px', color: '#333' }}>
            🌳 Lista Jerárquica de Materiales y Fabricación (BOM)
          </h4>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: '13px' }}>
                  <th style={{ padding: '10px' }}>Elemento / Estructura</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Cant. Unit. (Total)</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Cant. Lista / Juegos</th>
                  <th style={{ padding: '10px' }}>Avance %</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {disenosFiltrados.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No hay elementos para mostrar.</td></tr>
                ) : (
                  renderizarFilasAvance()
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: FORMULARIO DE REGISTRO / EDICIÓN */}
      {subVista === 'nuevo' && (
        <div style={{ background: '#ffffff', padding: '25px', borderRadius: '8px', border: '1px solid #e0e0e0', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <h3 style={{ marginTop: 0, color: '#333', borderBottom: `2px solid ${elementoEditando ? '#ffc107' : '#28a745'}`, paddingBottom: '10px' }}>
            {elementoEditando ? '✏️ Modificar Componente / Pieza' : '➕ Registrar Nuevo Componente / Pieza'}
          </h3>
          
          <form onSubmit={manejarEnvio} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginTop: '15px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>Proyecto:*</label>
              <select value={proyectoForm} onChange={(e) => { setProyectoForm(e.target.value); setPadreID(''); }} required style={{ width: '100%', padding: '9px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="">-- Selecciona Proyecto --</option>
                {proyectosUnicos.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>Nivel de Estructura:*</label>
              <select value={tipoNivel} onChange={(e) => { setTipoNivel(e.target.value); setPadreID(''); }} style={{ width: '100%', padding: '9px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="Ensamble">📦 Ensamble General</option>
                <option value="Subensamble">🧩 Sub-ensamble</option>
                <option value="Pieza">⚙️ Pieza Individual</option>
              </select>
            </div>

            {(tipoNivel === 'Subensamble' || tipoNivel === 'Pieza') && (
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>Elemento Padre (Ensamble o Sub-ensamble):*</label>
                <select value={padreID} onChange={(e) => setPadreID(e.target.value)} required style={{ width: '100%', padding: '9px', borderRadius: '4px', border: '1px solid #ccc' }}>
                  <option value="">-- Pertenece a --</option>
                  {padresDisponibles.map(e => (
                    <option key={e.ID} value={e.ID}>[{e.TipoNivel}] {e.Nombre} ({e.Proyecto})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>Nombre del Elemento / Pieza:*</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej. Biela de Transmisión, Tapa Superior..." style={{ width: '100%', padding: '9px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>Cantidad Unitaria Requerida:*</label>
              <input type="number" min="1" value={cantidadRequerida} onChange={(e) => setCantidadRequerida(e.target.value)} required style={{ width: '100%', padding: '9px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>Archivo Modelo 3D (.GLB):</label>
              <input id="file-glb" type="file" accept=".glb,.gltf" onChange={(e) => setArchivoGlb(e.target.files[0])} style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>Plano / Documentación (.PDF):</label>
              <input id="file-pdf" type="file" accept=".pdf" onChange={(e) => setArchivoPdf(e.target.files[0])} style={{ width: '100%' }} />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '10px', display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={guardando} style={{ backgroundColor: elementoEditando ? '#ffc107' : '#28a745', color: elementoEditando ? '#000' : '##fff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>
                {guardando ? '⌛ Guardando y Subiendo Archivos...' : (elementoEditando ? '💾 Actualizar Elemento' : '💾 Guardar Elemento')}
              </button>
              <button type="button" onClick={() => { setElementoEditando(null); setPestanaIngenieria('explorador'); }} style={{ backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}