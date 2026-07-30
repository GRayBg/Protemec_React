import { useState } from 'react'

export default function GestionClientes({ clientes, ubicaciones, contactos, API_URL, recargarDatos }) {
  // Estado para alta de cliente
  const [nombreCliente, setNombreCliente] = useState('')
  const [rfc, setRfc] = useState('')

  // Estado para alta de contacto
  const [clienteContactoID, setClienteContactoID] = useState('')
  const [ubicacionContactoID, setUbicacionContactoID] = useState('')
  const [nombreContacto, setNombreContacto] = useState('')
  const [puesto, setPuesto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')

  const [guardandoCliente, setGuardandoCliente] = useState(false)
  const [guardandoContacto, setGuardandoContacto] = useState(false)

  // Filtrar ubicaciones según el cliente seleccionado para el contacto
  const ubicacionesDelCliente = ubicaciones.filter(
    u => String(u.ClienteID) === String(clienteContactoID)
  )

  const guardarCliente = async (e) => {
    e.preventDefault()
    setGuardandoCliente(true)
    try {
      const res = await fetch(`${API_URL}/api/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreCliente, rfc })
      })
      if (!res.ok) throw new Error('Error al registrar cliente')
      setNombreCliente(''); setRfc('')
      recargarDatos()
    } catch (err) {
      alert(err.message)
    } finally {
      setGuardandoCliente(false)
    }
  }

  const guardarContacto = async (e) => {
    e.preventDefault()
    if (!ubicacionContactoID) return alert('Debes seleccionar una ubicación para el contacto.')
    setGuardandoContacto(true)
    try {
      const res = await fetch(`${API_URL}/api/contactos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteID: clienteContactoID,
          ubicacionID: ubicacionContactoID,
          nombreContacto, puesto, telefono, email
        })
      })
      if (!res.ok) throw new Error('Error al registrar el contacto')
      setClienteContactoID(''); setUbicacionContactoID(''); setNombreContacto('')
      setPuesto(''); setTelefono(''); setEmail('')
      recargarDatos()
    } catch (err) {
      alert(err.message)
    } finally {
      setGuardandoContacto(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      {/* Formularios */}
      <div style={{ flex: '1', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Form 1: Alta Cliente */}
        <form onSubmit={guardarCliente} style={estilos.formulario}>
          <h3 style={{ marginTop: 0 }}>➕ Alta de Cliente</h3>
          <input type="text" placeholder="Nombre de Cliente / Empresa" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} required style={estilos.input} />
          <input type="text" placeholder="RFC / Tax ID" value={rfc} onChange={e => setRfc(e.target.value)} style={estilos.input} />
          <button type="submit" disabled={guardandoCliente} style={estilos.botonVerde}>
            {guardandoCliente ? 'Guardando...' : '💾 Registrar Cliente'}
          </button>
        </form>

        {/* Form 2: Alta Contacto */}
        <form onSubmit={guardarContacto} style={estilos.formulario}>
          <h3 style={{ marginTop: 0 }}>👤 Agregar Contacto a Cliente/Ubicación</h3>
          
          <select value={clienteContactoID} onChange={e => { setClienteContactoID(e.target.value); setUbicacionContactoID(''); }} required style={estilos.input}>
            <option value="">-- 1. Selecciona Cliente --</option>
            {clientes.map(c => <option key={c.ClienteID} value={c.ClienteID}>{c.NombreCliente}</option>)}
          </select>

          <select value={ubicacionContactoID} onChange={e => setUbicacionContactoID(e.target.value)} disabled={!clienteContactoID} required style={estilos.input}>
            <option value="">
              {!clienteContactoID ? '-- Primero selecciona un cliente --' : ubicacionesDelCliente.length === 0 ? '-- Sin ubicaciones registradas --' : '-- 2. Selecciona Ubicación --'}
            </option>
            {ubicacionesDelCliente.map(u => (
              <option key={u.UbicacionID} value={u.UbicacionID}>{u.NombreUbicacion}</option>
            ))}
          </select>

          <input type="text" placeholder="Nombre del Contacto" value={nombreContacto} onChange={e => setNombreContacto(e.target.value)} required style={estilos.input} />
          <input type="text" placeholder="Puesto / Área" value={puesto} onChange={e => setPuesto(e.target.value)} style={estilos.input} />
          <input type="text" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} style={estilos.input} />
          <input type="email" placeholder="Correo Electrónico" value={email} onChange={e => setEmail(e.target.value)} style={estilos.input} />

          <button type="submit" disabled={guardandoContacto} style={estilos.botonAzul}>
            {guardandoContacto ? 'Guardando...' : '💾 Registrar Contacto'}
          </button>
        </form>
      </div>

      {/* Tablas de Consulta */}
      <div style={{ flex: '2', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
        <div>
          <h3>🏢 Catálogo de Clientes</h3>
          <table style={estilos.tabla}>
            <thead>
              <tr style={estilos.encabezado}><th style={estilos.th}>ID</th><th style={estilos.th}>Cliente</th><th style={estilos.th}>RFC</th></tr>
            </thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c.ClienteID} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={estilos.td}>{c.ClienteID}</td>
                  <td style={estilos.td}><strong>{c.NombreCliente}</strong></td>
                  <td style={estilos.td}>{c.RFC_TaxID || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3>📇 Contactos Registrados</h3>
          <table style={estilos.tabla}>
            <thead>
              <tr style={estilos.encabezado}>
                <th style={estilos.th}>Cliente</th>
                <th style={estilos.th}>Ubicación</th>
                <th style={estilos.th}>Contacto</th>
                <th style={estilos.th}>Teléfono / Email</th>
              </tr>
            </thead>
            <tbody>
              {contactos.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '10px', textAlign: 'center', color: '#777' }}>No hay contactos asociados.</td></tr>
              ) : (
                contactos.map(ct => (
                  <tr key={ct.ContactoID} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={estilos.td}><strong>{ct.NombreCliente}</strong></td>
                    <td style={estilos.td}>{ct.NombreUbicacion}</td>
                    <td style={estilos.td}>{ct.NombreContacto} <small>({ct.Puesto || 'S/P'})</small></td>
                    <td style={estilos.td}>{ct.Telefono || '-'} / {ct.Email || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const estilos = {
  formulario: { backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e3e6f0' },
  input: { width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' },
  botonVerde: { backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
  botonAzul: { backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  encabezado: { backgroundColor: '#e9ecef', textAlign: 'left' },
  th: { padding: '8px' },
  td: { padding: '8px' }
}