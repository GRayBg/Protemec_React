import React, { useState, Suspense, useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html, Bounds } from '@react-three/drei'
import { Almacen3D } from './Almacen3D'

const PRODUCTOS_ALMACEN_BASE = [
  { id: 'b1', nombre: 'Tornillos M8', ubicacion: 'Pieza4', stock: 120 },
  { id: 'b2', nombre: 'Tuercas Hexagonales', ubicacion: 'Pieza5', stock: 85 },
  { id: 'b3', nombre: 'Arandelas de Presión', ubicacion: 'Pieza6', stock: 200 },
  { id: 'b4', nombre: 'Llaves Allen', ubicacion: 'Pieza7', stock: 14 },
  { id: 'b5', nombre: 'Placas de Acero', ubicacion: 'Pieza8', stock: 8 },
  { id: 'b6', nombre: 'Micrómetro Digital', ubicacion: 'Pieza9', stock: 3 },
  { id: 'b7', nombre: 'Calibrador Vernier', ubicacion: 'Pieza10', stock: 5 },
  { id: 'b8', nombre: 'Seguros Truarc', ubicacion: 'Pieza11', stock: 150 },
  { id: 'b9', nombre: 'Rodamientos 6204', ubicacion: 'Pieza12', stock: 24 }
]

export default function GestionAlmacen3D({ API_URL }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [inventarioRemoto, setInventarioRemoto] = useState([])

  useEffect(() => {
    if (!API_URL) return
    fetch(`${API_URL}/api/inventario`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setInventarioRemoto(
            data.map((i) => ({
              id: `db-${i.ID}`,
              nombre: i.NombreProducto,
              ubicacion: i.Ubicacion3D,
              stock: i.CantidadStock
            }))
          )
        }
      })
      .catch(() => { })
  }, [API_URL])

  const catalogoCompleto = useMemo(() => {
    return inventarioRemoto.length > 0
      ? [...inventarioRemoto, ...PRODUCTOS_ALMACEN_BASE]
      : PRODUCTOS_ALMACEN_BASE
  }, [inventarioRemoto])

  const productosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return catalogoCompleto
    const term = searchTerm.toLowerCase()
    return catalogoCompleto.filter(
      (p) =>
        String(p.nombre).toLowerCase().includes(term) ||
        String(p.ubicacion).toLowerCase().includes(term)
    )
  }, [searchTerm, catalogoCompleto])

  const ubicacionesAColorear = useMemo(() => {
    if (productoSeleccionado) return [productoSeleccionado.ubicacion]
    if (searchTerm.trim()) return productosFiltrados.map((p) => p.ubicacion)
    return []
  }, [productosFiltrados, productoSeleccionado, searchTerm])

  return (
    <div className="pro-card" style={estilos.contenedorPrincipal}>
      {/* PANEL LATERAL DE BÚSQUEDA */}
      <div style={estilos.panelLateral}>
        <div style={{ marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '4px' }}>📦 Gemelo Digital 3D</h3>
          <p style={{ fontSize: '12px', color: '#86868b' }}>
            Selecciona un material para iluminar su ubicación física en el almacén
          </p>
        </div>

        <input
          type="text"
          placeholder="🔍 Buscar material o código (Ej. Pieza4)..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setProductoSeleccionado(null)
          }}
          className="pro-input"
          style={{ marginBottom: '12px' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="pro-label" style={{ margin: 0 }}>
            Elementos ({productosFiltrados.length})
          </span>
          {productoSeleccionado && (
            <button
              onClick={() => setProductoSeleccionado(null)}
              style={{ background: 'none', border: 'none', color: '#0071e3', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
            >
              Limpiar selección
            </button>
          )}
        </div>

        <ul style={estilos.listaResultados}>
          {productosFiltrados.map((item) => {
            const isSelected = productoSeleccionado?.id === item.id
            return (
              <li
                key={item.id}
                onClick={() => setProductoSeleccionado(isSelected ? null : item)}
                style={estilos.itemLista(isSelected)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px', color: isSelected ? '#0071e3' : '#1d1d1f' }}>
                    {item.nombre}
                  </strong>
                  {item.stock !== undefined && (
                    <span className="pro-mono" style={{ fontSize: '11px', fontWeight: 700, color: '#515154' }}>
                      {item.stock} u.
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11.5px', color: '#86868b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Nodo 3D:</span>
                  <code className="pro-mono" style={estilos.codeTag(isSelected)}>
                    {item.ubicacion}
                  </code>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* VISOR 3D */}
      <div style={estilos.visorCanvas}>
        {productoSeleccionado && (
          <div style={estilos.hudBanner}>
            <span>📍 Ubicación iluminada en verde neón:</span>
            <strong className="pro-mono">{productoSeleccionado.ubicacion}</strong>
            <span>— {productoSeleccionado.nombre}</span>
          </div>
        )}

        <Canvas camera={{ position: [5, 5, 5], fov: 40 }}>
          <color attach="background" args={['#f8fafc']} />
          <ambientLight intensity={1.3} />
          <directionalLight position={[10, 15, 10]} intensity={1.8} />

          <Suspense
            fallback={
              <Html center>
                <div style={{ background: '#1d1d1f', color: '#fff', padding: '10px 18px', borderRadius: '99px', fontSize: '12.5px', fontWeight: 600 }}>
                  Cargando Gemelo Digital 3D...
                </div>
              </Html>
            }
          >
            <Bounds fit clip observe margin={1.2}>
              <Almacen3D ubicacionesDestacadas={ubicacionesAColorear} />
            </Bounds>
          </Suspense>

          <OrbitControls makeDefault />
        </Canvas>
      </div>
    </div>
  )
}

const estilos = {
  contenedorPrincipal: {
    display: 'flex',
    width: '100%',
    height: 'calc(100vh - 140px)',
    minHeight: '560px',
    overflow: 'hidden'
  },
  panelLateral: {
    width: '330px',
    height: '100%',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid var(--border-light)',
    display: 'flex',
    flexDirection: 'column'
  },
  listaResultados: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  itemLista: (isSelected) => ({
    padding: '11px 14px',
    borderRadius: '10px',
    border: `1px solid ${isSelected ? '#0071e3' : 'var(--border-light)'}`,
    backgroundColor: isSelected ? 'rgba(0, 113, 227, 0.06)' : '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.18s ease'
  }),
  codeTag: (isSelected) => ({
    backgroundColor: isSelected ? '#0071e3' : '#f1f5f9',
    color: isSelected ? '#ffffff' : '#334155',
    padding: '2px 6px',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: 600
  }),
  visorCanvas: {
    flex: 1,
    height: '100%',
    position: 'relative',
    backgroundColor: '#f8fafc'
  },
  hudBanner: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    zIndex: 10,
    backgroundColor: 'rgba(29, 29, 31, 0.86)',
    backdropFilter: 'blur(10px)',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '999px',
    fontSize: '12.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
  }
}