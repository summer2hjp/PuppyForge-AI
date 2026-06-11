'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface SoulRadarProps {
  soulId: string | null;
}

function ParticleSoul({ intensity, isActive }: { intensity: number; isActive: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  // 固定粒子数量，避免 Buffer 重建错误
  const PARTICLE_COUNT = 1200;
  const BASE_RADIUS = 1.7; // 球体增大 15% (原 1.05 -> 1.2)

  // 预计算粒子位置 (斐波那契球体分布)
  const { positions } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT);
      const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;
      
      const x = BASE_RADIUS * Math.cos(theta) * Math.sin(phi);
      const y = BASE_RADIUS * Math.sin(theta) * Math.sin(phi);
      const z = BASE_RADIUS * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    
    return { positions: pos };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      // 1. 移除旋转 (保持静止)
      // pointsRef.current.rotation... (已移除)

      // 2. 心跳律动效果 (整体缩放)
      const time = state.clock.elapsedTime;
      // 模拟心跳节奏：快缩 - 慢舒 - 停顿 (使用 sin^2 制造脉冲感)
      // 频率：约 1.5Hz (正常心率)
      const heartbeat = Math.pow(Math.sin(time * 3), 2); 
      
      // 基础缩放 + 心跳幅度 (激活时明显，休眠时微弱)
      const pulseScale = isActive ? 1 + (heartbeat * 0.08) : 1 + (heartbeat * 0.02);
      
      pointsRef.current.scale.set(pulseScale, pulseScale, pulseScale);
    }
  });

  // 颜色逻辑：未登录白色，登录后随能量变化
  const getParticleColor = () => {
    if (!isActive) return '#f0f0f0'; // 未登录：纯白
    if (intensity > 0.8) return '#ff2d55'; // 高能量：红
    if (intensity > 0.5) return '#ff9f43'; // 中能量：橙
    return '#00d2d3'; // 低能量：青
  };

  return (
    <group>
      <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={getParticleColor()}
          size={isActive ? 0.064 : 0.064} // 大小缩小 20% (原 0.08 -> 0.064)
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.4} // 亮度减小 30% (原 0.9 -> 0.6)
          blending={THREE.NormalBlending} // 普通混合，避免过亮
          vertexColors={false}
          toneMapped={false}
        />
      </Points>
    </group>
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
        camera={{ position: [0, 0, 4.5], fov: 65 }} // 调整焦距增强发散感
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <color attach="background" args={['#09090b']} />
        <ambientLight intensity={0.5} />
        
        <ParticleSoul intensity={intensity} isActive={isActive} />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate={false} // 禁用自动旋转
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI - Math.PI / 4}
        />
      </Canvas>

      {/* 激活状态指示灯 */}
      <div className="absolute bottom-3 left-4 pointer-events-none">
        <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-500 ${
          isActive ? 'bg-cyan-400 text-cyan-400 animate-pulse' : 'bg-zinc-600 text-zinc-600'
        }`} />
      </div>
    </div>
  );
}
