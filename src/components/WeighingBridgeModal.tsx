import React, { useState } from 'react';
import {
  X,
  Scale,
  CheckCircle2,
  Receipt,
  Printer,
  Sparkles,
  Wheat,
  Banknote,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';
import { Booking } from '../types/procurement';
import { DEFAULT_COMMODITY_MSP } from '../services/dynamicAllocation';
import { updateBookingStatus } from '../services/bookingStore';

interface WeighingBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onCompleted?: () => void;
}

export const WeighingBridgeModal: React.FC<WeighingBridgeModalProps> = ({
  isOpen,
  onClose,
  booking,
  onCompleted,
}) => {
  if (!isOpen || !booking) return null;

  const mspRate = DEFAULT_COMMODITY_MSP[booking.commodity] || 2275;
  const initialGross = Math.round((booking.quantityQuintals + 22) * 100) / 100;
  const initialTare = 22.0; // Tare weight of empty tractor trolley
  const [grossWeightQuintals, setGrossWeightQuintals] = useState<number>(initialGross);
  const [tareWeightQuintals, setTareWeightQuintals] = useState<number>(initialTare);
  const [moisturePercent, setMoisturePercent] = useState<number>(11.5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSlip, setCompletedSlip] = useState(false);

  // Moisture deduction (Standard acceptable moisture is up to 12.0%)
  const moistureDeduction = moisturePercent > 12.0 ? Math.round((moisturePercent - 12.0) * 0.8 * 10) / 10 : 0;
  const rawNetWeight = Math.max(0, Math.round((grossWeightQuintals - tareWeightQuintals) * 100) / 100);
  const netWeightQuintals = Math.max(0, Math.round((rawNetWeight - moistureDeduction) * 100) / 100);
  const totalAmount = Math.round(netWeightQuintals * mspRate);

  const handleCompleteWeighment = async () => {
    setIsSubmitting(true);
    try {
      await updateBookingStatus(booking.id, 'completed', {
        moisturePercent,
        netWeightQuintals,
        mspRatePerQuintal: mspRate,
        totalPmtAmount: totalAmount,
      });
      setIsSubmitting(false);
      setCompletedSlip(true);
      if (onCompleted) onCompleted();
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-amber-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/60 flex items-center justify-center border border-emerald-500/30">
              <Scale className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Digital Weighbridge Station</h3>
              <p className="text-[11px] text-emerald-200">
                Lanes 01-04 • IoT Calibrated Electronic Scale
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {completedSlip ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-center">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-serif font-bold text-lg text-emerald-950">
                  Procurement Weighment Complete
                </h4>
                <p className="text-xs text-emerald-800 mt-1">
                  Digital payment order generated and transmitted directly to DBT/PFMS bank gateway.
                </p>
              </div>

              {/* Digital Slip preview */}
              <div className="p-4 bg-stone-50 rounded-xl border border-dashed border-stone-300 font-mono text-xs space-y-2">
                <div className="text-center pb-2 border-b border-stone-200 font-bold font-sans">
                  APMC KARNAL PROCUREMENT SLIP
                  <div className="text-[10px] text-stone-500 font-normal">Token #{booking.tokenNumber} • Ref: {booking.id}</div>
                </div>
                <div className="flex justify-between">
                  <span>Farmer:</span>
                  <span className="font-bold">{booking.farmerName} (ID: {booking.farmerId})</span>
                </div>
                <div className="flex justify-between">
                  <span>Commodity:</span>
                  <span className="font-bold">{booking.commodity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vehicle:</span>
                  <span>{booking.vehicleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Weight:</span>
                  <span>{grossWeightQuintals} qtl</span>
                </div>
                <div className="flex justify-between">
                  <span>Tare Weight:</span>
                  <span>{tareWeightQuintals} qtl</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold border-t border-stone-200 pt-1">
                  <span>Net Produce Weight:</span>
                  <span>{netWeightQuintals} Quintals</span>
                </div>
                <div className="flex justify-between text-amber-900 font-bold border-t border-stone-200 pt-1 text-sm">
                  <span>Govt MSP Settlement:</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Weighment Slip
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close & Refresh Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs flex justify-between items-center">
                <div>
                  <span className="text-stone-500 block text-[10px]">Farmer & Vehicle</span>
                  <span className="font-bold text-stone-900">{booking.farmerName}</span>
                  <span className="text-stone-500 ml-1">({booking.vehicleNumber})</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-500 block text-[10px]">Commodity MSP</span>
                  <span className="font-bold text-emerald-800">₹{mspRate}/quintal</span>
                </div>
              </div>

              {/* Digital Scale Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Gross Weight (Scale reading, qtl)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={grossWeightQuintals}
                    onChange={(e) => setGrossWeightQuintals(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-stone-300 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Tare Weight (Empty trolley, qtl)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tareWeightQuintals}
                    onChange={(e) => setTareWeightQuintals(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-stone-300 bg-stone-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex justify-between">
                  <span>Moisture Sensor Reading: {moisturePercent}%</span>
                  <span className="text-[10px] text-emerald-700 font-normal">Standard: ≤ 12%</span>
                </label>
                <input
                  type="range"
                  min="9"
                  max="16"
                  step="0.1"
                  value={moisturePercent}
                  onChange={(e) => setMoisturePercent(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              {/* Live Calculated Net Weight & Payout */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600">Net Wheat Procured:</span>
                  <span className="font-mono font-bold text-base text-emerald-950">
                    {netWeightQuintals} Quintals
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-emerald-200/60">
                  <span className="text-stone-600 font-medium">Direct Farmer Bank Payout:</span>
                  <span className="font-bold text-lg text-emerald-800">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCompleteWeighment}
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Receipt className="w-4 h-4 text-amber-300" />
                {isSubmitting ? 'Recording on Cloud...' : 'Commit Weighment & Finalize Transaction'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
