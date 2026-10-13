import React, { useState } from 'react';
import {
  X,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Truck,
  User,
  Wheat,
  Clock,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { Booking } from '../types/procurement';
import { updateBookingStatus } from '../services/bookingStore';

interface GateScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  onPassVerified?: (booking: Booking) => void;
}

export const GateScannerModal: React.FC<GateScannerModalProps> = ({
  isOpen,
  onClose,
  bookings,
  onPassVerified,
}) => {
  const [searchCode, setSearchCode] = useState('');
  const [scannedBooking, setScannedBooking] = useState<Booking | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSimulateScan = (booking: Booking) => {
    setScannedBooking(booking);
    setSearchCode(booking.farmerId);
  };

  const handleSearchOrScan = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchCode.trim().toLowerCase();
    const found = bookings.find(
      (b) =>
        b.farmerId.toLowerCase() === query ||
        b.id.toLowerCase() === query ||
        b.vehicleNumber.toLowerCase().includes(query)
    );
    if (found) {
      setScannedBooking(found);
      setSuccessMsg(null);
    } else {
      alert(`No active booking found for "${searchCode}". Try Farmer ID: 12345 or select from quick list.`);
    }
  };

  const handleAdmitToMandi = async () => {
    if (!scannedBooking) return;
    setIsProcessing(true);
    try {
      await updateBookingStatus(scannedBooking.id, 'at_gate');
      setSuccessMsg(`Gate entry verified! Farmer ${scannedBooking.farmerName} admitted to Weighbridge Lane 2.`);
      if (onPassVerified) onPassVerified({ ...scannedBooking, status: 'at_gate' });
      setIsProcessing(false);
      setTimeout(() => {
        setSuccessMsg(null);
        setScannedBooking(null);
        setSearchCode('');
      }, 2500);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-amber-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/60 flex items-center justify-center border border-emerald-500/30">
              <QrCode className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Gate Entry QR Scanner</h3>
              <p className="text-[11px] text-emerald-200">
                APMC Mandi Entrance • Terminal-01 Lane A
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
        <div className="p-6 space-y-5">
          {/* Simulated Scanner Viewfinder */}
          <div className="relative bg-stone-950 rounded-2xl p-6 text-center text-white overflow-hidden border-2 border-emerald-500/50">
            {/* Animated laser line */}
            <div className="absolute inset-x-6 top-8 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce pointer-events-none"></div>

            <div className="w-36 h-36 border-2 border-dashed border-emerald-400/80 rounded-xl mx-auto flex flex-col items-center justify-center bg-emerald-950/30 p-2">
              <QrCode className="w-16 h-16 text-emerald-400 opacity-80" />
              <span className="text-[10px] text-emerald-300 mt-1 uppercase font-mono">
                Camera Active
              </span>
            </div>

            <p className="text-xs text-stone-300 mt-3 font-medium">
              Point scanner at the farmer's Digital Gate Entry Pass
            </p>
          </div>

          {/* Quick Manual Entry / Search */}
          <form onSubmit={handleSearchOrScan} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Scan or enter Farmer ID (e.g. 12345) / Vehicle"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-stone-50"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
            >
              Verify Pass
            </button>
          </form>

          {/* Scanned Pass Preview */}
          {scannedBooking ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-stone-900 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pass Verified: Token #{scannedBooking.tokenNumber}
                </span>
                <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                  ID: {scannedBooking.farmerId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-stone-500 block text-[10px]">Farmer Name</span>
                  <span className="font-semibold text-stone-900">{scannedBooking.farmerName}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px]">Commodity & Qty</span>
                  <span className="font-semibold text-amber-900 flex items-center gap-1">
                    <Wheat className="w-3.5 h-3.5 text-amber-700" />
                    {scannedBooking.commodity} ({scannedBooking.quantityQuintals} qtl)
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px]">Allocated Slot</span>
                  <span className="font-bold text-emerald-800">{scannedBooking.allocatedSlot}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px]">Vehicle</span>
                  <span className="font-semibold font-mono text-stone-900">{scannedBooking.vehicleNumber}</span>
                </div>
              </div>

              {successMsg ? (
                <div className="p-2.5 rounded-lg bg-emerald-200 text-emerald-900 text-xs font-bold text-center">
                  {successMsg}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAdmitToMandi}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  {isProcessing ? 'Admitting...' : 'Authorize Gate Entry & Open Barrier'}
                </button>
              )}
            </div>
          ) : (
            <div>
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                Or Click Any Registered Farmer To Test Scan:
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {bookings.slice(0, 5).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleSimulateScan(b)}
                    className="w-full text-left p-2 rounded-lg border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center justify-between text-xs transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-stone-900">{b.farmerName}</span>
                      <span className="text-stone-500 ml-2">ID: {b.farmerId} • {b.commodity}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded">
                      {b.allocatedSlot.includes('02:00 PM') ? '2 PM' : b.allocatedSlot.split(' - ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
