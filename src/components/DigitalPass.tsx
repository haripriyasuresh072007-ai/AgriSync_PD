import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  CheckCircle,
  Clock,
  Wheat,
  User,
  Truck,
  Building2,
  Download,
  Share2,
  Printer,
  ShieldCheck,
  RefreshCw,
  QrCode as QrCodeIcon,
  Sparkles,
  Smartphone,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { Booking } from '../types/procurement';
import { updateBookingStatus } from '../services/bookingStore';

interface DigitalPassProps {
  booking: Booking | null;
  onOpenGateScanner?: () => void;
  onBookAnother?: () => void;
  onViewAdmin?: () => void;
}

export const DigitalPass: React.FC<DigitalPassProps> = ({
  booking,
  onOpenGateScanner,
  onBookAnother,
  onViewAdmin,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'phone' | 'card'>('phone');
  const [isVerifyingGate, setIsVerifyingGate] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  // Generate real QR code when booking changes
  useEffect(() => {
    if (!booking) return;

    const payload = booking.qrPayload || JSON.stringify({
      id: booking.id,
      farmerId: booking.farmerId,
      commodity: booking.commodity,
      slot: booking.allocatedSlot,
      mandi: booking.mandiName,
    });

    QRCode.toDataURL(payload, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#064e3b', // Deep emerald
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [booking]);

  if (!booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-300">
          <QrCodeIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">No Active Gate Entry Pass</h2>
        <p className="text-sm text-stone-600 mt-2">
          You haven't booked a procurement slot yet. Visit the Farmer Portal to book your slot for wheat and generate your instant QR pass.
        </p>
        <button
          onClick={onBookAnother}
          className="mt-6 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
        >
          Go to Farmer Portal
        </button>
      </div>
    );
  }

  const handleShareSms = () => {
    const text = `AgriSync Gate Pass: ID: ${booking.farmerId}, Slot: ${booking.allocatedSlot}, Commodity: ${booking.commodity}, Mandi: ${booking.mandiName}, Ref: ${booking.id}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSimulateGateCheckin = async () => {
    setIsVerifyingGate(true);
    try {
      await updateBookingStatus(booking.id, 'at_gate');
      setIsVerifyingGate(false);
    } catch (e) {
      console.error(e);
      setIsVerifyingGate(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Digital Token Generated
            </span>
            <span className="text-xs text-stone-500 font-mono">Ref: {booking.id}</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 mt-1">
            Confirmed Gate Entry Pass
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="bg-stone-200 p-1 rounded-lg flex items-center text-xs">
            <button
              onClick={() => setViewMode('phone')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                viewMode === 'phone'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Mobile Phone View</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-700" />
              <span>Printable Pass</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="p-2 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 transition-colors"
            title="Print Pass"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={handleShareSms}
            className="p-2 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 transition-colors relative"
            title="Copy SMS details"
          >
            <Share2 className="w-4 h-4" />
            {copied && (
              <span className="absolute -top-7 right-0 bg-stone-900 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap">
                Copied!
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main presentation: Phone Mockup matching Slide 7 */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
        {/* The Digital Pass Card / Phone Container */}
        <div
          ref={printableRef}
          className={`transition-all duration-300 ${
            viewMode === 'phone'
              ? 'w-full max-w-[360px] rounded-[44px] p-3.5 bg-stone-900 shadow-2xl ring-12 ring-stone-800/80 border-4 border-stone-700'
              : 'w-full max-w-md rounded-2xl bg-white shadow-xl border border-stone-200'
          }`}
        >
          {/* Inner Phone Screen */}
          <div
            className={`bg-white overflow-hidden text-stone-900 ${
              viewMode === 'phone' ? 'rounded-[36px] min-h-[580px] flex flex-col justify-between' : 'rounded-2xl p-6'
            }`}
          >
            {/* Phone Notch & Status bar */}
            {viewMode === 'phone' && (
              <div className="pt-2 px-6 flex justify-between items-center text-[10px] text-stone-500 font-semibold border-b border-stone-100 pb-2">
                <span>9:41</span>
                <div className="w-16 h-3.5 bg-stone-900 rounded-full mx-auto"></div>
                <div className="flex items-center gap-1 text-[10px]">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>
            )}

            {/* Pass Content matching Slide 7 EXACTLY */}
            <div className={viewMode === 'phone' ? 'px-6 py-4 text-center' : 'text-center'}>
              {/* Header Title: "Gate Entry Pass" */}
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-950 font-serif">
                Gate Entry Pass
              </h2>
              <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                {booking.mandiName}
              </p>

              {/* QR Code Container */}
              <div className="my-4 flex flex-col items-center justify-center">
                <div className="p-3 bg-white rounded-2xl border-2 border-stone-200 shadow-sm relative group">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Gate Entry QR Code"
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-stone-100 flex items-center justify-center text-stone-400">
                      <QrCodeIcon className="w-12 h-12 animate-pulse" />
                    </div>
                  )}

                  {/* Corner scan anchors */}
                  <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-600"></div>
                  <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-600"></div>
                  <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-600"></div>
                  <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-600"></div>
                </div>
                <span className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider font-mono">
                  Scan at APMC Weighbridge Gate
                </span>
              </div>

              {/* Exact Fields from Slide 7:
                  Farmer ID: 12345
                  Slot: 2 PM
                  Commodity: Wheat
              */}
              <div className="space-y-2.5 text-left bg-stone-50 p-4 rounded-xl border border-stone-200 font-sans">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-500 font-medium">Farmer ID:</span>
                  <span className="font-bold font-mono text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                    {booking.farmerId}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-500 font-medium">Slot:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {booking.allocatedSlot.includes('02:00 PM') ? '2 PM' : booking.allocatedSlot.split(' - ')[0]}
                    <span className="text-stone-400 text-xs ml-1 font-normal">({booking.allocatedSlot})</span>
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-500 font-medium">Commodity:</span>
                  <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                    <Wheat className="w-3.5 h-3.5 text-amber-700" />
                    {booking.commodity}
                  </span>
                </div>

                <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-xs text-stone-600">
                  <span>Quantity & Vehicle:</span>
                  <span className="font-semibold text-stone-900">
                    {booking.quantityQuintals} Quintals • {booking.vehicleNumber}
                  </span>
                </div>
              </div>

              {/* Status and Big Green Checkmark matching Slide 7 */}
              <div className="mt-4 flex flex-col items-center justify-center pb-2">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  <CheckCircle className="w-7 h-7 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold text-emerald-800 mt-1 uppercase tracking-wide">
                  Verified Gate Access
                </span>
                <span className="text-[11px] text-stone-500">
                  Est. physical wait time: ~12-15 minutes
                </span>
              </div>
            </div>

            {/* Bottom bar of phone */}
            {viewMode === 'phone' && (
              <div className="pb-2 pt-1 text-center">
                <div className="w-32 h-1 bg-stone-300 rounded-full mx-auto"></div>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Information, Physical gate verification simulator & Actions */}
        <div className="max-w-md w-full space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
            <h3 className="font-bold text-stone-900 flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Dynamic Scheduling Highlights
            </h3>

            <div className="mt-3 space-y-3 text-xs text-stone-700">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-900 block text-sm">
                  Morning Rush Successfully Bypassed
                </span>
                <p className="mt-1 text-emerald-800">
                  The predictive algorithm intelligently scheduled your arrival for{' '}
                  <strong>{booking.allocatedSlot}</strong>, flattening the mandi morning bottleneck and cutting wait time from 48 hours to 15 minutes.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                  <span className="text-[10px] text-stone-500 block">Current Status</span>
                  <span className="font-bold text-emerald-800 uppercase text-xs">
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                  <span className="text-[10px] text-stone-500 block">Token Sequence</span>
                  <span className="font-bold text-stone-900 text-xs">#{booking.tokenNumber}</span>
                </div>
              </div>
            </div>

            {/* Live Gate Verification action */}
            <div className="mt-5 pt-4 border-t border-stone-100">
              <span className="text-xs font-semibold text-stone-700 block mb-2">
                Simulate Physical-to-Digital Bridge (Slide 5 & 7):
              </span>
              
              {booking.status === 'confirmed' ? (
                <button
                  onClick={handleSimulateGateCheckin}
                  disabled={isVerifyingGate}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingGate ? (
                    'Scanning at Gate...'
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Simulate Farmer Arrival & Scan at Gate
                    </>
                  )}
                </button>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  Checked in at Gate! Proceed to Weighbridge Lane.
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="flex gap-2">
            <button
              onClick={onBookAnother}
              className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors cursor-pointer text-center"
            >
              Book Another Slot
            </button>
            <button
              onClick={onViewAdmin}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
            >
              <span>View Mandi Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
