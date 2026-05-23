// components/HealthTrendChart.tsx
// ========================================
// 健康趋势图表组件
// ========================================

'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface DataPoint {
  date: string;
  score: number;
}

interface HealthTrendChartProps {
  data?: DataPoint[];
  days?: number;
}

export default function HealthTrendChart({ 
  data = [], 
  days = 7 
}: HealthTrendChartProps) {
  // 生成模拟数据（如果没有真实数据）
  const chartData = data.length > 0 ? data : generateMockData(days);
  
  const maxScore = 100;
  const minScore = 0;
  const height = 200;
  const width = 600;
  const padding = 40;
  
  // 计算坐标
  const points = chartData.map((point, index) => {
    const x = padding + (index / (chartData.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((point.score - minScore) / (maxScore - minScore)) * (height - 2 * padding);
    return { x, y, ...point };
  });
  
  // 生成 SVG 路径
  const pathD = points.map((point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    return `L ${point.x} ${point.y}`;
  }).join(' ');
  
  // 计算趋势
  const latestScore = chartData[chartData.length - 1]?.score || 0;
  const previousScore = chartData[chartData.length - 2]?.score || 0;
  const trend = latestScore >= previousScore ? 'up' : 'down';
  const diff = latestScore - previousScore;
  
  return (
    <div className="bg-zinc-900 border border-blue-500/30 rounded-3xl p-8 hover:border-blue-500 transition-all">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl text-blue-400">健康趋势</h2>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
          trend === 'up' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
        }`}>
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{diff > 0 ? '+' : ''}{diff.toFixed(0)}</span>
        </div>
      </div>
      
      <div className="relative" style={{ height: `${height}px` }}>
        <svg 
          width="100%" 
          height={height} 
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
        >
          {/* 网格线 */}
          {[0, 25, 50, 75, 100].map((value) => {
            const y = height - padding - (value / 100) * (height - 2 * padding);
            return (
              <g key={value}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#3f3f46"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-zinc-500 text-xs"
                >
                  {value}
                </text>
              </g>
            );
          })}
          
          {/* 渐变填充 */}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* 面积区域 */}
          <path
            d={`${pathD} L ${points[points.length - 1]?.x} ${height - padding} L ${points[0]?.x} ${height - padding} Z`}
            fill="url(#areaGradient)"
          />
          
          {/* 折线 */}
          <path
            d={pathD}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* 数据点 */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="#1e293b"
                stroke="#3b82f6"
                strokeWidth="2"
                className="hover:r-8 transition-all cursor-pointer"
              />
              {index % Math.ceil(points.length / 7) === 0 && (
                <text
                  x={point.x}
                  y={height - padding + 20}
                  textAnchor="middle"
                  className="fill-zinc-500 text-xs"
                >
                  {formatDate(point.date)}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      
      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-800">
        <div>
          <div className="text-xs text-zinc-500">平均分</div>
          <div className="text-lg font-bold text-white">
            {calculateAverage(chartData).toFixed(0)}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">最高分</div>
          <div className="text-lg font-bold text-emerald-400">
            {Math.max(...chartData.map(d => d.score))}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">最低分</div>
          <div className="text-lg font-bold text-red-400">
            {Math.min(...chartData.map(d => d.score))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 辅助函数
function generateMockData(days: number): DataPoint[] {
  const data: DataPoint[] = [];
  const today = new Date();
  let baseScore = 85;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 随机波动
    baseScore += (Math.random() - 0.5) * 10;
    baseScore = Math.max(60, Math.min(100, baseScore));
    
    data.push({
      date: date.toISOString().split('T')[0],
      score: Math.round(baseScore),
    });
  }
  
  return data;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

function calculateAverage(data: DataPoint[]): number {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, point) => acc + point.score, 0);
  return sum / data.length;
}
