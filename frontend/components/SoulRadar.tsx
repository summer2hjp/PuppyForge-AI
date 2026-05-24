'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSoulWebSocket } from '@/hooks/useSoulWebSocket';

interface SoulRadarProps {
  soulId?: string;
}

const TRAIT_COLORS: Record<string, string> = {
  loyalty: '#22ff88',
  chaos: '#ff2d55',
  curiosity: '#00f5ff',
  aggression: '#ff8800',
  affection: '#ff44dd',
  intelligence: '#bb77ff',
};

export default function SoulRadar({ soulId = 'default_mad_dog' }: SoulRadarProps) {
  const { soul, isConnected } = useSoulWebSocket(soulId);
  const svgRef = useRef<SVGSVGElement>(null);

  const traits = soul?.traits || {
    loyalty: 65, chaos: 85, curiosity: 92, aggression: 48, affection: 78, intelligence: 70
  };

  const traitEntries = Object.entries(traits);

  // 雷达图数据点计算
  const points = traitEntries.map(([key, value], index) => {
    const angle = (index * (360 / traitEntries.length)) * (Math.PI / 180);
    const radius = (value / 100) * 120; // 最大半径120px
    return {
      key,
      x: Math.cos(angle) * radius + 150,
      y: Math.sin(angle) * radius + 150,
      value,
      label: key.toUpperCase(),
      color: TRAIT_COLORS[key] || '#ffffff'
    };
  });

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="w-full max-w-[380px] mx-auto">
      <div className="relative bg-zinc-950 border border-[#ff2d55]/30 rounded-3xl p-6 overflow-hidden">
        {/* 标题 + 连接状态 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ff2d55] to-[#00f5ff] bg-clip-text text-transparent">
            灵魂雷达
          </h2>
          <div className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {isConnected ? '实时共振' : '本地模式'}
          </div>
        </div>

        {/* 雷达图 */}
        <div className="relative mx-auto" style={{ width: '300px', height: '300px' }}>
          <svg ref={svgRef} width="300" height="300" className="drop-shadow-2xl">
            {/* 背景网格 */}
            {[0.2, 0.4, 0.6, 0.8, 1].map((r, i) => (
              <circle
                key={i}
                cx="150"
                cy="150"
                r={r * 120}
                fill="none"
                stroke="#ffffff"
                strokeOpacity="0.08"
                strokeWidth="1"
              />
            ))}

            {/* 雷达多边形 */}
            <motion.polygon
              points={polygonPoints}
              fill="rgba(255, 45, 85, 0.15)"
              stroke="#ff2d55"
              strokeWidth="3"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            {/* 连接线 + 数据点 */}
            {points.map((point, index) => (
              <g key={index}>
                <line
                  x1="150"
                  y1="150"
                  x2={point.x}
                  y2={point.y}
                  stroke={point.color}
                  strokeOpacity="0.3"
                  strokeWidth="1.5"
                />
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill={point.color}
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                />
              </g>
            ))}
          </svg>

          {/* 标签 */}
          {points.map((point, index) => (
            <motion.div
              key={index}
              className="absolute text-xs font-mono font-bold pointer-events-none"
              style={{
                left: `${point.x - 20}px`,
                top: `${point.y - 20}px`,
                color: point.color,
              }}
              animate={{ opacity: [0.7, 1, 0.7] }}
            >
              {point.label}<br />
              <span className="text-lg">{Math.round(point.value)}</span>
            </motion.div>
          ))}
        </div>

        {/* 状态栏 */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-[#ff2d55]">等级</div>
            <div className="text-3xl font-bold text-white">{soul?.level || 1}</div>
          </div>
          <div>
            <div className="text-[#00f5ff]">阶段</div>
            <div className="text-xl font-bold capitalize text-white">{soul?.evolutionStage || 'puppy'}</div>
          </div>
          <div>
            <div className="text-[#bb77ff]">互动</div>
            <div className="text-3xl font-bold text-white">{soul?.totalInteractions || 0}</div>
          </div>
        </div>

        {/* 进化提示 */}
        {soul && soul.level > 10 && (
          <motion.div 
            className="mt-4 text-center text-xs py-2 bg-gradient-to-r from-[#ff2d55]/10 to-transparent border border-[#ff2d55]/30 rounded-2xl"
            animate={{ opacity: [0.6, 1] }}
          >
            🌀 性格正在剧烈漂移中...
          </motion.div>
        )}
      </div>
    </div>
  );
}
