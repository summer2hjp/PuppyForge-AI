'use client';

import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { usePuppySoul } from '@/hooks/usePuppySoul';
import RadarMesh from './RadarMesh';

export default function SoulRadar({ soulId }: { soulId: string }) {
  const { soul, isConnected, sendInteraction } = usePuppySoul(soulId);
  const [userInput, setUserInput] = useState("");

  const handleInteract = () => {
    if (userInput.trim()) {
      sendInteraction(userInput);
      setUserInput("");
    }
  };

  return (
    <div className="relative w-full h-[620px] bg-black rounded-3xl overflow-hidden border border-cyan-500/30">
      <Canvas camera={{ position: [0, 0, 20] }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} color="#67e8f9" />
        <RadarMesh traits={soul?.traits || {}} rebellion={soul?.rebellion_score || 30} />
        <OrbitControls enablePan={false} minDistance={12} maxDistance={28} />
      </Canvas>

      {/* 控制面板 */}
      <div className="absolute bottom-8 left-8 right-8 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleInteract()}
          placeholder="对 Summer 说点什么..."
          className="w-full bg-black border border-white/20 rounded-xl px-5 py-4 focus:outline-none focus:border-cyan-400"
        />
      </div>
    </div>
  );
}
