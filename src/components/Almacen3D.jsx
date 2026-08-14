import React, { useEffect } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

export function Almacen3D({ ubicacionesDestacadas = [] }) {
  // Carga el archivo cargado en public/almacen.glb
  const { scene } = useGLTF('/almacen.glb');

  // Material Verde Neón / Fluorescente para resaltar
  const materialResaltado = new THREE.MeshStandardMaterial({
    color: '#00ff66',
    emissive: '#00aa33',
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });

  useEffect(() => {
    if (!scene) return;

    // Convertimos la lista de ubicaciones a minúsculas para comparar fácilmente
    const listaUbicacionesLwr = ubicacionesDestacadas.map((u) => u.toLowerCase());

    // Recorremos todas las mallas del modelo 3D
    scene.traverse((child) => {
      if (child.isMesh) {
        // Guardamos el material original
        if (!child.userData.materialOriginal) {
          child.userData.materialOriginal = child.material;
        }

        const nombreNodoLwr = child.name.toLowerCase();

        // Verificamos si la pieza del 3D coincide con algunas de las ubicaciones filtradas
        const esCoincidencia = listaUbicacionesLwr.some((ub) =>
          nombreNodoLwr.includes(ub)
        );

        if (esCoincidencia) {
          child.material = materialResaltado;
        } else {
          child.material = child.userData.materialOriginal;
        }
      }
    });
  }, [ubicacionesDestacadas, scene]);

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

useGLTF.preload('/almacen.glb');