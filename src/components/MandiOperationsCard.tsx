import React from 'react';
import {
  Gauge,
  Clock,
  Scale,
  Sparkles,
  CheckCircle,
  Truck,
  TrendingDown,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface MandiOperationsCardProps {
  slotsFilledPercent: number;
  avgWaitTime: number;
  totalBookings: number;
  targetDateStr?: string;
  onOpenGateScanner?: () => void;
  onOpenQuickBooking?: () => void;
}

export const MandiOperationsCard: React.FC<MandiOperationsCardProps> = ({
  slotsFilledPercent,
  avgWaitTime,
  totalBookings,
  targetDateStr = 'Live Today',
  onOpenGateScanner,
  onQuickBooking,
}: {
  slotsFilledPercent: number;
  avgWaitTime: number;
  totalBookings: number;
  targetDateStr?: string;
  onOpenGateScanner?: () => void;
  onQuickBooking?: () => void;
}) => {
  // Determine color coding based on %
  const getProgressColor = (pct: number) => {
    if (pct < 60) return 'from-emerald-500 to-emerald-600';
    if (pct < 85) return 'from-emerald-600 to-amber-500';
    return 'from-amber-500 to-emerald-700';
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header matching Slide 7 */}
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-stone-900 text-base sm:text-lg">
                Mandi Operations
              </h3>
              <span className="text-[11px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                APMC Real-Time
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Live updates in {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
            <Gauge className="w-5 h-5 text-emerald-700" />
          </div>
        </div>

        {/* Primary Metric 1: Slots Filled Progress Bar matching Slide 7 */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-semibold text-stone-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-700" />
              Slots Filled:
            </span>
            <span className="font-extrabold text-stone-900 font-mono text-base">
              {slotsFilledPercent}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3.5 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200 shadow-inner">
            <div
              style={{ width: `${Math.min(100, Math.max(8, slotsFilledPercent))}%` }}
              className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(
                slotsFilledPercent
              )} transition-all duration-700 ease-out`}
            ></div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-stone-400 mt-1 font-mono">
            <span>0% (Empty Mandi)</span>
            <span>Capacity Target: 85% Optimal</span>
            <span>100% (Full Cap)</span>
          </div>
        </div>

        {/* Primary Metric 2: Avg. Wait Time matching Slide 7 */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-white to-amber-50 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
              <Clock className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Mandi Gate & Scale
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-950 font-serif">
                Avg. Wait: <span className="text-emerald-700 font-sans">{avgWaitTime} min</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
              <TrendingDown className="w-3 h-3 text-emerald-800" />
              -97% vs 48 hrs
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">Pre-AgriSync baseline</span>
          </div>
        </div>

        {/* Secondary Operational Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-stone-500 text-[11px] block">Weighbridge Lanes</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 block flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-700" />
              4 of 4 Operational
            </span>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-stone-500 text-[11px] block">Moisture Quality Check</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 block flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              100% Digital Passed
            </span>
          </div>
        </div>
      </div>

      {/* Admin Action Bar */}
      <div className="mt-5 pt-4 border-t border-stone-100 flex items-center gap-2">
        {onOpenGateScanner && (
          <button
            onClick={onOpenGateScanner}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>Launch Gate QR Scanner</span>
          </button>
        )}
      </div>
    </div>
  );
};
