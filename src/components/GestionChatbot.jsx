import { useState } from 'react'

export default function GestionChatbot() {
  const [mensajes, setMensajes] = useState([
    { remitente: 'bot', texto: '¡Hola! Soy tu asistente virtual del ERP. ¿En qué puedo ayudarte hoy con tus compras, proyectos o inventario?' }
  ])
  const [entrada, setEntrada] = useState('')

  const manejarEnvio = (e) => {
    e.preventDefault()
    if (!entrada.trim()) return

    const nuevoMensajeUsuario = { remitente: 'usuario', texto: entrada }
    setMensajes(prev => [...prev, nuevoMensajeUsuario])
    const textoTemp = entrada
    setEntrada('')

    // Simulación de respuesta del bot (aquí puedes conectar tu API de IA más adelante)
    setTimeout(() => {
      setMensajes(prev => [
        ...prev,
        { remitente: 'bot', texto: `Deshabilitado por el momento` }
      ])
    }, 600)
  }

  return (
    <div style={estilos.contenedorChat}>
      <div style={estilos.cabeceraChat}>
        <span style={{ fontSize: '20px' }}>🤖</span>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>Asistente Inteligente (Chatbot)</h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Consulta datos, reportes y procesos mediante IA</p>
        </div>
      </div>

      <div style={estilos.cuerpoMensajes}>
        {mensajes.map((m, idx) => (
          <div key={idx} style={m.remitente === 'usuario' ? estilos.burbujaUsuario : estilos.burbujaBot}>
            {m.texto}
          </div>
        ))}
      </div>

      <form onSubmit={manejarEnvio} style={estilos.formularioChat}>
        <input 
          type="text" 
          placeholder="Escribe tu consulta o comando..." 
          value={entrada} 
          onChange={(e) => setEntrada(e.target.value)} 
          style={estilos.inputChat}
        />
        <button type="submit" style={estilos.botonEnviar}>Enviar ➔</button>
      </form>
    </div>
  )
}

const estilos = {
  contenedorChat: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 50px)',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
    overflow: 'hidden'
  },
  cabeceraChat: {
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  cuerpoMensajes: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#fcfcfc'
  },
  burbujaUsuario: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '10px 14px',
    borderRadius: '10px 10px 0 10px',
    maxWidth: '70%',
    fontSize: '13px',
    lineHeight: '1.4'
  },
  burbujaBot: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    color: '#1e293b',
    padding: '10px 14px',
    borderRadius: '10px 10px 10px 0',
    maxWidth: '70%',
    fontSize: '13px',
    lineHeight: '1.4',
    border: '1px solid #e2e8f0'
  },
  formularioChat: {
    padding: '15px 20px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    display: 'flex',
    gap: '10px'
  },
  inputChat: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none'
  },
  botonEnviar: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '13px'
  }
}