import { useState } from 'react'

export default function GestionProyectos({ proyectos, clientes, ubicaciones, API_URL, recargarDatos }) {
  const [nombreProyecto, setNombreProyecto] = useState('')
  const [clienteSeleccionadoID, setClienteSeleccionadoID] = useState('')
  const [ubicacionID, setUbicacionID] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Filtramos solo las ubicaciones pertenencientes al cliente seleccionado
  const ubicacionesDelCliente = ubicaciones.filter(
    u => String(u.ClienteID) === String(clienteSeleccionadoID)
  )

  const guardarProyecto = async (e) => {
    e.preventDefault()
    if (!ubicacionID) return alert('Debes seleccionar una ubicación válida para el cliente.')
    setGuardando(true)

    try {
      const res = await fetch(`${API_URL}/api/proyectos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreProyecto, ubicacionID, descripcion })
      })
      if (!res.ok) throw new Error('Error al registrar el proyecto')
      setNombreProyecto('')
      setClienteSeleccionadoID('')
      setUbicacionID('')
      setDescripcion('')
      recargarDatos()
    } catch (err) {
      alert(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      <form onSubmit={guardarProyecto} style={estilos.formulario}>
        <h3 style={{ marginTop: 0 }}>➕ Alta de Proyecto</h3>
        
        <label style={estilos.label}>Nombre del Proyecto:</label>
        <input 
          type="text" 
          placeholder="Ej. Troqueladora 01 / Moldes Lote A" 
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

        {/* 2. Selección de Ubicación (Filtrada automáticamente) */}
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

        <label style={estilos.label}>Descripción / Notas:</label>
        <textarea 
          placeholder="Descripción u observaciones del proyecto..." 
          value={descripcion} 
          onChange={e => setDescripcion(e.target.value)} 
          style={{ ...estilos.input, height: '60px' }} 
        />

        <button type="submit" disabled={guardando} style={estilos.botonGuardar}>
          {guardando ? 'Guardando...' : '💾 Registrar Proyecto'}
        </button>
      </form>

      <div style={{ flex: '2', minWidth: '400px' }}>
        <h3>📁 Catálogo de Proyectos</h3>
        <table style={estilos.tabla}>
          <thead>
            <tr style={estilos.encabezado}>
              <th style={estilos.th}>ID</th>
              <th style={estilos.th}>Proyecto</th>
              <th style={estilos.th}>Cliente</th>
              <th style={estilos.th}>Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {proyectos.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: '#777' }}>No hay proyectos registrados.</td></tr>
            ) : (
              proyectos.map(p => (
                <tr key={p.ProyectoID} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={estilos.td}>{p.ProyectoID}</td>
                  <td style={estilos.td}><strong>{p.NombreProyecto}</strong></td>
                  <td style={estilos.td}>{p.NombreCliente}</td>
                  <td style={estilos.td}>{p.NombreUbicacion}</td>
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
  formulario: { flex: '1', minWidth: '300px', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e3e6f0' },
  label: { fontSize: '12px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '4px' },
  input: { width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '13px' },
  botonGuardar: { backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  encabezado: { backgroundColor: '#e9ecef', textAlign: 'left' },
  th: { padding: '10px' },
  td: { padding: '10px' }
}