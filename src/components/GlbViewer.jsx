import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, Html } from '@react-three/drei';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Error en el visor 3D:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '550px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc3545', background: '#ffffff', textAlign: 'center' }}>
          ⚠️ No se pudo renderizar este archivo 3D.
        </div>
      );
    }
    return this.props.children;
  }
}

function Model({ url }) {
  useEffect(() => {
    return () => {
      try {
        useGLTF.clear(url);
      } catch (e) {
        // Ignorar si no estaba en caché
      }
    };
  }, [url]);

  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function GlbViewer({ modelUrl }) {
  return (
    <div style={{ width: '100%', height: '550px', borderRadius: '8px', overflow: 'hidden', background: '#ffffff', border: '1px solid #e0e0e0', position: 'relative' }}>
      <ErrorBoundary key={modelUrl}>
        <Canvas key={modelUrl} camera={{ position: [0, 0, 5], fov: 45 }} style={{ width: '100%', height: '100%' }}>
          <color attach="background" args={['#ffffff']} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[10, 15, 10]} intensity={1.5} />
          
          <Suspense fallback={
            <Html center>
              <div style={{ color: '#333333', fontFamily: 'sans-serif', background: '#f0f0f0', border: '1px solid #ccc', padding: '10px 20px', borderRadius: '20px', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                ⌛ Cargando modelo 3D...
              </div>
            </Html>
          }>
            {modelUrl && (
              <Stage environment="studio" intensity={0.5} shadows="contact">
                <Model url={modelUrl} />
              </Stage>
            )}
          </Suspense>

          <OrbitControls autoRotate={false} enableZoom />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}