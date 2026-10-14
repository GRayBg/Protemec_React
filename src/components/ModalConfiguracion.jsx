import { useState } from 'react'
import { createPortal } from 'react-dom'

const MODULOS_SISTEMA = [
  { id: 'compras', label: '💳 Compras y Finanzas' },
  { id: 'proyectos', label: '📁 Portafolio de Proyectos' },
  { id: 'clientes', label: '🏢 Clientes y Directorio' },
  { id: 'ingenieria', label: '⚙️ Ingeniería y BOM 3D' },
  { id: 'almacen', label: '📦 Almacén Digital 3D' },
  { id: 'chatbot', label: '✨ Asistente IA' }
]

export default function ModalConfiguracion({
  abierto,
  alCerrar,
  API_URL,
  perfilesUsuarios = [],
  setPerfilesUsuarios,
  credencialesMaestras,
  setCredencialesMaestras,
  usuarioActual,
  mostrarToast
}) {
  const [pestana, setPestana] = useState('permisos')
  const [perfilSeleccionadoId, setPerfilSeleccionadoId] = useState(perfilesUsuarios[0]?.id || 'ing')

  // Estado para agregar nuevo usuario Entra ID
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [nuevoRol, setNuevoRol] = useState('Operador Entra ID')

  // Estado para credenciales de emergencia
  const [userMaestroTemp, setUserMaestroTemp] = useState(credencialesMaestras?.usuario || 'admin')
  const [passMaestroTemp, setPassMaestroTemp] = useState(credencialesMaestras?.password || 'ProteMaster2026')

  if (!abierto) return null

  const esMaestro = usuarioActual?.esMaestro
  const perfilActivo = perfilesUsuarios.find((p) => p.id === perfilSeleccionadoId) || perfilesUsuarios[0]

  const togglePermiso = (moduloId, tipoPermiso) => {
    if (!esMaestro) {
      if (mostrarToast) mostrarToast('Solo el Perfil Maestro puede modificar privilegios', 'alerta')
      return
    }
    setPerfilesUsuarios((prev) =>
      prev.map((perfil) => {
        if (perfil.id !== perfilActivo.id) return perfil
        const permisoActual = perfil.permisos[moduloId] || { ver: true, editar: false }
        const nuevoValor = !permisoActual[tipoPermiso]

        const permisoActualizado = {
          ...permisoActual,
          [tipoPermiso]: nuevoValor
        }
        // Si se desactiva "Ver", también desactivamos "Editar" por seguridad
        if (tipoPermiso === 'ver' && !nuevoValor) {
          permisoActualizado.editar = false
        }
        // Si se activa "Editar", forzamos "Ver" en true
        if (tipoPermiso === 'editar' && nuevoValor) {
          permisoActualizado.ver = true
        }

        return {
          ...perfil,
          permisos: {
            ...perfil.permisos,
            [moduloId]: permisoActualizado
          }
        }
      })
    )
  }

  const agregarUsuarioEntra = (e) => {
    e.preventDefault()
    if (!nuevoNombre.trim() || !nuevoEmail.trim()) return
    const nuevoId = `user_${Date.now()}`
    const nuevoPerfil = {
      id: nuevoId,
      nombre: nuevoNombre.trim(),
      email: nuevoEmail.trim().toLowerCase(),
      rol: nuevoRol,
      esMaestro: false,
      permisos: {
        compras: { ver: true, editar: false },
        proyectos: { ver: true, editar: false },
        clientes: { ver: true, editar: false },
        ingenieria: { ver: true, editar: true },
        almacen: { ver: true, editar: true },
        chatbot: { ver: true, editar: true }
      }
    }
    setPerfilesUsuarios((prev) => [...prev, nuevoPerfil])
    setPerfilSeleccionadoId(nuevoId)
    setNuevoNombre('')
    setNuevoEmail('')
    if (mostrarToast) mostrarToast(`Perfil de ${nuevoPerfil.email} dado de alta`)
  }

  const guardarCredencialesEmergencia = (e) => {
    e.preventDefault()
    if (!esMaestro) return
    setCredencialesMaestras({
      usuario: userMaestroTemp.trim(),
      password: passMaestroTemp
    })
    if (mostrarToast) mostrarToast('Credenciales Maestras de Emergencia actualizadas')
  }

  return createPortal(
    <div className="pro-modal-backdrop" onClick={alCerrar}>
      <div className="pro-modal-window" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
        <div className="pro-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <div>
              <h3 style={{ fontSize: '16px', margin: 0 }}>Centro de Seguridad, Perfiles y Microsoft Entra ID</h3>
              <span style={{ fontSize: '12px', color: '#86868b' }}>
                Sesión actual: <strong>{usuarioActual?.nombre}</strong> ({usuarioActual?.email})
              </span>
            </div>
          </div>
          <button onClick={alCerrar} className="pro-btn pro-btn-secondary pro-btn-sm">✕</button>
        </div>

        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-light)', backgroundColor: '#f8fafc' }}>
          <div className="pro-segmented">
            <button
              type="button"
              className={`pro-segmented-btn ${pestana === 'permisos' ? 'active' : ''}`}
              onClick={() => setPestana('permisos')}
            >
              🎛️ Permisos por Perfil (RBAC)
            </button>
            <button
              type="button"
              className={`pro-segmented-btn ${pestana === 'emergencia' ? 'active' : ''}`}
              onClick={() => setPestana('emergencia')}
            >
              🔑 Llave Maestra de Emergencia
            </button>
            <button
              type="button"
              className={`pro-segmented-btn ${pestana === 'entraid' ? 'active' : ''}`}
              onClick={() => setPestana('entraid')}
            >
              ☁️ Conexión Microsoft Entra ID
            </button>
          </div>
        </div>

        <div className="pro-modal-body" style={{ minHeight: '420px' }}>
          {/* PESTAÑA 1: MATRIZ DE PERMISOS MUY SENCILLA DE OCUPAR */}
          {pestana === 'permisos' && (
            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '20px' }}>
              {/* Lista de Perfiles / Usuarios */}
              <div style={{ borderRight: '1px solid var(--border-light)', paddingRight: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="pro-label">Perfiles Registrados</span>
                {perfilesUsuarios.map((p) => {
                  const activo = p.id === perfilActivo?.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPerfilSeleccionadoId(p.id)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `1px solid ${activo ? '#0071e3' : 'var(--border-light)'}`,
                        backgroundColor: activo ? 'rgba(0, 113, 227, 0.08)' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '13px', color: activo ? '#0071e3' : '#1d1d1f' }}>
                        {p.nombre}
                      </div>
                      <div className="pro-mono" style={{ fontSize: '11px', color: '#86868b' }}>{p.email}</div>
                    </button>
                  )
                })}

                {esMaestro && (
                  <form onSubmit={agregarUsuarioEntra} style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="pro-label">➕ Vincular Correo Entra ID</span>
                    <input
                      type="text"
                      placeholder="Nombre (Ej. Ing. Carlos)"
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      required
                      className="pro-input"
                      style={{ fontSize: '12px', padding: '7px 10px' }}
                    />
                    <input
                      type="email"
                      placeholder="correo@protemec.com"
                      value={nuevoEmail}
                      onChange={(e) => setNuevoEmail(e.target.value)}
                      required
                      className="pro-input pro-mono"
                      style={{ fontSize: '12px', padding: '7px 10px' }}
                    />
                    <select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value)} className="pro-select" style={{ fontSize: '12px', padding: '7px 10px' }}>
                      <option value="Ingeniería">Rol: Ingeniería</option>
                      <option value="Compras">Rol: Compras</option>
                      <option value="Almacén">Rol: Almacén</option>
                      <option value="Auditor (Solo Lectura)">Rol: Solo Lectura</option>
                    </select>
                    <button type="submit" className="pro-btn pro-btn-primary pro-btn-sm">
                      Agregar Perfil
                    </button>
                  </form>
                )}
              </div>

              {/* Matriz de Switches de Acceso y Edición */}
              {perfilActivo && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h4 style={{ fontSize: '15px' }}>Permisos de: {perfilActivo.nombre}</h4>
                      <span style={{ fontSize: '12px', color: '#86868b' }}>
                        Correo Entra ID: <code className="pro-mono">{perfilActivo.email}</code>
                      </span>
                    </div>

                    {esMaestro && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            MODULOS_SISTEMA.forEach((m) => {
                              perfilActivo.permisos[m.id] = { ver: true, editar: true }
                            })
                            setPerfilesUsuarios([...perfilesUsuarios])
                          }}
                          className="pro-btn pro-btn-secondary pro-btn-sm"
                        >
                          Habilitar Todo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            MODULOS_SISTEMA.forEach((m) => {
                              perfilActivo.permisos[m.id] = { ver: true, editar: false }
                            })
                            setPerfilesUsuarios([...perfilesUsuarios])
                          }}
                          className="pro-btn pro-btn-secondary pro-btn-sm"
                        >
                          Solo Lectura
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pro-table-container">
                    <table className="pro-table">
                      <thead>
                        <tr>
                          <th>Módulo del ERP</th>
                          <th style={{ textAlign: 'center' }}>Ver Página</th>
                          <th style={{ textAlign: 'center' }}>Crear y Editar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MODULOS_SISTEMA.map((mod) => {
                          const perm = perfilActivo.permisos[mod.id] || { ver: false, editar: false }
                          return (
                            <tr key={mod.id}>
                              <td style={{ fontWeight: 600 }}>{mod.label}</td>
                              <td style={{ textAlign: 'center' }}>
                                <label className="apple-switch">
                                  <input
                                    type="checkbox"
                                    checked={perm.ver}
                                    onChange={() => togglePermiso(mod.id, 'ver')}
                                    disabled={!esMaestro}
                                  />
                                  <span className="apple-slider blue" />
                                </label>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <label className="apple-switch">
                                  <input
                                    type="checkbox"
                                    checked={perm.editar}
                                    onChange={() => togglePermiso(mod.id, 'editar')}
                                    disabled={!esMaestro}
                                  />
                                  <span className="apple-slider" />
                                </label>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA 2: USUARIO Y CONTRASEÑA MAESTRA SIN MICROSOFT ENTRA */}
          {pestana === 'emergencia' && (
            <form onSubmit={guardarCredencialesEmergencia} style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: '12.5px' }}>
                <strong>⚡ Acceso Maestro Directo (Break-Glass):</strong> Esta cuenta funciona de manera independiente a Microsoft Entra ID. Si el tenant de Microsoft presenta intermitencias, puedes ingresar con este usuario y contraseña teniendo control total de todos los módulos.
              </div>

              <div>
                <label className="pro-label">Usuario Maestro de Emergencia</label>
                <input
                  type="text"
                  value={userMaestroTemp}
                  onChange={(e) => setUserMaestroTemp(e.target.value)}
                  disabled={!esMaestro}
                  required
                  className="pro-input pro-mono"
                />
              </div>

              <div>
                <label className="pro-label">Contraseña Maestra</label>
                <input
                  type="text"
                  value={passMaestroTemp}
                  onChange={(e) => setPassMaestroTemp(e.target.value)}
                  disabled={!esMaestro}
                  required
                  className="pro-input pro-mono"
                />
              </div>

              {esMaestro && (
                <button type="submit" className="pro-btn pro-btn-primary">
                  💾 Actualizar Llave Maestra
                </button>
              )}
            </form>
          )}

          {/* PESTAÑA 3: CONEXIÓN MICROSOFT ENTRA ID Y BACKEND */}
          {pestana === 'entraid' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--border-light)' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>☁️ Parámetros de Microsoft Entra ID (Azure AD)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="pro-label">Tenant ID</label>
                    <input type="text" placeholder="protemec.onmicrosoft.com" className="pro-input pro-mono" />
                  </div>
                  <div>
                    <label className="pro-label">Client ID (App Registration)</label>
                    <input type="text" placeholder="00000000-0000-0000-0000-000000000000" className="pro-input pro-mono" />
                  </div>
                </div>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: '#f5f5f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600 }}>Endpoint API Conectado</span>
                <code className="pro-mono" style={{ fontSize: '12px', color: '#0071e3', fontWeight: 700 }}>{API_URL}</code>
              </div>
            </div>
          )}
        </div>

        <div className="pro-modal-footer">
          <button onClick={alCerrar} className="pro-btn pro-btn-primary">
            Listo
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}