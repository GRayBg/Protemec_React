import React, { useState } from 'react'
import GlbViewer from './GlbViewer'

export default function GestionIngenieria({ disenos, proyectosUnicos, API_URL, recargarDatos }) {
  // Pestañas internas: 'explorador', 'avance', 'nuevo'
  const [subPestana, setSubPestana] = useState('explorador')

  // Filtros y Búsqueda
  const [proyectoFiltro, setProyectoFiltro] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Formulario
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

  // Filtrado de elementos por proyecto y texto
  const disenosFiltrados = disenos.filter(d => {
    const coincideProyecto = proyectoFiltro ? d.Proyecto === proyectoFiltro : true
    const coincideTexto = d.Nombre.toLowerCase().includes(busqueda.toLowerCase())
    return coincideProyecto && coincideTexto
  })

  // Padres disponibles flexibles (Permite sub-ensambles dentro de sub-ensambles y piezas en cualquier nivel superior)
  const padresDisponiblesParaSubensamble = disenos.filter(
    d => (d.TipoNivel === 'Ensamble' || d.TipoNivel === 'Subensamble') && (!proyectoForm || d.Proyecto === proyectoForm)
  )

  const padresDisponiblesParaPieza = disenos.filter(
    d => (d.TipoNivel === 'Ensamble' || d.TipoNivel === 'Subensamble') && (!proyectoForm || d.Proyecto === proyectoForm)
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

    try {
      const res = await fetch(`${API_URL}/api/ingenieria`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Error al guardar en la base de datos')

      setNombre('')
      setPadreID('')
      setCantidadRequerida(1)
      setArchivoGlb(null)
      setArchivoPdf(null)

      const inputGlb = document.getElementById('file-glb')
      const inputPdf = document.getElementById('file-pdf')
      if (inputGlb) inputGlb.value = ''
      if (inputPdf) inputPdf.value = ''

      await recargarDatos()
      alert('¡Registro guardado con éxito!')
      setSubPestana('explorador')
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  // Actualizar cantidades (Lista y/o Requerida) en tiempo real en Azure SQL
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

  // Función auxiliar para calcular totales acumulados de hijos/piezas
  const calcularAvanceAcumulado = (nodoId) => {
    const hijos = disenosFiltrados.filter(d => d.PadreID === nodoId)
    
    // Si no tiene hijos (es una pieza), devuelve sus propios valores
    if (hijos.length === 0) {
      const elemento = disenosFiltrados.find(d => d.ID === nodoId)
      return {
        req: elemento?.CantidadRequerida || 1,
        lista: elemento?.CantidadLista || 0
      }
    }

    // Si tiene hijos (es Subensamble o Ensamble), acumula los valores de sus descendientes
    let totalReq = 0
    let totalLista = 0

    hijos.forEach(hijo => {
      const acumulado = calcularAvanceAcumulado(hijo.ID)
      totalReq += acumulado.req
      totalLista += acumulado.lista
    })

    return { req: totalReq, lista: totalLista }
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
                  {item.TipoNivel[0]}
                </span>

                <span style={{ fontWeight: item.TipoNivel === 'Ensamble' ? 'bold' : 'normal', fontSize: '13px' }}>
                  {item.Nombre}
                </span>
              </div>
            </td>

            <td style={{ padding: '8px', textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
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

  // Render para Tabla de Control de Avance con edición doble (Requerida y Lista)
  const renderizarFilasAvance = (padreId = null, nivelProfundidad = 0) => {
    const nodos = disenosFiltrados.filter(d => {
      if (padreId === null) return !d.PadreID || d.TipoNivel === 'Ensamble'
      return d.PadreID === padreId
    })

    return nodos.map((item) => {
      const tieneHijos = disenosFiltrados.some(h => h.PadreID === item.ID)
      const estaAbierto = !!filasAbiertas[item.ID]

      // Cálculo dinámico según si es hoja (Pieza) o contenedor (Subensamble/Ensamble)
      let req = item.CantidadRequerida || 1
      let lista = item.CantidadLista || 0

      if (tieneHijos) {
        const acumulado = calcularAvanceAcumulado(item.ID)
        req = acumulado.req
        lista = acumulado.lista
      }

      const porcentaje = req > 0 ? Math.min(100, Math.round((lista / req) * 100)) : 0
      const colorBarra = porcentaje === 100 ? '#28a745' : porcentaje > 0 ? '#ffc107' : '#dc3545'

      return (
        <React.Fragment key={item.ID}>
          <tr style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: nivelProfundidad === 0 ? '#ffffff' : nivelProfundidad === 1 ? '#fdfdfd' : '#f8f9fa' }}>
            {/* Elemento / Nivel */}
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

            {/* Cantidad Requerida: Editable en Piezas, Calculada en Ensambles/Sub-ensambles */}
            <td style={{ padding: '10px', textAlign: 'center' }}>
              {tieneHijos ? (
                <span style={{ fontWeight: 'bold', color: '#495057', background: '#e9ecef', padding: '4px 12px', borderRadius: '4px', fontSize: '13px' }}>
                  {req}
                </span>
              ) : (
                <input 
                  type="number" 
                  min="1" 
                  defaultValue={req} 
                  onBlur={(e) => {
                    const val = parseInt(e.target.value, 10)
                    if (!isNaN(val) && val > 0 && val !== req) {
                      actualizarCantidades(item.ID, lista, val)
                    }
                  }}
                  style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ced4da', fontWeight: 'bold' }}
                />
              )}
            </td>

            {/* Cantidad Lista: Editable en Piezas, Calculada en Ensambles/Sub-ensambles */}
            <td style={{ padding: '10px', textAlign: 'center' }}>
              {tieneHijos ? (
                <span style={{ fontWeight: 'bold', color: '#495057', background: '#e9ecef', padding: '4px 12px', borderRadius: '4px', fontSize: '13px' }}>
                  {lista}
                </span>
              ) : (
                <input 
                  type="number" 
                  min="0" 
                  defaultValue={lista} 
                  onBlur={(e) => {
                    const val = parseInt(e.target.value, 10)
                    if (!isNaN(val) && val >= 0 && val !== lista) {
                      actualizarCantidades(item.ID, val, req)
                    }
                  }}
                  style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ced4da', fontWeight: 'bold' }}
                />
              )}
            </td>

            {/* Barra de Progreso % */}
            <td style={{ padding: '10px', width: '180px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, backgroundColor: '#e9ecef', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${porcentaje}%`, backgroundColor: colorBarra, height: '100%', transition: 'width 0.3s' }}></div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', width: '35px', textAlign: 'right' }}>{porcentaje}%</span>
              </div>
            </td>

            {/* Estatus */}
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

          {estaAbierto && renderizarFilasAvance(item.ID, nivelProfundidad + 1)}
        </React.Fragment>
      )
    })
  }

  // Resumen general del proyecto considerando elementos raíz
  const ensamblesRaiz = disenosFiltrados.filter(d => !d.PadreID || d.TipoNivel === 'Ensamble')
  let totalRequerido = 0
  let totalListo = 0

  ensamblesRaiz.forEach(e => {
    const acum = calcularAvanceAcumulado(e.ID)
    totalRequerido += acum.req
    totalListo += acum.lista
  })

  const PorcentajeGeneral = totalRequerido > 0 ? Math.round((totalListo / totalRequerido) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
      
      {/* BARRA DE NAVEGACIÓN INTERNA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setSubPestana('explorador')}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
              backgroundColor: subPestana === 'explorador' ? '#007bff' : '#e9ecef',
              color: subPestana === 'explorador' ? '#ffffff' : '#495057'
            }}
          >
            🔍 Explorador BOM & Visor 3D
          </button>

          <button 
            onClick={() => setSubPestana('avance')}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
              backgroundColor: subPestana === 'avance' ? '#17a2b8' : '#e9ecef',
              color: subPestana === 'avance' ? '#ffffff' : '#495057'
            }}
          >
            📊 Control de Avance de Fabricación
          </button>
          
          <button 
            onClick={() => setSubPestana('nuevo')}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
              backgroundColor: subPestana === 'nuevo' ? '#28a745' : '#e9ecef',
              color: subPestana === 'nuevo' ? '#ffffff' : '#495057'
            }}
          >
            ➕ Registrar Nueva Pieza / Sub-ensamble
          </button>
        </div>
      </div>

      {/* FILTRO SUPERIOR GENERAL */}
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

      {/* PESTAÑA 1: EXPLORADOR BOM + VISOR 3D */}
      {subPestana === 'explorador' && (
        <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', gap: '20px', width: '100%', boxSizing: 'border-box', alignItems: 'start' }}>
          
          <div style={{ background: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0', boxSizing: 'border-box', height: '620px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ marginTop: 0, marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px', color: '#333' }}>
              📂 Estructura del Ensamble (BOM)
            </h4>
            <div style={{ overflowY: 'auto', maxHeight: '550px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: '12px' }}>
                    <th style={{ padding: '8px' }}>Nombre / Elemento</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Ver</th>
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

          <div style={{ background: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0', boxSizing: 'border-box', height: '620px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ marginTop: 0, marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px', color: '#333' }}>
              🧊 Visor de Modelo 3D
            </h4>
            <div style={{ width: '100%', height: '550px', position: 'relative' }}>
              {modeloSeleccionado ? (
                <GlbViewer key={modeloSeleccionado} modelUrl={modeloSeleccionado} />
              ) : (
                <div style={{ height: '550px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', border: '2px dashed #ddd', borderRadius: '8px', color: '#888', textAlign: 'center' }}>
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
      {subPestana === 'avance' && (
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0', width: '100%', boxSizing: 'border-box' }}>
          
          {/* Tarjeta de Resumen General */}
          <div style={{ background: '#f8f9fa', padding: '15px 20px', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#17a2b8' }}>📊 Avance General del Proyecto</h3>
              <p style={{ margin: '4px 0 0 0', color: '#6c757d', fontSize: '13px' }}>
                Piezas Listas: <strong>{totalListo}</strong> / {totalRequerido} requeridas
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
            🌳 Lista Jerárquica de Materiales y Fabricación
          </h4>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: '13px' }}>
                  <th style={{ padding: '10px' }}>Elemento / Estructura</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Cant. Req.</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Cant. Lista</th>
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
          <p style={{ fontSize: '12px', color: '#888', marginTop: '12px', fontStyle: 'italic' }}>
            💡 Nota: Modifica la "Cant. Req." o "Cant. Lista" únicamente en las piezas individuales. Los ensambles y sub-ensambles actualizarán su progreso acumulado automáticamente.
          </p>
        </div>
      )}

      {/* PESTAÑA 3: FORMULARIO DE CAPTURA */}
      {subPestana === 'nuevo' && (
        <div style={{ background: '#ffffff', padding: '25px', borderRadius: '8px', border: '1px solid #e0e0e0', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <h3 style={{ marginTop: 0, color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>
            ➕ Registrar Nuevo Componente / Pieza
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

            {tipoNivel === 'Subensamble' && (
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>Elemento Padre (Ensamble o Sub-ensamble):*</label>
                <select value={padreID} onChange={(e) => setPadreID(e.target.value)} required style={{ width: '100%', padding: '9px', borderRadius: '4px', border: '1px solid #ccc' }}>
                  <option value="">-- Pertenece a --</option>
                  {padresDisponiblesParaSubensamble.map(e => (
                    <option key={e.ID} value={e.ID}>[{e.TipoNivel}] {e.Nombre} ({e.Proyecto})</option>
                  ))}
                </select>
              </div>
            )}

            {tipoNivel === 'Pieza' && (
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>Elemento Padre (Ensamble o Sub-ensamble):*</label>
                <select value={padreID} onChange={(e) => setPadreID(e.target.value)} required style={{ width: '100%', padding: '9px', borderRadius: '4px', border: '1px solid #ccc' }}>
                  <option value="">-- Pertenece a --</option>
                  {padresDisponiblesParaPieza.map(s => (
                    <option key={s.ID} value={s.ID}>[{s.TipoNivel}] {s.Nombre} ({s.Proyecto})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>Nombre del Elemento / Pieza:*</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej. Biela de Transmisión, Tapa Superior..." style={{ width: '100%', padding: '9px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>Cantidad Requerida:*</label>
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
              <button type="submit" disabled={guardando} style={{ backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>
                {guardando ? '⌛ Guardando y Subiendo Archivos...' : '💾 Guardar Elemento'}
              </button>
              <button type="button" onClick={() => setSubPestana('explorador')} style={{ backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}