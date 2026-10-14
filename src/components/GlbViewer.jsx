import React, { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Stage, Html } from '@react-three/drei'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error) {
    console.error('Error en el visor 3D:', error)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b', background: '#fef2f2', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          ⚠️ No fue posible renderizar este modelo 3D (.GLB). Verifica el archivo en Azure Blob Storage.
        </div>
      )
    }
    return this.props.children
  }
}

function Model({ url }) {
  useEffect(() => {
    return () => {
      try {
        useGLTF.clear(url)
      } catch {
        // Ignorar limpieza de caché
      }
    }
  }, [url])

  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

export default function GlbViewer({ modelUrl }) {
  const [autoRotar, setAutoRotar] = useState(false)

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '520px', borderRadius: '12px', overflow: 'hidden', background: 'radial-gradient(circle at center, #ffffff 0%, #f1f5f9 100%)', border: '1px solid var(--border-light)', position: 'relative' }}>
      {/* Controles Flotantes HUD */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setAutoRotar(!autoRotar)}
          className={`pro-btn pro-btn-sm ${autoRotar ? 'pro-btn-primary' : 'pro-btn-secondary'}`}
          style={{ backdropFilter: 'blur(8px)' }}
        >
          ↻ {autoRotar ? 'Rotando' : 'Rotar 360°'}
        </button>
      </div>

      <ErrorBoundary key={modelUrl}>
        <Canvas key={modelUrl} camera={{ position: [0, 0, 5], fov: 45 }} style={{ width: '100%', height: '100%' }}>
          <ambientLight intensity={0.95} />
          <directionalLight position={[10, 15, 10]} intensity={1.5} />

          <Suspense
            fallback={
              <Html center>
                <div style={{ background: 'rgba(29, 29, 31, 0.85)', color: '#fff', padding: '10px 20px', borderRadius: '999px', fontSize: '12.5px', fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                  Cargando geometría 3D...
                </div>
              </Html>
            }
          >
            {modelUrl && (
              <Stage environment="studio" intensity={0.5} shadows="contact">
                <Model url={modelUrl} />
              </Stage>
            )}
          </Suspense>

          <OrbitControls autoRotate={autoRotar} autoRotateSpeed={2.5} enableZoom makeDefault />
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}