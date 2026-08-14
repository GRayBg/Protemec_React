export default function ModalConfiguracion({ abierto, alCerrar, API_URL }) {
  if (!abierto) return null

  return (
    <div style={estilos.modalOverlay} onClick={alCerrar}>
      <div style={estilos.modalContenedor} onClick={(e) => e.stopPropagation()}>
        
        {/* Cabecera */}
        <div style={estilos.modalCabecera}>
          <h3 style={{ margin: 0, color: '#1a252f', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚙️ Configuración del Sistema
          </h3>
          <button onClick={alCerrar} style={estilos.btnCerrarModal}>
            ✕
          </button>
        </div>

        {/* Cuerpo */}
        <div style={estilos.modalCuerpo}>
          
          {/* Sección de Autenticación Entra ID */}
          <div style={estilos.seccionConfig}>
            <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>🔐 Autenticación & Acceso</h4>
            <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '15px' }}>
              Gestión de inicio de sesión empresarial y permisos mediante Microsoft Entra ID.
            </p>

            <div style={estilos.tarjetaEntraId}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '24px' }}>🛡️</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#333' }}>Microsoft Entra ID</strong>
                  <span style={{ fontSize: '12px', color: '#28a745' }}>• Servicio listo para vinculación</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={estilos.labelInput}>Tenant ID / Directorio:</label>
                  <input 
                    type="text" 
                    placeholder="Ej. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 
                    disabled 
                    style={estilos.inputDisabled} 
                  />
                </div>

                <div>
                  <label style={estilos.labelInput}>Client ID / Aplicación:</label>
                  <input 
                    type="text" 
                    placeholder="Ej. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 
                    disabled 
                    style={estilos.inputDisabled} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Conexión Backend */}
          <div style={estilos.seccionConfig}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>🌐 Conexión Backend</h4>
            <div style={{ fontSize: '13px', color: '#555' }}>
              <strong>API Endpoint:</strong> <code>{API_URL}</code>
            </div>
          </div>

        </div>

        {/* Pie */}
        <div style={estilos.modalPie}>
          <button onClick={alCerrar} style={estilos.btnGuardarModal}>
            Listo
          </button>
        </div>

      </div>
    </div>
  )
}

const estilos = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
    backdropFilter: 'blur(2px)'
  },
  modalContenedor: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    width: '90%',
    maxWidth: '520px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  modalCabecera: {
    padding: '16px 20px',
    borderBottom: '1px solid #dee2e6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  btnCerrarModal: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#6c757d',
    fontWeight: 'bold'
  },
  modalCuerpo: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  seccionConfig: {
    display: 'flex',
    flexDirection: 'column'
  },
  tarjetaEntraId: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e3e6f0',
    borderRadius: '8px',
    padding: '15px'
  },
  labelInput: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#555',
    display: 'block',
    marginBottom: '4px'
  },
  inputDisabled: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '4px',
    border: '1px solid #ced4da',
    backgroundColor: '#e9ecef',
    fontSize: '12px',
    color: '#6c757d',
    boxSizing: 'border-box',
    cursor: 'not-allowed'
  },
  modalPie: {
    padding: '12px 20px',
    borderTop: '1px solid #dee2e6',
    display: 'flex',
    justifyContent: 'flex-end',
    backgroundColor: '#f8f9fa'
  },
  btnGuardarModal: {
    backgroundColor: '#007bff',
    color: '#ffffff',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
}