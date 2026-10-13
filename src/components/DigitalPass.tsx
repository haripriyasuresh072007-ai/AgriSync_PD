import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
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
  ArrowRight,
  Eye,
  Check,
  Sliders,
  ExternalLink,
  Copy,
  Info,
  Radio,
  Phone
} from 'lucide-react';
import { Booking } from '../types/procurement';
import { updateBookingStatus } from '../services/bookingStore';
import {
  formatApmcPassSms,
  buildNativeSmsUri,
  buildWhatsAppUri,
  shareSmsNatively,
} from '../services/smsService';

interface DigitalPassProps {
  booking: Booking | null;
  onOpenGateScanner?: () => void;
  onOpenSmsSimulator?: () => void;
  onBookAnother?: () => void;
  onViewAdmin?: () => void;
}

type QrFormatType = 'pass_text' | 'web_url' | 'apmc_token';

export const DigitalPass: React.FC<DigitalPassProps> = ({
  booking,
  onOpenGateScanner,
  onOpenSmsSimulator,
  onBookAnother,
  onViewAdmin,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [viewMode, setViewMode] = useState<'phone' | 'card'>('phone');
  const [qrFormat, setQrFormat] = useState<QrFormatType>('pass_text');
  const [highContrast, setHighContrast] = useState(true);
  const [isVerifyingGate, setIsVerifyingGate] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);
  const downloadCanvasRef = useRef<HTMLCanvasElement>(null);

  // Build the text that formats as a real Gate Pass when scanned with ANY mobile phone camera / Google Lens
  const getGatePassTextPayload = (b: Booking): string => {
    const slotShort = b.allocatedSlot.includes('02:00 PM') ? '2 PM' : b.allocatedSlot.split(' - ')[0];
    return [
      `🎫 APMC MANDI GATE ENTRY PASS`,
      `Govt. of India • E-Procurement Portal`,
      `───────────────────────────────`,
      `PASS REF   : ${b.id}`,
      `TOKEN NO   : #${b.tokenNumber} (Priority Gate 1)`,
      `FARMER     : ${b.farmerName} (ID: ${b.farmerId})`,
      `COMMODITY  : ${b.commodity} (${b.quantityQuintals} Quintals)`,
      `SLOT TIME  : ${b.allocatedSlot} (${slotShort})`,
      `VEHICLE    : ${b.vehicleNumber} (${b.vehicleType})`,
      `MANDI      : ${b.mandiName}`,
      `GATE ENTRY : APPROVED & ADMITTED ✅`,
      `WAIT EST.  : ~${b.estimatedWaitMinutes || 12} mins (Fast-Track Lane)`,
      `───────────────────────────────`,
      `Official AgriSync Mandi Pass Verified`
    ].join('\n');
  };

  // Build Web URL payload for direct browser linking
  const getWebUrlPayload = (b: Booking): string => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const params = new URLSearchParams({
      passId: b.id,
      fId: b.farmerId,
      fName: b.farmerName,
      comm: b.commodity,
      slot: b.allocatedSlot,
      qty: String(b.quantityQuintals),
      veh: b.vehicleNumber,
      vehType: b.vehicleType,
      mandi: b.mandiName,
      token: String(b.tokenNumber),
      date: b.bookingDate,
      status: b.status,
    });
    return `${origin}${pathname}?${params.toString()}`;
  };

  // Build raw JSON token for gate security terminals
  const getApmcTokenPayload = (b: Booking): string => {
    return JSON.stringify({
      app: 'AgriSync-APMC',
      type: 'GATE_ENTRY_PASS',
      id: b.id,
      farmerId: b.farmerId,
      farmerName: b.farmerName,
      commodity: b.commodity,
      quantityQtl: b.quantityQuintals,
      vehicle: b.vehicleNumber,
      slot: b.allocatedSlot,
      token: b.tokenNumber,
      mandi: b.mandiName,
      verified: true,
      timestamp: new Date().toISOString()
    });
  };

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

  // Active payload based on user selection
  const passTextPayload = getGatePassTextPayload(booking);
  const webUrlPayload = getWebUrlPayload(booking);
  const apmcTokenPayload = getApmcTokenPayload(booking);

  let activeQrValue = passTextPayload;
  if (qrFormat === 'web_url') activeQrValue = webUrlPayload;
  if (qrFormat === 'apmc_token') activeQrValue = apmcTokenPayload;

  // Colors for crisp scanning contrast
  const fgColor = highContrast ? '#000000' : '#042f2e'; // Pure black or deep pine
  const bgColor = '#ffffff';

  const handleCopyPassText = () => {
    navigator.clipboard?.writeText(passTextPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyWebUrl = () => {
    navigator.clipboard?.writeText(webUrlPayload);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQrPng = () => {
    // Generate high resolution image from canvas
    const canvas = document.getElementById('high-res-qr-canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `APMC-GatePass-${booking.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hidden high-res canvas used for crystal-clear PNG export */}
      <div className="hidden">
        <QRCodeCanvas
          id="high-res-qr-canvas"
          value={activeQrValue}
          size={800}
          level="H"
          includeMargin={true}
          marginSize={4}
          fgColor={fgColor}
          bgColor={bgColor}
        />
      </div>

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Verified Digital Token #{booking.tokenNumber}
            </span>
            <span className="text-xs text-stone-500 font-mono">Ref: {booking.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
            Official Gate Entry Pass
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            High-Definition QR Code configured for instant smartphone camera scanning and APMC gate admission.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="bg-stone-200 p-1 rounded-xl flex items-center text-xs">
            <button
              onClick={() => setViewMode('phone')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'phone'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Mobile Phone View</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-700" />
              <span>Printable Thermal Pass</span>
            </button>
          </div>

          <button
            onClick={handleDownloadQrPng}
            className="p-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Download HD Pass QR"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Save HD QR</span>
          </button>
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
            title="Print Pass"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Format Selector Banner: Ensures scanner displays pass directly */}
      <div className="mb-6 p-3.5 bg-gradient-to-r from-emerald-50 via-stone-50 to-amber-50 rounded-2xl border border-emerald-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <QrCodeIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-stone-900">QR Code Output Mode</div>
            <div className="text-[11px] text-stone-600">
              {qrFormat === 'pass_text'
                ? '⭐ Default: Point any phone camera at QR code — it immediately displays the full Gate Pass on your mobile screen!'
                : qrFormat === 'web_url'
                ? 'Web Link: Opens the interactive web portal on your mobile browser.'
                : 'APMC Terminal: Encoded JSON payload for Mandi gate security scanner hardware.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-200 shadow-xs">
          <button
            type="button"
            onClick={() => setQrFormat('pass_text')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              qrFormat === 'pass_text'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            📱 Mobile Pass View (Recommended)
          </button>
          <button
            type="button"
            onClick={() => setQrFormat('web_url')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              qrFormat === 'web_url'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            🌐 Web Link
          </button>
          <button
            type="button"
            onClick={() => setQrFormat('apmc_token')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              qrFormat === 'apmc_token'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            🏢 APMC Terminal
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
              ? 'w-full max-w-[370px] rounded-[48px] p-3.5 bg-stone-900 shadow-2xl ring-12 ring-stone-800/80 border-4 border-stone-700'
              : 'w-full max-w-md rounded-2xl bg-white shadow-xl border border-stone-200'
          }`}
        >
          {/* Inner Phone Screen */}
          <div
            className={`bg-white overflow-hidden text-stone-900 ${
              viewMode === 'phone' ? 'rounded-[40px] min-h-[620px] flex flex-col justify-between' : 'rounded-2xl p-6'
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
              {/* Official Header */}
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                E-Procurement Gate Pass
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-950 font-serif">
                Gate Entry Pass
              </h2>
              <p className="text-[11px] text-stone-500 font-medium">
                {booking.mandiName}
              </p>

              {/* High-Definition QR Code Container with High Contrast and Scaling */}
              <div className="my-3 flex flex-col items-center justify-center">
                <div className="w-full max-w-[260px] p-4 bg-white rounded-2xl border-2 border-stone-300 shadow-sm relative group transition-all hover:border-emerald-500">
                  {/* High Definition SVG QR Code */}
                  <div className="flex items-center justify-center">
                    <QRCodeSVG
                      value={activeQrValue}
                      size={220}
                      level="H"
                      includeMargin={true}
                      marginSize={3}
                      fgColor={fgColor}
                      bgColor={bgColor}
                      className="w-full h-auto aspect-square max-w-[210px] max-h-[210px] mx-auto select-none"
                    />
                  </div>

                  {/* Corner optical scan alignment reticles */}
                  <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-emerald-700"></div>
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-emerald-700"></div>
                  <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-emerald-700"></div>
                  <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-emerald-700"></div>
                </div>

                {/* Subtitle instructions for mobile scanners */}
                <div className="mt-2.5 flex flex-col items-center gap-1 w-full">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    Scan with any phone camera to view pass
                  </span>

                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={handleCopyPassText}
                      className="text-[10px] text-stone-600 hover:text-emerald-700 underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      {copied ? 'Pass text copied!' : 'Copy Pass Text'}
                    </button>
                    <span className="text-stone-300">•</span>
                    <button
                      type="button"
                      onClick={() => setHighContrast(!highContrast)}
                      className="text-[10px] text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                      title="Toggle contrast"
                    >
                      <Sliders className="w-2.5 h-2.5" />
                      {highContrast ? 'Pure Black' : 'Pine Theme'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Exact Fields from Slide 7:
                  Farmer ID: 12345
                  Slot: 2 PM
                  Commodity: Wheat
              */}
              <div className="space-y-2 text-left bg-stone-50 p-3.5 rounded-xl border border-stone-200 font-sans text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">Farmer ID:</span>
                  <span className="font-bold font-mono text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                    {booking.farmerId}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">Slot:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {booking.allocatedSlot.includes('02:00 PM') ? '2 PM' : booking.allocatedSlot.split(' - ')[0]}
                    <span className="text-stone-400 text-[10px] ml-1 font-normal">({booking.allocatedSlot})</span>
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">Commodity:</span>
                  <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                    <Wheat className="w-3.5 h-3.5 text-amber-700" />
                    {booking.commodity}
                  </span>
                </div>

                <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-[11px] text-stone-600">
                  <span>Quantity & Vehicle:</span>
                  <span className="font-semibold text-stone-900">
                    {booking.quantityQuintals} Quintals • {booking.vehicleNumber}
                  </span>
                </div>
              </div>

              {/* Status and Big Green Checkmark matching Slide 7 */}
              <div className="mt-3 flex flex-col items-center justify-center pb-1">
                <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  <CheckCircle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold text-emerald-800 mt-1 uppercase tracking-wide">
                  Verified Gate Access
                </span>
                <span className="text-[10px] text-stone-500">
                  Est. physical wait time: ~12-15 minutes
                </span>
              </div>
            </div>

            {/* Bottom bar of phone */}
            {viewMode === 'phone' && (
              <div className="pb-2 pt-1 text-center">
                <div className="w-28 h-1 bg-stone-300 rounded-full mx-auto"></div>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Live Mobile Scanner View & Actions */}
        <div className="max-w-md w-full space-y-4">
          {/* Live Mobile Camera Scanner Simulation: Shows what phone displays! */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4 text-emerald-700" />
                Live Mobile Camera View Preview
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Phone Viewport
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              When a farmer or gate officer points their smartphone camera at the QR code above, their screen automatically displays this verified Gate Pass:
            </p>

            {/* Simulated smartphone camera banner */}
            <div className="mt-3 bg-stone-900 text-stone-100 rounded-xl p-3.5 font-mono text-[11px] border border-stone-800 shadow-inner relative overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-[10px] text-stone-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span>CAMERA QR RECOGNITION</span>
                </div>
                <span className="text-emerald-400 font-sans font-bold">100% MATCH</span>
              </div>
              <div className="mt-2 text-stone-200 whitespace-pre-line leading-relaxed text-[10.5px]">
                {qrFormat === 'pass_text' ? (
                  passTextPayload
                ) : qrFormat === 'web_url' ? (
                  <div>
                    <div className="text-emerald-400 font-bold mb-1">🌐 Web Link Detected:</div>
                    <div className="break-all text-[10px] text-stone-300">{webUrlPayload}</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-amber-400 font-bold mb-1">🏢 APMC JSON Token:</div>
                    <div className="break-all text-[10px] text-stone-300">{apmcTokenPayload}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick action to test scanning inside app */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={onOpenGateScanner}
                className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Test in Mandi Gate Scanner Modal
              </button>
              <button
                type="button"
                onClick={handleCopyWebUrl}
                className="text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                {copiedUrl ? 'Link Copied!' : 'Copy Direct Web Link'}
              </button>
            </div>
          </div>

          {/* Official DLT SMS Dispatch Card */}
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-stone-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <Radio className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400">
                  GSM DLT SMS Dispatched
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-800">
                TRAI DLT: VM-AGRIAPMC
              </span>
            </div>

            <div className="bg-stone-950/80 rounded-xl p-3 border border-stone-800 mb-3 space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between text-stone-400 text-[10px]">
                <span>To: <strong className="text-emerald-300">{booking.phone}</strong></span>
                <span className="text-stone-500">Token #{booking.tokenNumber}</span>
              </div>
              <p className="text-stone-200 leading-relaxed font-sans text-xs">
                {formatApmcPassSms(booking, 'en')}
              </p>
            </div>

            {/* Mobile Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <a
                href={buildNativeSmsUri(booking.phone, formatApmcPassSms(booking, 'en'))}
                className="py-2 px-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-[11px] text-center flex items-center justify-center gap-1 shadow-xs transition-colors"
                title="Launch Native Messages App on Phone"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-300" />
                <span>Native SMS</span>
              </a>

              <a
                href={buildWhatsAppUri(booking.phone, formatApmcPassSms(booking, 'en'))}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[11px] text-center flex items-center justify-center gap-1 shadow-xs transition-colors"
                title="Send via WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              {onOpenSmsSimulator && (
                <button
                  type="button"
                  onClick={onOpenSmsSimulator}
                  className="py-2 px-2 bg-stone-700 hover:bg-stone-600 text-amber-300 rounded-xl font-bold text-[11px] text-center flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Open SMS Simulator Gateway"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>SMS Gateway</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(formatApmcPassSms(booking, 'en'));
                  setCopiedSms(true);
                  setTimeout(() => setCopiedSms(false), 2000);
                }}
                className="py-2 px-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-bold text-[11px] text-center flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                {copiedSms ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSms ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
          </div>

          {/* Dynamic Scheduling Highlights */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
            <h3 className="font-bold text-stone-900 flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Dynamic Scheduling Highlights
            </h3>

            <div className="mt-3 space-y-2.5 text-xs text-stone-700">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-900 block text-xs">
                  Morning Rush Successfully Bypassed
                </span>
                <p className="mt-1 text-emerald-800 text-[11px] leading-relaxed">
                  The predictive algorithm intelligently scheduled arrival for{' '}
                  <strong>{booking.allocatedSlot}</strong>, flattening the mandi morning bottleneck and cutting physical queue wait time from 48 hours to 15 minutes.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-lg bg-stone-50 border border-stone-200">
                  <span className="text-[10px] text-stone-500 block">Current Status</span>
                  <span className="font-bold text-emerald-800 uppercase text-xs">
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-stone-50 border border-stone-200">
                  <span className="text-[10px] text-stone-500 block">Token Sequence</span>
                  <span className="font-bold text-stone-900 text-xs">#{booking.tokenNumber}</span>
                </div>
              </div>
            </div>

            {/* Live Gate Verification action */}
            <div className="mt-4 pt-3 border-t border-stone-100">
              {booking.status === 'confirmed' ? (
                <button
                  onClick={handleSimulateGateCheckin}
                  disabled={isVerifyingGate}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingGate ? (
                    'Admitting at Gate...'
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
