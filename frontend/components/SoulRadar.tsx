'use client';

import { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

interface SoulRadarProps {
  soulId: string | null; // 允许 null
}

function SoulMesh({ intensity, isActive }: { intensity: number; isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const getColor = () => {
    if (!isActive) return '#3f3f46'; // 未激活：深灰色
    if (intensity > 0.8) return '#ff2d55'; 
    if (intensity > 0.5) return '#ff9f43'; 
    return '#00d2d3'; 
  };

  useFrame((state) => {
    if (meshRef.current) {
      if (!isActive) {
        // 休眠状态：极慢旋转，无呼吸
        meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        meshRef.current.scale.set(1.2, 1.2, 1.2);
      } else {
        // 激活状态：正常旋转 + 呼吸
        meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
        meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
        const scale = 1.35 + Math.sin(state.clock.elapsedTime * 2) * 0.05 * intensity;
        meshRef.current.scale.set(scale, scale, scale);
      }
    }
  });

  return (
    <Float speed={isActive ? 2 : 0.5} rotationIntensity={isActive ? 0.5 : 0.1} floatIntensity={isActive ? 0.5 : 0.1}>
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color={getColor()}
          attach="material"
          distort={isActive ? 0.4 * intensity : 0.1}
          speed={isActive ? 2 : 0.5}
          roughness={isActive ? 0.1 : 0.8}
          metalness={isActive ? 0.8 : 0.2}
          clearcoat={isActive ? 1 : 0}
          clearcoatRoughness={0.1}
          emissive={getColor()}
          emissiveIntensity={isActive ? 0.2 : 0.05}
        />
      </Sphere>
    </Float>
  );
}

export default function SoulRadar({ soulId }: SoulRadarProps) {
  const [mounted, setMounted] = useState(false);
  const isActive = !!soulId;

  // 计算强度 (如果未激活则固定为 0)
  const [intensity] = useState(() => {
    if (!soulId) return 0;
    let hash = 0;
    for (let i = 0; i < soulId.length; i++) {
      hash = soulId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const normalized = Math.abs(hash % 100) / 100;
    return 0.6 + (normalized * 0.4);
  });

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
        <ambientLight intensity={isActive ? 0.5 : 0.2} />
        <pointLight position={[10, 10, 10]} intensity={isActive ? 1.5 : 0.3} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={isActive ? 0.5 : 0.1} color="#4ecdc4" />
        
        <SoulMesh intensity={intensity} isActive={isActive} />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate 
          autoRotateSpeed={isActive ? 0.5 : 0.1} 
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI - Math.PI / 4}
        />
      </Canvas>

      {/* 状态指示器 (始终显示) */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
        {/* 左侧：Soul ID */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-md bg-black/20 border border-white/10 text-xs font-mono shadow-lg transition-colors duration-500">
          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] transition-colors duration-500 ${
            isActive ? 'bg-cyan-400 text-cyan-400 animate-pulse' : 'bg-zinc-600 text-zinc-600'
          }`} />
          <span className={`tracking-wider hidden sm:inline transition-colors duration-500 ${
            isActive ? 'text-cyan-300' : 'text-zinc-500'
          }`}>
            ID: {soulId || 'NULL'}
          </span>
          <span className={`tracking-wider sm:hidden transition-colors duration-500 ${
            isActive ? 'text-cyan-300' : 'text-zinc-500'
          }`}>
            {soulId ? soulId.slice(0, 8) + '...' : 'NULL'}
          </span>
        </div>

        {/* 右侧：能量强度 */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg backdrop-blur-md bg-black/20 border border-white/10 text-xs font-medium shadow-lg">
          <span className="text-zinc-400 hidden sm:inline">ENERGY</span>
          <div className="flex items-center gap-2">
            <div className="w-20 sm:w-24 h-1.5 bg-zinc-800/80 rounded-full overflow-hidden backdrop-blur-sm">
              {isActive ? (
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor] ${
                    intensity > 0.8 ? 'bg-gradient-to-r from-red-500 to-orange-500 text-red-500' : 
                    intensity > 0.5 ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-orange-500' : 
                    'bg-gradient-to-r from-cyan-500 to-blue-500 text-cyan-500'
                  }`}
                  style={{ width: `${intensity * 100}%` }}
                />
              ) : (
                <div className="h-full w-0 bg-zinc-600" />
              )}
            </div>
            <span className={`min-w-[3rem] text-right transition-colors duration-500 ${
              !isActive ? 'text-zinc-600' :
              intensity > 0.8 ? 'text-red-400' : 
              intensity > 0.5 ? 'text-orange-400' : 
              'text-cyan-400'
            }`}>
              {isActive ? `${(intensity * 100).toFixed(0)}%` : 'OFF'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
