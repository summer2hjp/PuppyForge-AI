// ========================================
// 灵魂雷达可视化组件
// ========================================

'use client';

import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface SoulRadarProps {
  soulId: string;  // ✅ 修复：添加必需的 soulId prop
}

function SoulMesh({ intensity = 1 }: { intensity?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.5 * intensity}>
      <MeshDistortMaterial
        color={intensity > 0.8 ? '#ff2d55' : intensity > 0.5 ? '#ff6b6b' : '#4ecdc4'}
        distort={0.4 * intensity}
        speed={2}
        roughness={0.2}
        metalness={0.8}
      />
    </Sphere>
  );
}

export default function SoulRadar({ soulId }: SoulRadarProps) {  // ✅ 修复：接收 soulId
  // 模拟根据 soulId 获取强度（实际应从 API 获取）
  const intensity = Math.random() * 0.3 + 0.7;  // 0.7 ~ 1.0

  return (
    <div className="w-full h-64 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-700">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <SoulMesh intensity={intensity} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
      
      {/* 状态指示 */}
      <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/50 rounded-full text-xs text-zinc-300">
        Soul ID: {soulId.slice(0, 8)}...  •  Intensity: {(intensity * 100).toFixed(0)}%
      </div>
    </div>
  );
}
