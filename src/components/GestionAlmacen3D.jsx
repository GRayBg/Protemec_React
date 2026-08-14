import React, { useState, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Bounds } from '@react-three/drei';
import { Almacen3D } from './Almacen3D';

const PRODUCTOS_ALMACEN = [
  { id: 1, nombre: 'Tornillos M8', ubicacion: 'Pieza4' },
  { id: 2, nombre: 'Tuercas Hexagonales', ubicacion: 'Pieza5' },
  { id: 3, nombre: 'Arandelas de Presión', ubicacion: 'Pieza6' },
  { id: 4, nombre: 'Llaves Allen', ubicacion: 'Pieza7' },
  { id: 5, nombre: 'Placas de Acero', ubicacion: 'Pieza8' },
  { id: 6, nombre: 'Micrometro Digital', ubicacion: 'Pieza9' },
  { id: 7, nombre: 'Calibrador Vernier', ubicacion: 'Pieza10' },
  { id: 8, nombre: 'Seguros Truarc', ubicacion: 'Pieza11' },
  { id: 9, nombre: 'Rodamientos 6204', ubicacion: 'Pieza12' },
];

export default function GestionAlmacen3D() {
  const [searchTerm, setSearchTerm] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // 1. Filtrar productos en tiempo real
  const productosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return PRODUCTOS_ALMACEN;
    const term = searchTerm.toLowerCase();
    return PRODUCTOS_ALMACEN.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.ubicacion.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // 2. Extraer ubicaciones para colorear en el 3D
  const ubicacionesAColorear = useMemo(() => {
    if (productoSeleccionado) {
      return [productoSeleccionado.ubicacion];
    }
    return productosFiltrados.map((p) => p.ubicacion);
  }, [productosFiltrados, productoSeleccionado]);

  return (
    <div style={estilos.contenedorPrincipal}>
      
      {/* PANEL LATERAL DE BÚSQUEDA Y SELECCIÓN (ESTILO CLARO) */}
      <div style={estilos.panelLateral}>
        <h3 style={{ fontSize: '1rem', marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📦 Localizador 3D de Almacén
        </h3>

        {/* INPUT DEL BUSCADOR */}
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="🔍 Buscar elemento o ubicación..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setProductoSeleccionado(null);
            }}
            style={estilos.inputBuscador}
          />
        </div>

        <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
          {productosFiltrados.length === PRODUCTOS_ALMACEN.length
            ? 'Mostrando todos los elementos:'
            : `Coincidencias: ${productosFiltrados.length}`}
        </p>

        {/* LISTA DE RESULTADOS */}
        <ul style={estilos.listaResultados}>
          {productosFiltrados.map((item) => {
            const isSelected = productoSeleccionado?.id === item.id;
            return (
              <li
                key={item.id}
                onClick={() => setProductoSeleccionado(isSelected ? null : item)}
                style={{
                  ...estilos.itemLista,
                  backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                  borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
                  boxShadow: isSelected ? '0 1px 3px rgba(59,130,246,0.15)' : 'none'
                }}
              >
                <strong style={{ fontSize: '12.5px', color: isSelected ? '#1d4ed8' : '#0f172a' }}>{item.nombre}</strong>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                  Ubicación: <code style={{ backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: '3px', color: '#334155' }}>{item.ubicacion}</code>
                </div>
              </li>
            );
          })}

          {productosFiltrados.length === 0 && (
            <li style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
              No se encontraron productos
            </li>
          )}
        </ul>
      </div>

      {/* VISOR 3D (FONDO CLARO) */}
      <div style={estilos.visorCanvas}>
        <Canvas camera={{ position: [5, 5, 5], fov: 40 }}>
          {/* Fondo claro para el visor 3D */}
          <color attach="background" args={['#f8fafc']} />
          
          <ambientLight intensity={1.2} />
          <directionalLight position={[10, 15, 10]} intensity={1.8} />
          
          <Suspense fallback={<Html center style={{ color: '#0f172a', fontWeight: '600' }}>Cargando Modelo 3D...</Html>}>
            <Bounds fit clip observe margin={1.2}>
              <Almacen3D ubicacionesDestacadas={ubicacionesAColorear} />
            </Bounds>
          </Suspense>

          <OrbitControls makeDefault />
        </Canvas>
      </div>

    </div>
  );
}

const estilos = {
  contenedorPrincipal: {
    display: 'flex',
    width: '100%',
    height: 'calc(100vh - 50px)',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    boxSizing: 'border-box'
  },
  panelLateral: {
    width: '300px',
    height: '100%',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  },
  inputBuscador: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: '12px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  listaResultados: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    overflowY: 'auto',
    flex: 1
  },
  itemLista: {
    padding: '10px 12px',
    marginBottom: '8px',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  visorCanvas: {
    flex: 1,
    height: '100%',
    position: 'relative',
    backgroundColor: '#f8fafc'
  }
};