import { useState } from 'react'

export default function GestionProyectos({ proyectos, clientes, ubicaciones, API_URL, recargarDatos }) {
  const [idEditando, setIdEditando] = useState(null)
  const [nombreProyecto, setNombreProyecto] = useState('')
  const [proyectoIdExterno, setProyectoIdExterno] = useState('')
  const [clienteSeleccionadoID, setClienteSeleccionadoID] = useState('')
  const [ubicacionID, setUbicacionID] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estatus, setEstatus] = useState('Activo')
  const [guardando, setGuardando] = useState(false)

  // Filtramos solo las ubicaciones pertenecientes al cliente seleccionado
  const ubicacionesDelCliente = ubicaciones.filter(
    u => String(u.ClienteID) === String(clienteSeleccionadoID)
  )

  const iniciarEdicion = (p) => {
    setIdEditando(p.ProyectoID)
    setNombreProyecto(p.NombreProyecto || '')
    setProyectoIdExterno(p.ProyectoID_Externo || '')
    
    // Buscamos el ClienteID a través de la ubicación si no viene directo en el proyecto
    const ubicacionObj = ubicaciones.find(u => String(u.UbicacionID) === String(p.UbicacionID))
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
    if (!ubicacionID) return alert('Debes seleccionar una ubicación válida para el cliente.')
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
      
      cancelarEdicion()
      recargarDatos()
      alert(idEditando ? '¡Proyecto actualizado con éxito!' : '¡Proyecto registrado con éxito!')
    } catch (err) {
      alert(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      
      {/* FORMULARIO DE ALTA / EDICIÓN */}
      <form onSubmit={guardarProyecto} style={estilos.formulario}>
        <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '15px' }}>
          {idEditando ? `✏️ Modificar Proyecto #${idEditando}` : '➕ Alta de Proyecto'}
        </h3>
        
        <label style={estilos.label}>ID Proyecto Externo (Folio):</label>
        <input 
          type="text" 
          placeholder="Ej. CDP002779-2" 
          value={proyectoIdExterno} 
          onChange={e => setProyectoIdExterno(e.target.value)} 
          style={estilos.input} 
        />

        <label style={estilos.label}>Nombre del Proyecto:</label>
        <input 
          type="text" 
          placeholder="Ej. PLATO DE VACIO FRONT EAR..." 
          value={nombreProyecto} 
          onChange={e => setNombreProyecto(e.target.value)} 
          required 
          style={estilos.input} 
        />

        {/* 1. Selección de Cliente */}
        <label style={estilos.label}>1. Selecciona Cliente:</label>
        <select 
          value={clienteSeleccionadoID} 
          onChange={e => {
            setClienteSeleccionadoID(e.target.value)
            setUbicacionID('') // Resetear ubicación al cambiar cliente
          }} 
          required 
          style={estilos.input}
        >
          <option value="">-- Seleccionar Cliente --</option>
          {clientes.map(c => (
            <option key={c.ClienteID} value={c.ClienteID}>{c.NombreCliente}</option>
          ))}
        </select>

        {/* 2. Selección de Ubicación */}
        <label style={estilos.label}>2. Selecciona Ubicación / Planta:</label>
        <select 
          value={ubicacionID} 
          onChange={e => setUbicacionID(e.target.value)} 
          disabled={!clienteSeleccionadoID} 
          required 
          style={estilos.input}
        >
          <option value="">
            {!clienteSeleccionadoID 
              ? '-- Primero elige un cliente --' 
              : ubicacionesDelCliente.length === 0 
                ? '-- Sin ubicaciones para este cliente --' 
                : '-- Selecciona Ubicación --'}
          </option>
          {ubicacionesDelCliente.map(u => (
            <option key={u.UbicacionID} value={u.UbicacionID}>
              {u.NombreUbicacion} {u.Ciudad ? `(${u.Ciudad})` : ''}
            </option>
          ))}
        </select>

        <label style={estilos.label}>Estatus:</label>
        <select value={estatus} onChange={e => setEstatus(e.target.value)} style={estilos.input}>
          <option value="Activo">🟢 Activo</option>
          <option value="En Proceso">🟡 En Proceso</option>
          <option value="Concluido">🔵 Concluido</option>
          <option value="Cancelado">🔴 Cancelado</option>
        </select>

        <label style={estilos.label}>Descripción / Notas:</label>
        <textarea 
          placeholder="Descripción u observaciones del proyecto..." 
          value={descripcion} 
          onChange={e => setDescripcion(e.target.value)} 
          style={{ ...estilos.input, height: '60px', resize: 'vertical' }} 
        />

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" disabled={guardando} style={idEditando ? estilos.botonActualizar : estilos.botonGuardar}>
            {guardando ? 'Guardando...' : idEditando ? '💾 Actualizar Proyecto' : '💾 Registrar Proyecto'}
          </button>
          
          {idEditando && (
            <button type="button" onClick={cancelarEdicion} style={estilos.botonCancelar}>
              ❌ Cancelar
            </button>
          )}
        </div>
      </form>

      {/* CATÁLOGO / TABLA DE PROYECTOS */}
      <div style={{ flex: '2', minWidth: '500px', backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '15px' }}>📁 Catálogo de Proyectos</h3>
        <table style={estilos.tabla}>
          <thead>
            <tr style={estilos.encabezado}>
              <th style={estilos.th}>ID</th>
              <th style={estilos.th}>Folio / ID Ext.</th>
              <th style={estilos.th}>Proyecto</th>
              <th style={estilos.th}>Cliente / Ubicación</th>
              <th style={estilos.th}>Estatus</th>
              <th style={estilos.th}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {proyectos.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No hay proyectos registrados.</td></tr>
            ) : (
              proyectos.map(p => (
                <tr key={p.ProyectoID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ ...estilos.td, fontFamily: 'Consolas, monospace', fontWeight: '700' }}>#{p.ProyectoID}</td>
                  <td style={{ ...estilos.td, fontFamily: 'Consolas, monospace', color: '#2563eb', fontWeight: '600' }}>{p.ProyectoID_Externo || '—'}</td>
                  <td style={{ ...estilos.td, color: '#0f172a', fontWeight: '600' }}>{p.NombreProyecto}</td>
                  <td style={estilos.td}>
                    <div style={{ fontWeight: '700', color: '#1e293b' }}>{p.NombreCliente || '—'}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>📍 {p.NombreUbicacion || '—'}</div>
                  </td>
                  <td style={estilos.td}>
                    <span style={{ 
                      padding: '3px 8px', 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      fontWeight: 'bold',
                      backgroundColor: p.Estatus === 'Activo' ? '#d1fae5' : '#f1f5f9',
                      color: p.Estatus === 'Activo' ? '#065f46' : '#475569'
                    }}>
                      {p.Estatus || 'Activo'}
                    </span>
                  </td>
                  <td style={estilos.td}>
                    <button 
                      onClick={() => iniciarEdicion(p)} 
                      style={estilos.botonAccionEditar}
                      title="Editar Proyecto"
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const estilos = {
  formulario: { flex: '1', minWidth: '320px', backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  label: { fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'uppercase' },
  input: { width: '100%', padding: '9px 10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', backgroundColor: '#fff', color: '#1e293b' },
  botonGuardar: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%', fontSize: '13px' },
  botonActualizar: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flex: '2', fontSize: '13px' },
  botonCancelar: { backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flex: '1', fontSize: '13px' },
  botonAccionEditar: { backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#1e293b', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '11px' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  encabezado: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' },
  th: { padding: '12px 10px', color: '#334155', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' },
  td: { padding: '12px 10px', verticalAlign: 'middle', color: '#1e293b' }
}