import { useState } from 'react'

export default function GestionUbicaciones({ ubicaciones, clientes, API_URL, recargarDatos }) {
  const [clienteID, setClienteID] = useState('')
  const [nombreUbicacion, setNombreUbicacion] = useState('')
  const [direccion, setDireccion] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [guardando, setGuardando] = useState(false)

  const guardarUbicacion = async (e) => {
    e.preventDefault()
    if (!clienteID) return alert('Debes seleccionar un cliente.')
    setGuardando(true)

    try {
      const res = await fetch(`${API_URL}/api/ubicaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteID, nombreUbicacion, direccion, ciudad })
      })
      if (!res.ok) throw new Error('Error al registrar la ubicación')
      setClienteID('')
      setNombreUbicacion('')
      setDireccion('')
      setCiudad('')
      recargarDatos()
    } catch (err) {
      alert(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      <form onSubmit={guardarUbicacion} style={estilos.formulario}>
        <h3 style={{ marginTop: 0 }}>➕ Alta de Ubicación / Sucursal</h3>
        
        <label style={estilos.label}>Cliente:</label>
        <select value={clienteID} onChange={e => setClienteID(e.target.value)} required style={estilos.input}>
          <option value="">-- Selecciona el Cliente --</option>
          {clientes.map(c => (
            <option key={c.ClienteID} value={c.ClienteID}>{c.NombreCliente}</option>
          ))}
        </select>

        <label style={estilos.label}>Nombre Ubicación / Planta:</label>
        <input 
          type="text" 
          placeholder="Ej. Planta Norte, Bodega Puebla, San José" 
          value={nombreUbicacion} 
          onChange={e => setNombreUbicacion(e.target.value)} 
          required 
          style={estilos.input} 
        />
        
        <label style={estilos.label}>Dirección (Opcional):</label>
        <input 
          type="text" 
          placeholder="Ej. Av. Industrial #123" 
          value={direccion} 
          onChange={e => setDireccion(e.target.value)} 
          style={estilos.input} 
        />
        
        <label style={estilos.label}>Ciudad / Estado (Opcional):</label>
        <input 
          type="text" 
          placeholder="Ej. Puebla, CDMX, Queretaro" 
          value={ciudad} 
          onChange={e => setCiudad(e.target.value)} 
          style={estilos.input} 
        />

        <button type="submit" disabled={guardando} style={estilos.botonGuardar}>
          {guardando ? 'Guardando...' : '💾 Registrar Ubicación'}
        </button>
      </form>

      <div style={{ flex: '2', minWidth: '400px' }}>
        <h3>📍 Catálogo de Ubicaciones</h3>
        <table style={estilos.tabla}>
          <thead>
            <tr style={estilos.encabezado}>
              <th style={estilos.th}>ID</th>
              <th style={estilos.th}>Cliente</th>
              <th style={estilos.th}>Ubicación / Planta</th>
              <th style={estilos.th}>Ciudad</th>
            </tr>
          </thead>
          <tbody>
            {ubicaciones.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: '#777' }}>No hay ubicaciones registradas.</td></tr>
            ) : (
              ubicaciones.map(u => (
                <tr key={u.UbicacionID} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={estilos.td}>{u.UbicacionID}</td>
                  <td style={estilos.td}><strong>{u.NombreCliente}</strong></td>
                  <td style={estilos.td}>{u.NombreUbicacion}</td>
                  <td style={estilos.td}>{u.Ciudad || '-'}</td>
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
  botonGuardar: { backgroundColor: '#17a2b8', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  encabezado: { backgroundColor: '#e9ecef', textAlign: 'left' },
  th: { padding: '10px' },
  td: { padding: '10px' }
}