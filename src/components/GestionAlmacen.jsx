import { useState, useEffect } from 'react'

export default function GestionAlmacen({ API_URL, recargarDatos }) {
  // Aquí después podrás agregar estados para tu inventario
  const [inventario, setInventario] = useState([])
  const [cargandoAlmacen, setCargandoAlmacen] = useState(false)

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
      
      {/* Barra de herramientas del almacén */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ color: '#1a252f', margin: 0 }}>Control de Inventario</h3>
        <button style={{ backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          ➕ Registrar Movimiento
        </button>
      </div>

      {/* Tabla de datos */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px' }}>Código/SKU</th>
              <th style={{ padding: '12px' }}>Descripción del Material</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Entradas</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Salidas</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Stock Actual</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#6c757d' }}>
                Aún no hay datos de inventario cargados.
              </td>
            </tr>
            {/* Aquí harás un inventario.map() cuando conectes tu base de datos */}
          </tbody>
        </table>
      </div>
      
    </div>
  )
}