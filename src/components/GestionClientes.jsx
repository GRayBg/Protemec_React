import { useState } from 'react'

export default function GestionClientes({ clientes, ubicaciones, contactos, API_URL, recargarDatos }) {
  const [subPestana, setSubPestana] = useState('clientes')

  // Estado para alta de cliente
  const [nombreCliente, setNombreCliente] = useState('')
  const [rfc, setRfc] = useState('')
  const [guardandoCliente, setGuardandoCliente] = useState(false)

  // Estado para alta de ubicación
  const [clienteUbicacionID, setClienteUbicacionID] = useState('')
  const [nombreUbicacion, setNombreUbicacion] = useState('')
  const [direccion, setDireccion] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [guardandoUbicacion, setGuardandoUbicacion] = useState(false)

  // Estado para alta de contacto
  const [clienteContactoID, setClienteContactoID] = useState('')
  const [ubicacionContactoID, setUbicacionContactoID] = useState('')
  const [nombreContacto, setNombreContacto] = useState('')
  const [puesto, setPuesto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [guardandoContacto, setGuardandoContacto] = useState(false)

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
      alert('¡Cliente registrado con éxito!')
    } catch (err) {
      alert(err.message)
    } finally {
      setGuardandoCliente(false)
    }
  }

  const guardarUbicacion = async (e) => {
    e.preventDefault()
    if (!clienteUbicacionID) return alert('Debes seleccionar un cliente.')
    setGuardandoUbicacion(true)
    try {
      const res = await fetch(`${API_URL}/api/ubicaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteID: clienteUbicacionID,
          nombreUbicacion,
          direccion,
          ciudad
        })
      })
      if (!res.ok) throw new Error('Error al registrar la ubicación')
      setClienteUbicacionID(''); setNombreUbicacion(''); setDireccion(''); setCiudad('')
      recargarDatos()
      alert('¡Ubicación registrada con éxito!')
    } catch (err) {
      alert(err.message)
    } finally {
      setGuardandoUbicacion(false)
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
      alert('¡Contacto registrado con éxito!')
    } catch (err) {
      alert(err.message)
    } finally {
      setGuardandoContacto(false)
    }
  }

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      
      {/* PESTAÑAS DE NAVEGACIÓN SUPERIOR */}
      <div style={estilos.contenedorTabs}>
        <button onClick={() => setSubPestana('clientes')} style={estilos.tabBoton(subPestana === 'clientes')}>
          🏢 Catálogo de Clientes ({clientes.length})
        </button>
        <button onClick={() => setSubPestana('ubicaciones')} style={estilos.tabBoton(subPestana === 'ubicaciones')}>
          📍 Catálogo de Ubicaciones ({ubicaciones.length})
        </button>
        <button onClick={() => setSubPestana('contactos')} style={estilos.tabBoton(subPestana === 'contactos')}>
          📇 Directorio de Contactos ({contactos.length})
        </button>
      </div>

      {/* VISTA 1: CLIENTES */}
      {subPestana === 'clientes' && (
        <div style={estilos.gridModulo}>
          <form onSubmit={guardarCliente} style={estilos.formulario}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '15px' }}>➕ Alta de Cliente</h3>
            <label style={estilos.label}>Nombre de Cliente / Empresa:</label>
            <input type="text" placeholder="Ej. Empresa SA de CV" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} required style={estilos.input} />
            <label style={estilos.label}>RFC / Tax ID:</label>
            <input type="text" placeholder="Ej. XAXX010101000" value={rfc} onChange={e => setRfc(e.target.value)} style={estilos.input} />
            <button type="submit" disabled={guardandoCliente} style={estilos.botonVerde}>
              {guardandoCliente ? 'Guardando...' : '💾 Registrar Cliente'}
            </button>
          </form>

          <div style={estilos.tarjetaTabla}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '15px' }}>🏢 Listado de Clientes</h3>
            <table style={estilos.tabla}>
              <thead>
                <tr style={estilos.encabezado}><th style={estilos.th}>ID</th><th style={estilos.th}>Cliente</th><th style={estilos.th}>RFC</th></tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr><td colSpan="3" style={estilos.celdaVacia}>No hay clientes registrados.</td></tr>
                ) : (
                  clientes.map(c => (
                    <tr key={c.ClienteID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={stylesId(estilos.td)}>#{c.ClienteID}</td>
                      <td style={{ ...estilos.td, fontWeight: '700', color: '#0f172a' }}>{c.NombreCliente}</td>
                      <td style={{ ...estilos.td, color: '#475569', fontFamily: 'Consolas, monospace' }}>{c.RFC_TaxID || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 2: UBICACIONES */}
      {subPestana === 'ubicaciones' && (
        <div style={estilos.gridModulo}>
          <form onSubmit={guardarUbicacion} style={estilos.formulario}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '15px' }}>➕ Registrar Ubicación</h3>
            <label style={estilos.label}>Seleccionar Cliente:</label>
            <select value={clienteUbicacionID} onChange={e => setClienteUbicacionID(e.target.value)} required style={estilos.input}>
              <option value="">-- Selecciona Cliente --</option>
              {clientes.map(c => <option key={c.ClienteID} value={c.ClienteID}>{c.NombreCliente}</option>)}
            </select>
            <label style={estilos.label}>Nombre / Descripción de Ubicación:</label>
            <input type="text" placeholder="Ej. Planta Principal o Bodega 2" value={nombreUbicacion} onChange={e => setNombreUbicacion(e.target.value)} required style={estilos.input} />
            <label style={estilos.label}>Dirección:</label>
            <input type="text" placeholder="Calle y número..." value={direccion} onChange={e => setDireccion(e.target.value)} style={estilos.input} />
            <label style={estilos.label}>Ciudad:</label>
            <input type="text" placeholder="Ciudad..." value={ciudad} onChange={e => setCiudad(e.target.value)} style={estilos.input} />
            <button type="submit" disabled={guardandoUbicacion} style={estilos.botonAzul}>
              {guardandoUbicacion ? 'Guardando...' : '💾 Registrar Ubicación'}
            </button>
          </form>

          <div style={estilos.tarjetaTabla}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '15px' }}>📍 Listado de Ubicaciones</h3>
            <table style={estilos.tabla}>
              <thead>
                <tr style={estilos.encabezado}>
                  <th style={estilos.th}>ID</th>
                  <th style={estilos.th}>Cliente</th>
                  <th style={estilos.th}>Ubicación</th>
                  <th style={estilos.th}>Dirección</th>
                  <th style={estilos.th}>Ciudad</th>
                </tr>
              </thead>
              <tbody>
                {ubicaciones.length === 0 ? (
                  <tr><td colSpan="5" style={estilos.celdaVacia}>No hay ubicaciones registradas.</td></tr>
                ) : (
                  ubicaciones.map(u => {
                    const clienteObj = clientes.find(c => c.ClienteID === u.ClienteID)
                    return (
                      <tr key={u.UbicacionID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={stylesId(estilos.td)}>#{u.UbicacionID}</td>
                        <td style={{ ...estilos.td, fontWeight: '700' }}>{clienteObj?.NombreCliente || '—'}</td>
                        <td style={{ ...estilos.td, color: '#0f172a', fontWeight: '600' }}>{u.NombreUbicacion}</td>
                        <td style={{ ...estilos.td, color: '#475569', fontSize: '12px' }}>{u.Direccion || '—'}</td>
                        <td style={{ ...estilos.td, color: '#475569' }}>{u.Ciudad || '—'}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 3: CONTACTOS */}
      {subPestana === 'contactos' && (
        <div style={estilos.gridModulo}>
          <form onSubmit={guardarContacto} style={estilos.formulario}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '15px' }}>👤 Agregar Contacto</h3>
            
            <label style={estilos.label}>Seleccionar Cliente:</label>
            <select value={clienteContactoID} onChange={e => { setClienteContactoID(e.target.value); setUbicacionContactoID(''); }} required style={estilos.input}>
              <option value="">-- 1. Selecciona Cliente --</option>
              {clientes.map(c => <option key={c.ClienteID} value={c.ClienteID}>{c.NombreCliente}</option>)}
            </select>

            <label style={estilos.label}>Seleccionar Ubicación:</label>
            <select value={ubicacionContactoID} onChange={e => setUbicacionContactoID(e.target.value)} disabled={!clienteContactoID} required style={estilos.input}>
              <option value="">
                {!clienteContactoID ? '-- Primero selecciona cliente --' : ubicacionesDelCliente.length === 0 ? '-- Sin ubicaciones --' : '-- 2. Selecciona Ubicación --'}
              </option>
              {ubicacionesDelCliente.map(u => (
                <option key={u.UbicacionID} value={u.UbicacionID}>{u.NombreUbicacion}</option>
              ))}
            </select>

            <label style={estilos.label}>Nombre del Contacto:</label>
            <input type="text" placeholder="Ej. Juan Pérez" value={nombreContacto} onChange={e => setNombreContacto(e.target.value)} required style={estilos.input} />
            <label style={estilos.label}>Puesto / Área:</label>
            <input type="text" placeholder="Ej. Gerente" value={puesto} onChange={e => setPuesto(e.target.value)} style={estilos.input} />
            <label style={estilos.label}>Teléfono:</label>
            <input type="text" placeholder="Teléfono..." value={telefono} onChange={e => setTelefono(e.target.value)} style={estilos.input} />
            <label style={estilos.label}>Correo Electrónico:</label>
            <input type="email" placeholder="Correo..." value={email} onChange={e => setEmail(e.target.value)} style={estilos.input} />

            <button type="submit" disabled={guardandoContacto} style={estilos.botonAzul}>
              {guardandoContacto ? 'Guardando...' : '💾 Registrar Contacto'}
            </button>
          </form>

          <div style={estilos.tarjetaTabla}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '15px' }}>📇 Directorio de Contactos</h3>
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
                  <tr><td colSpan="4" style={estilos.celdaVacia}>No hay contactos asociados.</td></tr>
                ) : (
                  contactos.map(ct => (
                    <tr key={ct.ContactoID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ ...estilos.td, fontWeight: '700', color: '#0f172a' }}>{ct.NombreCliente}</td>
                      <td style={{ ...estilos.td, color: '#475569' }}>{ct.NombreUbicacion}</td>
                      <td style={estilos.td}>
                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{ct.NombreContacto}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{ct.Puesto || 'S/P'}</div>
                      </td>
                      <td style={estilos.td}>
                        <div style={{ fontFamily: 'Consolas, monospace', color: '#0f172a' }}>📞 {ct.Telefono || '—'}</div>
                        <div style={{ fontSize: '11px', color: '#2563eb' }}>✉️ {ct.Email || '—'}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}

function stylesId(base) {
  return { ...base, textAlign: 'center', fontFamily: 'Consolas, monospace', fontWeight: '700' }
}

const estilos = {
  contenedorTabs: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' },
  tabBoton: (activo) => ({
    backgroundColor: activo ? '#2563eb' : '#ffffff',
    color: activo ? '#ffffff' : '#475569',
    border: '1px solid #cbd5e1',
    padding: '10px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '13px',
    boxShadow: activo ? '0 4px 6px -1px rgba(37, 99, 235, 0.2)' : 'none',
    transition: 'all 0.2s'
  }),
  gridModulo: { display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px', alignItems: 'start' },
  formulario: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  tarjetaTabla: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  label: { fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'uppercase' },
  input: { width: '100%', padding: '9px 10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px', backgroundColor: '#fff', color: '#1e293b' },
  botonVerde: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
  botonAzul: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  encabezado: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' },
  th: { padding: '12px 10px', color: '#334155', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' },
  td: { padding: '12px 10px', verticalAlign: 'middle', color: '#1e293b' },
  celdaVacia: { textAlign: 'center', padding: '30px', color: '#94a3b8', fontStyle: 'italic' }
}