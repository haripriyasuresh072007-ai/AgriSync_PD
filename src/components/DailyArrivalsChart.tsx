import React, { useState } from 'react';
import { BarChart3, TrendingUp, Info } from 'lucide-react';
import { MandiDayArrival } from '../types/procurement';

interface DailyArrivalsChartProps {
  data: MandiDayArrival[];
}

export const DailyArrivalsChart: React.FC<DailyArrivalsChartProps> = ({ data }) => {
  const [metric, setMetric] = useState<'arrivals' | 'tonnes'>('arrivals');
  const [hoveredDay, setHoveredDay] = useState<MandiDayArrival | null>(null);

  const maxValue = Math.max(
    ...data.map((d) => (metric === 'arrivals' ? d.arrivals : d.wheatTonnes + d.otherTonnes))
  );

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
      {/* Card Header matching Slide 7 */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-stone-900 text-base sm:text-lg">
              Daily Arrivals
            </h3>
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              Weekly APMC Intake
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Procurement volume trends across APMC Karnal
          </p>
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setMetric('arrivals')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              metric === 'arrivals'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Arrivals (Vehicles)
          </button>
          <button
            onClick={() => setMetric('tonnes')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              metric === 'tonnes'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Tonnes (Produce)
          </button>
        </div>
      </div>

      {/* Bar Chart Area */}
      <div className="pt-2 pb-1">
        <div className="h-52 sm:h-56 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-stone-200 relative">
          {/* Horizontal guide lines */}
          <div className="absolute inset-x-0 top-0 border-b border-stone-100 border-dashed pointer-events-none"></div>
          <div className="absolute inset-x-0 top-1/4 border-b border-stone-100 border-dashed pointer-events-none"></div>
          <div className="absolute inset-x-0 top-2/4 border-b border-stone-100 border-dashed pointer-events-none"></div>
          <div className="absolute inset-x-0 top-3/4 border-b border-stone-100 border-dashed pointer-events-none"></div>

          {data.map((item, index) => {
            const val = metric === 'arrivals' ? item.arrivals : item.wheatTonnes + item.otherTonnes;
            const heightPercent = Math.max(12, Math.round((val / maxValue) * 100));
            const isToday = item.day === 'Sun' || index === data.length - 1;

            return (
              <div
                key={item.day}
                className="flex-1 flex flex-col items-center group relative cursor-pointer"
                onMouseEnter={() => setHoveredDay(item)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {/* Tooltip on hover */}
                {hoveredDay?.day === item.day && (
                  <div className="absolute -top-16 z-20 bg-stone-900 text-white text-[11px] p-2 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                    <div className="font-bold text-amber-300">
                      {item.day} ({item.date}): {val} {metric === 'arrivals' ? 'Trucks' : 'Tonnes'}
                    </div>
                    <div className="text-stone-300 text-[10px]">
                      Wheat: {item.wheatTonnes} T • Avg Wait: {item.avgWaitMins} min
                    </div>
                  </div>
                )}

                {/* Bar Value on top */}
                <span className="text-[10px] font-bold text-stone-600 mb-1 opacity-80 group-hover:opacity-100 group-hover:text-emerald-800">
                  {val}
                </span>

                {/* The Bar */}
                <div className="w-full max-w-[36px] bg-stone-100 rounded-t-lg overflow-hidden flex flex-col justify-end transition-all h-full">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-lg transition-all duration-500 ease-out ${
                      isToday
                        ? 'bg-gradient-to-t from-amber-500 to-amber-400 group-hover:from-amber-600 group-hover:to-amber-500'
                        : 'bg-gradient-to-t from-emerald-600 to-emerald-500 group-hover:from-emerald-700 group-hover:to-emerald-600'
                    }`}
                  ></div>
                </div>

                {/* Day label below */}
                <div className="mt-2 text-center">
                  <span
                    className={`text-xs block font-semibold ${
                      isToday ? 'text-amber-700 font-bold' : 'text-stone-600'
                    }`}
                  >
                    {item.day}
                  </span>
                  <span className="text-[10px] text-stone-400 block">{item.date}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-stone-500 mt-4 px-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600"></span>
              Procured Days
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500"></span>
              Today's Live Flow
            </span>
          </div>
          <span className="text-[11px] text-stone-400">
            Total this week: <strong>615 Vehicles / 2,815 Tonnes</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
