import { useState } from 'react'

export default function GestionChatbot({ compras = [], proyectos = [] }) {
  const [mensajes, setMensajes] = useState([
    {
      remitente: 'bot',
      texto: '¡Hola! Soy Protemec Intelligence. Puedo ayudarte a resumir costos de compras, proyectos activos o estado del inventario en tiempo real.'
    }
  ])
  const [entrada, setEntrada] = useState('')

  const enviarConsulta = (textoConsulta) => {
    if (!textoConsulta.trim()) return
    setMensajes((prev) => [...prev, { remitente: 'usuario', texto: textoConsulta }])
    setEntrada('')

    setTimeout(() => {
      const q = textoConsulta.toLowerCase()
      let respuesta = 'El conector de lenguaje natural avanzado se encuentra en espera de clave API en el servidor, pero tus módulos de Azure SQL están operando al 100%.'

      if (q.includes('compra') || q.includes('gasto') || q.includes('total')) {
        const comprados = compras.filter((c) => String(c.Estatus || c.estatus || 'Comprado').toLowerCase() === 'comprado')
        const total = comprados.reduce((acc, c) => acc + Number(c.Costo || c.costo || 0) * 1.16, 0)
        respuesta = `Actualmente tienes ${comprados.length} compras firmes registradas, con una inversión acumulada de $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN (IVA incluido).`
      } else if (q.includes('proyecto')) {
        respuesta = `Tienes ${proyectos.length} proyectos registrados en el catálogo corporativo.`
      }

      setMensajes((prev) => [...prev, { remitente: 'bot', texto: respuesta }])
    }, 450)
  }

  const manejarEnvio = (e) => {
    e.preventDefault()
    enviarConsulta(entrada)
  }

  return (
    <div className="pro-card" style={estilos.contenedorChat}>
      <div style={estilos.cabeceraChat}>
        <div style={estilos.iconoAi}>✨</div>
        <div>
          <h3 style={{ fontSize: '15px', margin: 0 }}>Protemec Intelligence</h3>
          <p style={{ fontSize: '12px', color: '#86868b', margin: 0 }}>
            Copiloto analítico conectado al estado actual del ERP
          </p>
        </div>
      </div>

      <div style={estilos.cuerpoMensajes}>
        {mensajes.map((m, idx) => (
          <div key={idx} style={m.remitente === 'usuario' ? estilos.burbujaUsuario : estilos.burbujaBot}>
            {m.texto}
          </div>
        ))}
      </div>

      <div style={estilos.sugerenciasBar}>
        <button type="button" onClick={() => enviarConsulta('¿Cuál es el total de compras?')} className="pro-btn pro-btn-secondary pro-btn-sm">
          💳 Resumen de inversión en compras
        </button>
        <button type="button" onClick={() => enviarConsulta('¿Cuántos proyectos tenemos?')} className="pro-btn pro-btn-secondary pro-btn-sm">
          📁 Estado de proyectos
        </button>
      </div>

      <form onSubmit={manejarEnvio} style={estilos.formularioChat}>
        <input
          type="text"
          placeholder="Escribe una pregunta sobre tus compras o proyectos..."
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          className="pro-input"
        />
        <button type="submit" className="pro-btn pro-btn-primary">
          Enviar ➔
        </button>
      </form>
    </div>
  )
}

const estilos = {
  contenedorChat: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 140px)',
    minHeight: '520px',
    overflow: 'hidden'
  },
  cabeceraChat: {
    padding: '16px 22px',
    borderBottom: '1px solid var(--border-light)',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  iconoAi: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #0071e3 0%, #7c3aed 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px'
  },
  cuerpoMensajes: {
    flex: 1,
    padding: '22px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  burbujaUsuario: {
    alignSelf: 'flex-end',
    backgroundColor: '#0071e3',
    color: '#ffffff',
    padding: '10px 16px',
    borderRadius: '16px 16px 2px 16px',
    maxWidth: '68%',
    fontSize: '13.5px',
    boxShadow: '0 2px 8px rgba(0, 113, 227, 0.2)'
  },
  burbujaBot: {
    alignSelf: 'flex-start',
    backgroundColor: '#f5f5f7',
    color: '#1d1d1f',
    padding: '12px 16px',
    borderRadius: '16px 16px 16px 2px',
    maxWidth: '68%',
    fontSize: '13.5px',
    border: '1px solid var(--border-light)'
  },
  sugerenciasBar: {
    padding: '8px 22px',
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  formularioChat: {
    padding: '14px 22px',
    borderTop: '1px solid var(--border-light)',
    display: 'flex',
    gap: '10px'
  }
}