import { useState } from 'react'

export default function GestionProyectos({
  proyectos = [],
  clientes = [],
  ubicaciones = [],
  API_URL,
  recargarDatos,
  mostrarToast
}) {
  const [idEditando, setIdEditando] = useState(null)
  const [nombreProyecto, setNombreProyecto] = useState('')
  const [proyectoIdExterno, setProyectoIdExterno] = useState('')
  const [clienteSeleccionadoID, setClienteSeleccionadoID] = useState('')
  const [ubicacionID, setUbicacionID] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estatus, setEstatus] = useState('Activo')
  const [guardando, setGuardando] = useState(false)

  const notificar = (msg, tipo = 'exito') => {
    if (mostrarToast) mostrarToast(msg, tipo)
  }

  const ubicacionesDelCliente = ubicaciones.filter(
    (u) => String(u.ClienteID) === String(clienteSeleccionadoID)
  )

  const iniciarEdicion = (p) => {
    setIdEditando(p.ProyectoID)
    setNombreProyecto(p.NombreProyecto || '')
    setProyectoIdExterno(p.ProyectoID_Externo || '')
    const ubicacionObj = ubicaciones.find((u) => String(u.UbicacionID) === String(p.UbicacionID))
    setClienteSeleccionadoID(p.ClienteID || ubicacionObj?.ClienteID || '')
    setUbicacionID(p.UbicacionID || '')
    setDescripcion(p.Descripcion || '')
    setEstatus(p.Estatus || 'Activo')
  }

  const cancelarEdicion = () => {
    setIdEditando(null)
    setNombreProyecto('')
    setProyectoIdExterno('')
    setClienteSeleccionadoID('')
    setUbicacionID('')
    setDescripcion('')
    setEstatus('Activo')
  }

  const guardarProyecto = async (e) => {
    e.preventDefault()
    if (!ubicacionID) return notificar('Selecciona una ubicación válida para el cliente', 'alerta')
    setGuardando(true)

    const url = idEditando ? `${API_URL}/api/proyectos/${idEditando}` : `${API_URL}/api/proyectos`
    const metodo = idEditando ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreProyecto,
          proyectoIdExterno,
          ubicacionID,
          descripcion,
          estatus
        })
      })
      if (!res.ok) throw new Error('Error al guardar el proyecto')

      notificar(idEditando ? `Proyecto #${idEditando} actualizado` : 'Nuevo proyecto registrado')
      cancelarEdicion()
      recargarDatos()
    } catch (err) {
      notificar(err.message, 'error')
    } finally {
      setGuardando(false)
    }
  }

  const estiloBadgeEstatus = (est) => {
    switch (est) {
      case 'Activo':
        return { bg: '#ecfdf5', color: '#065f46', dot: '#10b981' }
      case 'En Proceso':
        return { bg: '#fffbeb', color: '#92400e', dot: '#f59e0b' }
      case 'Concluido':
        return { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' }
      case 'Cancelado':
        return { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444' }
      default:
        return { bg: '#f1f5f9', color: '#475569', dot: '#64748b' }
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px', alignItems: 'start' }}>
      {/* FORMULARIO DE ALTA / EDICIÓN */}
      <form onSubmit={guardarProyecto} className="pro-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '15px' }}>
          {idEditando ? `✏️ Modificar Proyecto #${idEditando}` : '➕ Alta de Proyecto'}
        </h3>

        <div>
          <label className="pro-label">Folio / ID Externo (Cotización / OC)</label>
          <input
            type="text"
            placeholder="Ej. CDP002779-2"
            value={proyectoIdExterno}
            onChange={(e) => setProyectoIdExterno(e.target.value)}
            className="pro-input pro-mono"
          />
        </div>

        <div>
          <label className="pro-label">Nombre del Proyecto *</label>
          <input
            type="text"
            placeholder="Ej. PLATO DE VACÍO FRONT EAR..."
            value={nombreProyecto}
            onChange={(e) => setNombreProyecto(e.target.value)}
            required
            className="pro-input"
          />
        </div>

        <div>
          <label className="pro-label">1. Selecciona Cliente *</label>
          <select
            value={clienteSeleccionadoID}
            onChange={(e) => {
              setClienteSeleccionadoID(e.target.value)
              setUbicacionID('')
            }}
            required
            className="pro-select"
          >
            <option value="">-- Seleccionar Cliente --</option>
            {clientes.map((c) => (
              <option key={c.ClienteID} value={c.ClienteID}>{c.NombreCliente}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="pro-label">2. Selecciona Planta / Ubicación *</label>
          <select
            value={ubicacionID}
            onChange={(e) => setUbicacionID(e.target.value)}
            disabled={!clienteSeleccionadoID}
            required
            className="pro-select"
          >
            <option value="">
              {!clienteSeleccionadoID
                ? 'Primero elige un cliente'
                : ubicacionesDelCliente.length === 0
                  ? 'Sin plantas registradas'
                  : '-- Seleccionar Planta --'}
            </option>
            {ubicacionesDelCliente.map((u) => (
              <option key={u.UbicacionID} value={u.UbicacionID}>
                {u.NombreUbicacion} {u.Ciudad ? `(${u.Ciudad})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="pro-label">Estatus Operativo</label>
          <select value={estatus} onChange={(e) => setEstatus(e.target.value)} className="pro-select">
            <option value="Activo">🟢 Activo</option>
            <option value="En Proceso">🟡 En Proceso</option>
            <option value="Concluido">🔵 Concluido</option>
            <option value="Cancelado">🔴 Cancelado</option>
          </select>
        </div>

        <div>
          <label className="pro-label">Alcance / Notas Técnicas</label>
          <textarea
            placeholder="Observaciones o entregables del proyecto..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="pro-textarea"
            style={{ height: '72px', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {idEditando && (
            <button type="button" onClick={cancelarEdicion} className="pro-btn pro-btn-secondary" style={{ flex: 1 }}>
              Cancelar
            </button>
          )}
          <button type="submit" disabled={guardando} className="pro-btn pro-btn-primary" style={{ flex: 2 }}>
            {guardando ? 'Guardando...' : idEditando ? 'Actualizar Proyecto' : 'Registrar Proyecto'}
          </button>
        </div>
      </form>

      {/* TABLA DE PROYECTOS */}
      <div className="pro-table-container">
        <table className="pro-table">
          <thead>
            <tr>
              <th style={{ width: '65px', textAlign: 'center' }}>ID</th>
              <th>Folio Externo</th>
              <th>Nombre del Proyecto</th>
              <th>Cliente y Planta</th>
              <th style={{ textAlign: 'center' }}>Estatus</th>
              <th style={{ textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {proyectos.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#86868b' }}>
                  No hay proyectos registrados.
                </td>
              </tr>
            ) : (
              proyectos.map((p) => {
                const badge = estiloBadgeEstatus(p.Estatus || 'Activo')
                return (
                  <tr key={p.ProyectoID}>
                    <td className="pro-mono" style={{ textAlign: 'center', fontWeight: 700, color: '#86868b' }}>
                      #{p.ProyectoID}
                    </td>
                    <td className="pro-mono" style={{ color: '#0071e3', fontWeight: 700 }}>
                      {p.ProyectoID_Externo || '—'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.NombreProyecto}</div>
                      {p.Descripcion && (
                        <div style={{ fontSize: '11.5px', color: '#86868b' }}>{p.Descripcion}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.NombreCliente || '—'}</div>
                      <div style={{ fontSize: '11.5px', color: '#515154' }}>📍 {p.NombreUbicacion || '—'}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="pro-badge" style={{ backgroundColor: badge.bg, color: badge.color }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: badge.dot }} />
                        {p.Estatus || 'Activo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => iniciarEdicion(p)} className="pro-btn pro-btn-secondary pro-btn-sm">
                        Editar
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}