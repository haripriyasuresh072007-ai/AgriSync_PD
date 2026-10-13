import React, { useState, useRef, useEffect } from 'react';
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
  Camera,
  CameraOff,
  Upload,
  RefreshCw,
} from 'lucide-react';
import jsQR from 'jsqr';
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedBooking(null);
      setSuccessMsg(null);
      setErrorMsg(null);
      setCameraError(null);
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setErrorMsg(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported by your browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        scanFrame();
      }
    } catch (err: unknown) {
      console.warn('Camera access denied or unavailable:', err);
      const isPermissionDenied =
        err instanceof Error &&
        (err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError' ||
          err.message.toLowerCase().includes('permission') ||
          err.message.toLowerCase().includes('not allowed'));

      setCameraError(
        isPermissionDenied
          ? 'Camera permission was not granted. You can use the quick test farmer buttons below or enter Farmer ID / Token manually.'
          : 'Could not activate camera. Please use manual entry or demo selection below.'
      );
      setIsCameraActive(false);
    }
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          processRawScannedCode(code.data);
          stopCamera();
          return;
        }
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(scanFrame);
  };

  const processRawScannedCode = (rawData: string) => {
    setErrorMsg(null);
    const cleanRaw = rawData.trim();
    let targetId = cleanRaw;

    // Check if it's the formatted Gate Pass Text
    const passRefMatch = cleanRaw.match(/PASS (?:REF|NO)\s*:\s*([A-Za-z0-9_-]+)/i) || cleanRaw.match(/\b(BOOK-[A-Za-z0-9_-]+)\b/i);
    const farmerIdMatch = cleanRaw.match(/ID:\s*([A-Za-z0-9_-]+)/i) || cleanRaw.match(/Farmer ID:\s*([A-Za-z0-9_-]+)/i);
    const tokenMatch = cleanRaw.match(/TOKEN NO\s*:\s*#?([0-9]+)/i);
    const vehicleMatch = cleanRaw.match(/VEHICLE\s*:\s*([A-Za-z0-9-]+)/i);

    // Check if it's a URL with passId
    if (cleanRaw.includes('passId=')) {
      try {
        const url = new URL(cleanRaw, window.location.origin);
        targetId = url.searchParams.get('passId') || targetId;
      } catch {
        const match = cleanRaw.match(/passId=([^&]+)/);
        if (match) targetId = decodeURIComponent(match[1]);
      }
    } else if (cleanRaw.startsWith('{')) {
      // Try JSON
      try {
        const parsed = JSON.parse(cleanRaw);
        if (parsed.id) targetId = parsed.id;
        else if (parsed.farmerId) targetId = parsed.farmerId;
      } catch {}
    } else if (passRefMatch) {
      targetId = passRefMatch[1];
    } else if (farmerIdMatch) {
      targetId = farmerIdMatch[1];
    }

    const query = targetId.toLowerCase();
    const found = bookings.find(
      (b) =>
        b.id.toLowerCase() === query ||
        b.farmerId.toLowerCase() === query ||
        (farmerIdMatch && b.farmerId.toLowerCase() === farmerIdMatch[1].toLowerCase()) ||
        (tokenMatch && String(b.tokenNumber) === tokenMatch[1]) ||
        (vehicleMatch && b.vehicleNumber.toLowerCase().includes(vehicleMatch[1].toLowerCase())) ||
        cleanRaw.includes(b.id) ||
        cleanRaw.includes(b.farmerId) ||
        b.vehicleNumber.toLowerCase().includes(query) ||
        String(b.tokenNumber) === query
    );

    if (found) {
      setScannedBooking(found);
      setSearchCode(found.farmerId);
      setSuccessMsg(null);
    } else if (passRefMatch || farmerIdMatch) {
      // Reconstruct booking from scanned Gate Pass text
      const nameMatch = cleanRaw.match(/FARMER\s*:\s*([^\(\n\r]+)/i);
      const commMatch = cleanRaw.match(/COMMODITY\s*:\s*([^\(\n\r]+)/i);
      const slotMatch = cleanRaw.match(/SLOT TIME\s*:\s*([^\n\r]+)/i);

      const reconstructed: Booking = {
        id: passRefMatch ? passRefMatch[1] : `BOOK-${Date.now().toString().slice(-5)}`,
        farmerId: farmerIdMatch ? farmerIdMatch[1] : '12345',
        farmerName: nameMatch ? nameMatch[1].trim() : 'Balwant Singh',
        phone: '+91 98765 43210',
        commodity: (commMatch ? commMatch[1].trim() : 'Wheat') as any,
        quantityQuintals: 45,
        vehicleNumber: vehicleMatch ? vehicleMatch[1] : 'HR-05-AR-2291',
        vehicleType: 'Tractor Trolley',
        bookingDate: new Date().toISOString().split('T')[0],
        allocatedSlot: slotMatch ? slotMatch[1].trim() : '02:00 PM - 02:30 PM',
        allocatedHour: 14.0,
        mandiName: 'APMC Karnal Grain Mandi (Terminal-01)',
        channel: 'web_portal',
        status: 'confirmed',
        tokenNumber: tokenMatch ? Number(tokenMatch[1]) : 101,
        estimatedWaitMinutes: 12,
        qrPayload: cleanRaw,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setScannedBooking(reconstructed);
      setSearchCode(reconstructed.farmerId);
      setSuccessMsg(null);
    } else {
      setErrorMsg(`No active booking matching "${targetId}". Select a registered demo farmer below.`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            processRawScannedCode(code.data);
          } else {
            setErrorMsg('No QR code detected in this image. Please try another image or manual entry.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSimulateScan = (booking: Booking) => {
    setScannedBooking(booking);
    setSearchCode(booking.farmerId);
    setErrorMsg(null);
  };

  const handleSearchOrScan = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const query = searchCode.trim().toLowerCase();
    if (!query) return;

    const found = bookings.find(
      (b) =>
        b.farmerId.toLowerCase() === query ||
        b.id.toLowerCase() === query ||
        b.vehicleNumber.toLowerCase().includes(query) ||
        String(b.tokenNumber) === query
    );

    if (found) {
      setScannedBooking(found);
      setSuccessMsg(null);
    } else {
      setErrorMsg(`No booking found for "${searchCode}". Try Farmer ID: 12345 or select from quick list.`);
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
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
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
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Scanner Viewfinder / Camera Area */}
          <div className="relative bg-stone-950 rounded-2xl p-4 text-center text-white overflow-hidden border-2 border-emerald-500/50">
            {isCameraActive ? (
              <div className="relative w-full h-48 bg-black rounded-xl overflow-hidden flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-x-8 top-1/2 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse"></div>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="absolute bottom-2 right-2 px-2.5 py-1 rounded bg-stone-900/80 hover:bg-stone-800 text-white text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <CameraOff className="w-3 h-3 text-red-400" />
                  Stop Camera
                </button>
              </div>
            ) : (
              <div className="py-4">
                <div className="w-28 h-28 border-2 border-dashed border-emerald-400/80 rounded-xl mx-auto flex flex-col items-center justify-center bg-emerald-950/30 p-2">
                  <QrCode className="w-12 h-12 text-emerald-400 opacity-80" />
                  <span className="text-[10px] text-emerald-300 mt-1 uppercase font-mono">
                    Scanner Ready
                  </span>
                </div>

                <p className="text-xs text-stone-300 mt-2 font-medium">
                  Scan the farmer's Digital Gate Entry Pass
                </p>

                <div className="flex items-center justify-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-200" />
                    Open Camera Scanner
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-stone-700"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    Upload QR Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {cameraError && (
              <div className="mt-2 p-2 rounded-lg bg-amber-950/80 border border-amber-600/50 text-amber-200 text-[11px] text-left">
                {cameraError}
              </div>
            )}
          </div>

          {/* Quick Manual Entry / Search */}
          <form onSubmit={handleSearchOrScan} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Scan or enter Farmer ID (e.g. 12345) / Vehicle"
                value={searchCode}
                onChange={(e) => {
                  setSearchCode(e.target.value);
                  setErrorMsg(null);
                }}
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

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

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
                {bookings.slice(0, 6).map((b) => (
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
