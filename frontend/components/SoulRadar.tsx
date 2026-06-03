'use client';

import { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

interface SoulRadarProps {
  soulId: string;
}

function SoulMesh({ intensity }: { intensity: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const getColor = () => {
    if (intensity > 0.8) return '#ff2d55'; 
    if (intensity > 0.5) return '#ff9f43'; 
    return '#00d2d3'; 
  };

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      
      // 呼吸效果 (基于缩小后的基础尺寸 1.35)
      const scale = 1.35 + Math.sin(state.clock.elapsedTime * 2) * 0.05 * intensity;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color={getColor()}
          attach="material"
          distort={0.4 * intensity}
          speed={2}
          roughness={0.1}
          metalness={0.8}
          clearcoat={1}
          clearcoatRoughness={0.1}
          emissive={getColor()}
          emissiveIntensity={0.2}
        />
      </Sphere>
    </Float>
  );
}

export default function SoulRadar({ soulId }: SoulRadarProps) {
  const [mounted, setMounted] = useState(false);
  const [intensity] = useState(() => Math.random() * 0.3 + 0.7);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[400px] bg-zinc-900 rounded-2xl animate-pulse flex items-center justify-center border border-white/10">
        <span className="text-cyan-400">Initializing Soul Core...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gradient-to-b from-zinc-900 to-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {/* 背景噪点 */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <color attach="background" args={['#09090b']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4ecdc4" />
        
        <SoulMesh intensity={intensity} />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate 
          autoRotateSpeed={0.5} 
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI - Math.PI / 4}
        />
      </Canvas>

      {/* 状态指示器 */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
        {/* 左侧：Soul ID */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-md bg-black/20 border border-white/10 text-xs font-mono text-cyan-300 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <span className="tracking-wider hidden sm:inline">ID: {soulId}</span>
          <span className="tracking-wider sm:hidden">ID: {soulId.slice(0, 8)}...</span>
        </div>

        {/* 右侧：能量强度 */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg backdrop-blur-md bg-black/20 border border-white/10 text-xs font-medium shadow-lg">
          <span className="text-zinc-400 hidden sm:inline">ENERGY</span>
          <div className="flex items-center gap-2">
            <div className="w-20 sm:w-24 h-1.5 bg-zinc-800/80 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor] ${
                  intensity > 0.8 ? 'bg-gradient-to-r from-red-500 to-orange-500 text-red-500' : 
                  intensity > 0.5 ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-orange-500' : 
                  'bg-gradient-to-r from-cyan-500 to-blue-500 text-cyan-500'
                }`}
                style={{ width: `${intensity * 100}%` }}
              />
            </div>
            <span className={`min-w-[3rem] text-right ${
              intensity > 0.8 ? 'text-red-400' : 
              intensity > 0.5 ? 'text-orange-400' : 
              'text-cyan-400'
            }`}>
              {(intensity * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
