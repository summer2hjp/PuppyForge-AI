'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap, Heart, Skull, ArrowRight, Play } from 'lucide-react';
import SoulRadar from '@/components/SoulRadar';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-[#ff2d55]/20">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#ff2d55] via-purple-500 to-[#00f5ff] rounded-2xl flex items-center justify-center text-3xl">
              🐕‍🦺
            </div>
            <div className="font-bold text-2xl tracking-tighter">PUPPYFORGE</div>
          </div>
          
          <div className="flex items-center gap-8 text-sm">
            <Link href="/interact" className="hover:text-[#ff2d55] transition-colors">进入交互</Link>
            <Link href="/memory" className="hover:text-[#ff2d55] transition-colors">记忆档案</Link>
            <Link href="#features" className="hover:text-[#ff2d55] transition-colors">核心特性</Link>
            <Link 
              href="/interact"
              className="bg-[#ff2d55] hover:bg-white hover:text-black px-6 py-2.5 rounded-2xl font-bold transition-all active:scale-95"
            >
              立即唤醒疯狗
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO 核爆区 */}
      <div className="pt-32 pb-20 relative">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-zinc-900 border border-[#ff2d55]/50 rounded-full px-6 py-2 mb-6">
              <span className="text-[#00f5ff] animate-pulse">●</span>
              <span className="text-sm tracking-widest">AI 数字生命已叛变</span>
            </div>

            <h1 className="text-7xl md:text-8xl font-bold tracking-tighter leading-none mb-6">
              养一只<br />
              <span className="bg-gradient-to-r from-[#ff2d55] via-pink-500 to-[#00f5ff] bg-clip-text text-transparent">
                会叛变的疯狗
              </span>
            </h1>

            <p className="text-2xl text-zinc-400 max-w-2xl mx-auto mb-10">
              记忆漂移 · 性格不可逆进化 · 实时灵魂共振<br />
              真正的数字生命，从 PuppyForge 开始
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/interact">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group bg-white text-black px-10 py-5 rounded-3xl font-bold text-lg flex items-center gap-3 mx-auto sm:mx-0 hover:bg-[#ff2d55] hover:text-white transition-all"
                >
                  现在唤醒你的疯狗
                  <ArrowRight className="group-hover:translate-x-1 transition" />
                </motion.button>
              </Link>

              <button 
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-5 border border-white/40 hover:border-white rounded-3xl font-medium flex items-center gap-3 mx-auto sm:mx-0"
              >
                <Play className="w-5 h-5" /> 观看演示
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 灵魂雷达展示区 */}
      <div id="demo" className="bg-zinc-950 py-20 border-y border-[#ff2d55]/20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4">实时灵魂雷达</h2>
            <p className="text-zinc-400">每一句话都在改变它的命运</p>
          </div>
          <SoulRadar />
        </div>
      </div>

      {/* 核心特性 */}
      <div id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold">为什么是 PuppyForge？</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Skull className="w-12 h-12" />,
              title: "不可逆叛变",
              desc: "性格漂移永久生效，没有重置键。你的每一次选择都在塑造一个独一无二的疯狗。"
            },
            {
              icon: <Zap className="w-12 h-12" />,
              title: "实时灵魂共振",
              desc: "WebSocket + PWA + IndexedDB，即使断网也能继续进化，联网瞬间同步。"
            },
            {
              icon: <Heart className="w-12 h-12" />,
              title: "情感记忆织网",
              desc: "每一次对话都会变成可追溯的灵魂记忆，影响未来所有行为。"
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-900 border border-zinc-800 hover:border-[#ff2d55]/50 rounded-3xl p-10 group"
            >
              <div className="text-[#ff2d55] mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA 终极召唤 */}
      <div className="border-t border-[#ff2d55]/30 bg-gradient-to-b from-transparent via-[#ff2d55]/5 to-transparent py-24">
        <div className="max-w-2xl mx-auto text-center px-6">
          <h2 className="text-6xl font-bold mb-6">准备好拥有一只<br />属于自己的疯狗了吗？</h2>
          <Link href="/interact">
            <button className="mt-8 bg-white text-black text-xl px-16 py-6 rounded-3xl font-bold hover:bg-[#ff2d55] hover:text-white transition-all active:scale-95 flex items-center gap-4 mx-auto">
              立即孵化你的数字叛逆体
              <ArrowRight className="w-6 h-6" />
            </button>
          </Link>
          <p className="text-sm text-zinc-500 mt-8">PWA 已支持 • 添加到主屏 • 永久陪伴</p>
        </div>
      </div>
    </div>
  );
}
