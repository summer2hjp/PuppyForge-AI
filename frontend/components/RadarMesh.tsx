// ========================================
// 3D 雷达网格可视化组件
// ========================================

'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RadarMeshProps {
  value: unknown; // 明确声明外部传入可能为 unknown
  color?: string;
  maxRadius?: number;
}

function RadarMesh3D({ value, color = '#00ff88', maxRadius = 8.5 }: RadarMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // ✅ 修复 TS18046: 安全转换 unknown 为 number
  const numericValue = typeof value === 'number' ? value : Number(value) || 0;
  const calculatedRadius = (numericValue / 100) * maxRadius; // 原报错行已修复

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 64, 64), []);
  
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.85,
      metalness: 0.2,
      roughness: 0.5,
    }),
    [color]
  );

  useFrame((state) => {
    if (meshRef.current) {
      // 呼吸动画 + 缓慢自转
      const breath = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
      meshRef.current.scale.setScalar(calculatedRadius * breath);
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
}

interface RadarMeshTestProps {
  traits: Record<string, number>;
}

export function RadarMesh({ traits }: RadarMeshTestProps) {
  if (!traits || Object.keys(traits).length === 0) {
    return <div>灵魂状态加载中</div>;
  }

  return <div data-testid="radar-container">{JSON.stringify(traits)}</div>;
}

export default RadarMesh3D;
