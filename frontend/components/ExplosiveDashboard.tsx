'use client';

import { useState, useEffect } from 'react';
import { Camera, Upload, AlertTriangle, TrendingUp } from 'lucide-react';

export default function ExplosiveDashboard() {
  const [healthScore, setHealthScore] = useState(92);
  const [riskLevel, setRiskLevel] = useState('LOW');

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-red-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent mb-8">
          PUPPYFORGE AI
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Health Score Card */}
          <div className="bg-zinc-900 border border-red-500/30 rounded-3xl p-8 hover:border-red-500 transition-all">
            <h2 className="text-xl text-red-400">HEALTH SCORE</h2>
            <div className="text-8xl font-bold mt-4">{healthScore}</div>
            <div className="text-green-400 text-xl">↑ EXCELLENT</div>
          </div>

          {/* Risk Radar */}
          <div className="bg-zinc-900 border border-cyan-500/30 rounded-3xl p-8">
            <h2 className="text-xl text-cyan-400">RISK RADAR</h2>
            <div className="mt-8 text-5xl font-bold text-red-500">{riskLevel}</div>
            <div className="text-sm mt-4 opacity-70">30-DAY PREDICTION</div>
          </div>

          {/* Quick Diagnose */}
          <div className="bg-zinc-900 border border-purple-500/30 rounded-3xl p-8 flex flex-col justify-center items-center">
            <Camera className="w-16 h-16 mb-4 text-purple-400" />
            <button className="bg-purple-600 hover:bg-purple-700 px-10 py-4 rounded-2xl text-xl font-bold transition-all active:scale-95">
              UPLOAD PHOTO → DIAGNOSE
            </button>
          </div>
        </div>

        <div className="mt-12 text-center text-2xl font-bold tracking-widest text-red-500/80">
          MULTI-AGENT SYSTEM ONLINE • PWA READY • OFFLINE MODE ENABLED
        </div>
      </div>
    </div>
  );
}