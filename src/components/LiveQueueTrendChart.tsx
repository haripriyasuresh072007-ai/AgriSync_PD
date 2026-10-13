import React from 'react';
import { Activity, Clock, TrendingDown, Users, CheckCircle2 } from 'lucide-react';
import { QueueTrendPoint } from '../types/procurement';

interface LiveQueueTrendChartProps {
  currentQueueSize: number;
  totalToday: number;
  atGateCount: number;
  weighingCount: number;
  completedCount: number;
  trendData: QueueTrendPoint[];
}

export const LiveQueueTrendChart: React.FC<LiveQueueTrendChartProps> = ({
  currentQueueSize,
  totalToday,
  atGateCount,
  weighingCount,
  completedCount,
  trendData,
}) => {
  // SVG dimension calculations
  const width = 460;
  const height = 140;
  const paddingX = 30;
  const paddingY = 20;

  const maxQueue = Math.max(30, ...trendData.map((d) => d.queueSize));

  // Compute SVG polyline points
  const points = trendData
    .map((d, index) => {
      const x = paddingX + (index / (trendData.length - 1)) * (width - 2 * paddingX);
      const y = height - paddingY - (d.queueSize / maxQueue) * (height - 2 * paddingY);
      return `${x},${y}`;
    })
    .join(' ');

  // Compute area under curve
  const firstPointX = paddingX;
  const lastPointX = width - paddingX;
  const baselineY = height - paddingY;
  const areaPath = `M ${points.split(' ')[0]} L ${points} L ${lastPointX},${baselineY} L ${firstPointX},${baselineY} Z`;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
      {/* Header matching Slide 7 */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-stone-900 text-base sm:text-lg">
                Live Queue Status
              </h3>
              <span className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Live Updates in Real Time
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Real-time graph in reduced wait times
            </p>
          </div>

          {/* Current Queue metric box matching Slide 7 */}
          <div className="text-right">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-semibold">
              Current Queue
            </span>
            <div className="text-3xl font-extrabold text-emerald-800 font-mono tracking-tight flex items-baseline justify-end gap-1">
              <span>{currentQueueSize}</span>
              <span className="text-xs text-stone-500 font-normal">Vehicles</span>
            </div>
          </div>
        </div>

        {/* Breakdown counters */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="bg-stone-50 p-2 rounded-xl border border-stone-200">
            <span className="text-[10px] text-stone-500 block">At Gate Verification</span>
            <span className="text-sm font-bold text-stone-900">{atGateCount}</span>
          </div>
          <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-200">
            <span className="text-[10px] text-amber-800 block">On Weighbridge</span>
            <span className="text-sm font-bold text-amber-900">{weighingCount}</span>
          </div>
          <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-200">
            <span className="text-[10px] text-emerald-800 block">Completed Today</span>
            <span className="text-sm font-bold text-emerald-900">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* SVG Trend Graph matching Slide 7 */}
      <div className="mt-4 pt-2">
        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 sm:h-32 overflow-visible">
            <defs>
              <linearGradient id="queueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Background grid line */}
            <line
              x1={paddingX}
              y1={baselineY}
              x2={lastPointX}
              y2={baselineY}
              stroke="#e7e5e4"
              strokeWidth="1"
            />
            <line
              x1={paddingX}
              y1={paddingY}
              x2={lastPointX}
              y2={paddingY}
              stroke="#f5f5f4"
              strokeDasharray="4 4"
              strokeWidth="1"
            />

            {/* Filled area */}
            <path d={areaPath} fill="url(#queueGradient)" />

            {/* Trend line */}
            <polyline
              fill="none"
              stroke="#059669"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />

            {/* Data points */}
            {trendData.map((d, index) => {
              const x = paddingX + (index / (trendData.length - 1)) * (width - 2 * paddingX);
              const y = height - paddingY - (d.queueSize / maxQueue) * (height - 2 * paddingY);
              const isLast = index === trendData.length - 1;

              return (
                <g key={d.timeLabel}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isLast ? '5' : '3.5'}
                    className={isLast ? 'fill-amber-500 stroke-white stroke-2' : 'fill-emerald-700 stroke-white stroke-2'}
                  />
                  {/* Time label below */}
                  <text
                    x={x}
                    y={height - 2}
                    textAnchor="middle"
                    className="text-[9px] fill-stone-400 font-medium"
                  >
                    {d.timeLabel.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2 px-1">
          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
            <TrendingDown className="w-3.5 h-3.5" />
            Queue flattened by 68% vs unmanaged APMC peak
          </span>
          <span className="text-stone-400">Total Bookings Today: {totalToday}</span>
        </div>
      </div>
    </div>
  );
};
