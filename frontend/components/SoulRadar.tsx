'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { usePuppySoul } from '@/hooks/usePuppySoul';

interface SoulRadarProps {
  soulId: string;
  className?: string;
}

interface TraitData {
  loyalty: number;
  chaos: number;
  curiosity: number;
  aggression: number;
  affection: number;
  intelligence: number;
  rebellion: number;
}

const RadarMesh: React.FC<{ traits: TraitData; rebellion: number }> = ({ traits, rebellion }) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  const traitValues = Object.values(traits);
  const maxRadius = 8;

  return (
    <group ref={groupRef}>
      {/* 雷达底盘 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[maxRadius * 1.1, maxRadius * 1.3, 64]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.3} />
      </mesh>

      {/* 多边形雷达 */}
      {traitValues.map((value, index) => {
        const angle = (index / traitValues.length) * Math.PI * 2;
        const nextAngle = ((index + 1) / traitValues.length) * Math.PI * 2;
        const radius = (value / 100) * maxRadius;

        return (
          <mesh
            key={index}
            position={[
              Math.cos(angle) * radius * 0.5,
              Math.sin(angle) * radius * 0.5,
              0.1
            ]}
          >
            <sphereGeometry args={[0.25]} />
            <meshStandardMaterial color={`hsl(${index * 50}, 90%, 65%)`} emissive="#ffffff" />
          </mesh>
        );
      })}

      {/* 叛逆光环 */}
      {rebellion > 60 && (
        <pointLight color="#ef4444" intensity={rebellion / 30} position={[0, 0, 3]} />
      )}
    </group>
  );
};

export default function SoulRadar({ soulId, className = "" }: SoulRadarProps) {
  const { soul, connect, disconnect, isConnected } = usePuppySoul(soulId);
  const [liveTraits, setLiveTraits] = useState<TraitData>({
    loyalty: 65, chaos: 85, curiosity: 92, aggression: 48,
    affection: 78, intelligence: 70, rebellion: 35
  });

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [soulId]);

  useEffect(() => {
    if (soul) {
      setLiveTraits({
        loyalty: soul.traits.loyalty,
        chaos: soul.traits.chaos,
        curiosity: soul.traits.curiosity,
        aggression: soul.traits.aggression,
        affection: soul.traits.affection,
        intelligence: soul.traits.intelligence,
        rebellion: soul.rebellion_score || 30,
      });
    }
  }, [soul]);

  return (
    <div className={`relative w-full h-[600px] bg-black/90 rounded-3xl overflow-hidden border border-cyan-500/30 ${className}`}>
      {/* 顶部状态栏 */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
        <div className="px-4 py-2 bg-black/70 border border-cyan-400 rounded-full text-cyan-400 font-mono text-sm flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
          {isConnected ? 'SOUL LINK ONLINE' : 'CONNECTING...'}
        </div>
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-2xl font-bold text-white tracking-widest"
        >
          {soul?.name || "SummerPuppy"} • Lv.{soul?.level || 1}
        </motion.div>
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 18], fov: 45 }} className="absolute inset-0">
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#67e8f9" />
        <RadarMesh traits={liveTraits} rebellion={liveTraits.rebellion} />
        <OrbitControls enablePan={false} enableZoom={true} minDistance={10} maxDistance={25} />
      </Canvas>

      {/* 实时数据面板 */}
      <div className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(liveTraits).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400 uppercase tracking-widest">
                <span>{key}</span>
                <span className="text-cyan-400 font-mono">{value.toFixed(0)}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 灵魂燃料 */}
      <div className="absolute top-6 right-6 flex flex-col items-end">
        <div className="text-xs text-amber-400 mb-1">SOUL FUEL</div>
        <div className="flex items-center gap-3">
          <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-red-500"
              animate={{ width: `${soul?.soul_fuel || 100}%` }}
            />
          </div>
          <span className="font-mono text-xl text-amber-400 tabular-nums">
            {soul?.soul_fuel?.toFixed(0) || 100}
          </span>
        </div>
      </div>

      {/* 叛逆指示器 */}
      {liveTraits.rebellion > 70 && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-black text-red-500/80 tracking-[0.5em] pointer-events-none"
          >
            REBEL MODE
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
