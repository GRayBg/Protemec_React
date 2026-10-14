import { useState } from 'react'

export default function GestionClientes({
  clientes = [],
  ubicaciones = [],
  contactos = [],
  API_URL,
  recargarDatos,
  mostrarToast
}) {
  const [subPestana, setSubPestana] = useState('clientes')

  const [nombreCliente, setNombreCliente] = useState('')
  const [rfc, setRfc] = useState('')
  const [guardandoCliente, setGuardandoCliente] = useState(false)

  const [clienteUbicacionID, setClienteUbicacionID] = useState('')
  const [nombreUbicacion, setNombreUbicacion] = useState('')
  const [direccion, setDireccion] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [guardandoUbicacion, setGuardandoUbicacion] = useState(false)

  const [clienteContactoID, setClienteContactoID] = useState('')
  const [ubicacionContactoID, setUbicacionContactoID] = useState('')
  const [nombreContacto, setNombreContacto] = useState('')
  const [puesto, setPuesto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [guardandoContacto, setGuardandoContacto] = useState(false)

  const notificar = (msg, tipo = 'exito') => {
    if (mostrarToast) mostrarToast(msg, tipo)
  }

  const ubicacionesDelCliente = ubicaciones.filter(
    (u) => String(u.ClienteID) === String(clienteContactoID)
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
      setNombreCliente('')
      setRfc('')
      recargarDatos()
      notificar('Cliente corporativo registrado con éxito')
    } catch (err) {
      notificar(err.message, 'error')
    } finally {
      setGuardandoCliente(false)
    }
  }

  const guardarUbicacion = async (e) => {
    e.preventDefault()
    if (!clienteUbicacionID) return notificar('Selecciona un cliente primero', 'alerta')
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
      setClienteUbicacionID('')
      setNombreUbicacion('')
      setDireccion('')
      setCiudad('')
      recargarDatos()
      notificar('Planta / Ubicación vinculada correctamente')
    } catch (err) {
      notificar(err.message, 'error')
    } finally {
      setGuardandoUbicacion(false)
    }
  }

  const guardarContacto = async (e) => {
    e.preventDefault()
    if (!ubicacionContactoID) return notificar('Selecciona una ubicación para el contacto', 'alerta')
    setGuardandoContacto(true)
    try {
      const res = await fetch(`${API_URL}/api/contactos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteID: clienteContactoID,
          ubicacionID: ubicacionContactoID,
          nombreContacto,
          puesto,
          telefono,
          email
        })
      })
      if (!res.ok) throw new Error('Error al registrar el contacto')
      setClienteContactoID('')
      setUbicacionContactoID('')
      setNombreContacto('')
      setPuesto('')
      setTelefono('')
      setEmail('')
      recargarDatos()
      notificar('Contacto agregado al directorio')
    } catch (err) {
      notificar(err.message, 'error')
    } finally {
      setGuardandoContacto(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* CONTROL SEGMENTADO SUPERIOR */}
      <div>
        <div className="pro-segmented">
          <button
            className={`pro-segmented-btn ${subPestana === 'clientes' ? 'active' : ''}`}
            onClick={() => setSubPestana('clientes')}
          >
            🏢 Empresas Clientes ({clientes.length})
          </button>
          <button
            className={`pro-segmented-btn ${subPestana === 'ubicaciones' ? 'active' : ''}`}
            onClick={() => setSubPestana('ubicaciones')}
          >
            📍 Plantas y Ubicaciones ({ubicaciones.length})
          </button>
          <button
            className={`pro-segmented-btn ${subPestana === 'contactos' ? 'active' : ''}`}
            onClick={() => setSubPestana('contactos')}
          >
            📇 Directorio de Contactos ({contactos.length})
          </button>
        </div>
      </div>

      {/* VISTA 1: CLIENTES */}
      {subPestana === 'clientes' && (
        <div style={estilos.gridModulo}>
          <form onSubmit={guardarCliente} className="pro-card" style={estilos.cardForm}>
            <h3 style={{ fontSize: '15px', marginBottom: '4px' }}>➕ Nuevo Cliente</h3>
            <p style={{ fontSize: '12px', color: '#86868b', marginBottom: '16px' }}>
              Alta de razón social en el catálogo maestro
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label className="pro-label">Razón Social / Nombre Comercial *</label>
              <input
                type="text"
                placeholder="Ej. Industrias Metálicas SA de CV"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                required
                className="pro-input"
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label className="pro-label">RFC / Tax ID</label>
              <input
                type="text"
                placeholder="Ej. IME010101AAA"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                className="pro-input pro-mono"
              />
            </div>

            <button type="submit" disabled={guardandoCliente} className="pro-btn pro-btn-primary" style={{ width: '100%' }}>
              {guardandoCliente ? 'Guardando...' : 'Registrar Cliente'}
            </button>
          </form>

          <div className="pro-table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>ID</th>
                  <th>Cliente / Razón Social</th>
                  <th>RFC / Tax ID</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '36px', color: '#86868b' }}>
                      No hay clientes registrados.
                    </td>
                  </tr>
                ) : (
                  clientes.map((c) => (
                    <tr key={c.ClienteID}>
                      <td className="pro-mono" style={{ textAlign: 'center', fontWeight: 700, color: '#86868b' }}>
                        #{c.ClienteID}
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.NombreCliente}</td>
                      <td className="pro-mono" style={{ color: '#515154' }}>{c.RFC_TaxID || '—'}</td>
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
          <form onSubmit={guardarUbicacion} className="pro-card" style={estilos.cardForm}>
            <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>📍 Registrar Planta / Sucursal</h3>

            <div style={{ marginBottom: '12px' }}>
              <label className="pro-label">Cliente Corporativo *</label>
              <select value={clienteUbicacionID} onChange={(e) => setClienteUbicacionID(e.target.value)} required className="pro-select">
                <option value="">-- Seleccionar Cliente --</option>
                {clientes.map((c) => (
                  <option key={c.ClienteID} value={c.ClienteID}>{c.NombreCliente}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="pro-label">Nombre de Planta o Ubicación *</label>
              <input
                type="text"
                placeholder="Ej. Planta Ensamble Norte"
                value={nombreUbicacion}
                onChange={(e) => setNombreUbicacion(e.target.value)}
                required
                className="pro-input"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="pro-label">Dirección Física</label>
              <input
                type="text"
                placeholder="Parque Industrial..."
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="pro-input"
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label className="pro-label">Ciudad / Estado</label>
              <input
                type="text"
                placeholder="Ej. Puebla, Pue."
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                className="pro-input"
              />
            </div>

            <button type="submit" disabled={guardandoUbicacion} className="pro-btn pro-btn-primary" style={{ width: '100%' }}>
              {guardandoUbicacion ? 'Guardando...' : 'Guardar Ubicación'}
            </button>
          </form>

          <div className="pro-table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th style={{ width: '70px', textAlign: 'center' }}>ID</th>
                  <th>Cliente</th>
                  <th>Planta / Ubicación</th>
                  <th>Dirección</th>
                  <th>Ciudad</th>
                </tr>
              </thead>
              <tbody>
                {ubicaciones.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#86868b' }}>
                      No hay plantas registradas.
                    </td>
                  </tr>
                ) : (
                  ubicaciones.map((u) => {
                    const clienteObj = clientes.find((c) => c.ClienteID === u.ClienteID)
                    return (
                      <tr key={u.UbicacionID}>
                        <td className="pro-mono" style={{ textAlign: 'center', fontWeight: 700, color: '#86868b' }}>
                          #{u.UbicacionID}
                        </td>
                        <td style={{ fontWeight: 600 }}>{clienteObj?.NombreCliente || u.NombreCliente || '—'}</td>
                        <td style={{ color: '#0071e3', fontWeight: 600 }}>{u.NombreUbicacion}</td>
                        <td style={{ color: '#515154' }}>{u.Direccion || '—'}</td>
                        <td>{u.Ciudad || '—'}</td>
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
          <form onSubmit={guardarContacto} className="pro-card" style={estilos.cardForm}>
            <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>👤 Nuevo Contacto</h3>

            <div style={{ marginBottom: '12px' }}>
              <label className="pro-label">1. Empresa Cliente *</label>
              <select
                value={clienteContactoID}
                onChange={(e) => {
                  setClienteContactoID(e.target.value)
                  setUbicacionContactoID('')
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

            <div style={{ marginBottom: '12px' }}>
              <label className="pro-label">2. Planta / Ubicación *</label>
              <select
                value={ubicacionContactoID}
                onChange={(e) => setUbicacionContactoID(e.target.value)}
                disabled={!clienteContactoID}
                required
                className="pro-select"
              >
                <option value="">
                  {!clienteContactoID ? 'Elige un cliente primero' : '-- Seleccionar Planta --'}
                </option>
                {ubicacionesDelCliente.map((u) => (
                  <option key={u.UbicacionID} value={u.UbicacionID}>{u.NombreUbicacion}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="pro-label">Nombre Completo *</label>
              <input
                type="text"
                placeholder="Ej. Ing. Roberto Méndez"
                value={nombreContacto}
                onChange={(e) => setNombreContacto(e.target.value)}
                required
                className="pro-input"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="pro-label">Puesto / Departamento</label>
              <input
                type="text"
                placeholder="Ej. Compras / Mantenimiento"
                value={puesto}
                onChange={(e) => setPuesto(e.target.value)}
                className="pro-input"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="pro-label">Teléfono Directo</label>
              <input
                type="text"
                placeholder="+52 (222) ..."
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="pro-input pro-mono"
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label className="pro-label">Correo Electrónico</label>
              <input
                type="email"
                placeholder="contacto@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pro-input"
              />
            </div>

            <button type="submit" disabled={guardandoContacto} className="pro-btn pro-btn-primary" style={{ width: '100%' }}>
              {guardandoContacto ? 'Guardando...' : 'Agregar al Directorio'}
            </button>
          </form>

          <div className="pro-table-container">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Planta</th>
                  <th>Contacto / Cargo</th>
                  <th>Medios de Contacto</th>
                </tr>
              </thead>
              <tbody>
                {contactos.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '36px', color: '#86868b' }}>
                      No hay contactos registrados en el directorio.
                    </td>
                  </tr>
                ) : (
                  contactos.map((ct) => (
                    <tr key={ct.ContactoID}>
                      <td style={{ fontWeight: 600 }}>{ct.NombreCliente}</td>
                      <td style={{ color: '#515154' }}>{ct.NombreUbicacion}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ct.NombreContacto}</div>
                        <div style={{ fontSize: '11.5px', color: '#86868b' }}>{ct.Puesto || 'Sin cargo especificado'}</div>
                      </td>
                      <td>
                        <div className="pro-mono" style={{ fontSize: '12px' }}>📞 {ct.Telefono || '—'}</div>
                        <div style={{ fontSize: '12px', color: '#0071e3' }}>✉️ {ct.Email || '—'}</div>
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

const estilos = {
  gridModulo: {
    display: 'grid',
    gridTemplateColumns: '340px 1fr',
    gap: '20px',
    alignItems: 'start'
  },
  cardForm: {
    padding: '22px'
  }
}