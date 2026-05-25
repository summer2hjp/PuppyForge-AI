'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';

interface RadarMeshProps {
  traits: any;
  rebellion: number;
}

const RadarMesh: React.FC<RadarMeshProps> = ({ traits, rebellion }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const traitValues = Object.values(traits).length > 0 
    ? Object.values(traits) 
    : [65, 85, 92, 48, 78, 70, 30];

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 外环 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.5, 10, 64]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.4} />
      </mesh>

      {/* 特质多边形 */}
      {traitValues.map((value, index) => {
        const numValue = Number(value); 
        const angle = (index / traitValues.length) * Math.PI * 2;
        const radius = (value / 100) * 8.5;

        return (
          <React.Fragment key={index}>
            <mesh position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0.5]}>
              <sphereGeometry args={[0.28]} />
              <meshStandardMaterial 
                color={`hsl(${index * 45}, 95%, 65%)`} 
                emissive="#ffffff" 
                emissiveIntensity={0.6}
              />
            </mesh>
          </React.Fragment>
        );
      })}

      {/* 叛逆特效 */}
      {rebellion > 65 && (
        <pointLight 
          color="#ef4444" 
          intensity={rebellion / 25} 
          position={[0, 0, 5]} 
        />
      )}
    </group>
  );
};

export default RadarMesh;
