import React, { useState, useEffect } from 'react';
import {
  Wheat,
  Calendar,
  Clock,
  Truck,
  User,
  Phone,
  Weight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  Building2,
  ArrowRight,
  ShieldAlert,
  Mic,
} from 'lucide-react';
import { Booking } from '../types/procurement';
import {
  STANDARD_SLOTS,
  calculateSlotCapacities,
  allocateOptimalSlot,
  MANDI_NAME,
  DEFAULT_COMMODITY_MSP,
} from '../services/dynamicAllocation';
import { saveBooking } from '../services/bookingStore';
import { TranscriptionResult } from '../services/transcriptionService';
import { dispatchApmcSms, formatApmcPassSms } from '../services/smsService';

interface FarmerPortalProps {
  existingBookings: Booking[];
  onBookingSuccess: (booking: Booking) => void;
  language: 'en' | 'hi' | 'pa' | 'ta';
  onOpenTranscriber?: () => void;
  voiceAutofillFields?: TranscriptionResult['parsedFields'] | null;
}

export const FarmerPortal: React.FC<FarmerPortalProps> = ({
  existingBookings,
  onBookingSuccess,
  language,
  onOpenTranscriber,
  voiceAutofillFields,
}) => {
  const t = {
    en: {
      portalBadge: "Farmer Procurement Portal",
      title: "Book Digital Procurement Slot",
      subtitle: "Eliminate endless gate lines. Our predictive scheduling matches your arrival with real-time mandi weighing capacity to guarantee a 15-minute gate turnaround.",
      sec1: "1. Farmer Identification & Contact",
      farmerName: "Farmer Full Name *",
      farmerId: "Farmer ID / Kisan Card *",
      mobile: "Mobile Number (SMS Updates) *",
      sec2: "2. Crop Commodity & Yield Details",
      selectCrop: "Select Commodity *",
      qty: "Estimated Quantity (Quintals) *",
      sec3: "3. Transport & Vehicle Details",
      vehicleType: "Vehicle Type",
      plate: "Vehicle Number Plate",
      sec4: "4. Predictive Slot Allocation Engine",
      procDate: "Procurement Date",
      schedMode: "Scheduling Mode",
      submitBtn: "Confirm Booking & Generate Gate Pass",
    },
    hi: {
      portalBadge: "किसान खरीद पोर्टल",
      title: "डिजिटल खरीद स्लॉट बुक करें",
      subtitle: "मंडी में लंबी कतारों से मुक्ति। हमारी भविष्यवाणी शेड्यूलिंग 15 मिनट में सुरक्षित प्रवेश सुनिश्चित करती है।",
      sec1: "1. किसान पहचान एवं संपर्क",
      farmerName: "किसान का पूरा नाम *",
      farmerId: "किसान आईडी / कार्ड *",
      mobile: "मोबाइल नंबर *",
      sec2: "2. फसल एवं उपज विवरण",
      selectCrop: "फसल चुनें *",
      qty: "अनुमानित मात्रा (क्विंटल) *",
      sec3: "3. वाहन विवरण",
      vehicleType: "वाहन प्रकार",
      plate: "वाहन नंबर प्लेट",
      sec4: "4. स्मार्ट स्लॉट आवंटन इंजन",
      procDate: "खरीद तिथि",
      schedMode: "शेड्यूलिंग मोड",
      submitBtn: "बुकिंग पुष्टि करें और गेट पास पाएं",
    },
    pa: {
      portalBadge: "ਕਿਸਾਨ ਖਰੀਦ ਪੋਰਟਲ",
      title: "ਡਿਜੀਟਲ ਖਰੀਦ ਸਲਾਟ ਬੁੱਕ ਕਰੋ",
      subtitle: "ਲੰਬੀਆਂ ਲਾਈਨਾਂ ਤੋਂ ਛੁਟਕਾਰਾ। ਸਮਾਰਟ ਸ਼ਡਿਊਲਿੰਗ 15 ਮਿੰਟ ਵਿੱਚ ਗੇਟ ਐਂਟਰੀ ਯਕੀਨੀ ਬਣਾਉਂਦੀ ਹੈ।",
      sec1: "1. ਕਿਸਾਨ ਪਛਾਣ ਅਤੇ ਸੰਪਰਕ",
      farmerName: "ਕਿਸਾਨ ਦਾ ਪੂਰਾ ਨਾਮ *",
      farmerId: "ਕਿਸਾਨ ਆਈਡੀ *",
      mobile: "ਮੋਬਾਈਲ ਨੰਬਰ *",
      sec2: "2. ਫਸਲ ਅਤੇ ਪੈਦਾਵਾਰ ਵੇਰਵਾ",
      selectCrop: "ਫਸਲ ਚੁਣੋ *",
      qty: "ਅਨੁਮਾਨਿਤ ਮਾਤਰਾ (ਕੁਇੰਟਲ) *",
      sec3: "3. ਵਾਹਨ ਵੇਰਵਾ",
      vehicleType: "ਵਾਹਨ ਦੀ ਕਿਸਮ",
      plate: "ਵਾਹਨ ਨੰਬਰ ਪਲੇਟ",
      sec4: "4. ਸਮਾਰਟ ਸਲਾਟ ਇੰਜਣ",
      procDate: "ਖਰੀਦ ਦੀ ਮਿਤੀ",
      schedMode: "ਸ਼ਡਿਊਲਿੰਗ ਮੋਡ",
      submitBtn: "ਬੁਕਿੰਗ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ ਅਤੇ ਗੇਟ ਪਾਸ ਪ੍ਰਾਪਤ ਕਰੋ",
    },
    ta: {
      portalBadge: "விவசாயிகள் கொள்முதல் போர்டல்",
      title: "டிஜிட்டல் கொள்முதல் நேர முன்பதிவு",
      subtitle: "நீண்ட வரிசைகளைத் தவிர்த்து, உங்கள் விளைச்சலை விரைவாக விநியோகிக்கவும். 15 நிமிடங்களில் நேரடி எடைபோடும் நுழைவு உத்தரவாதம்.",
      sec1: "1. விவசாயி அடையாளம் மற்றும் தொடர்பு",
      farmerName: "விவசாயியின் முழு பெயர் *",
      farmerId: "விவசாயி அடையாள அட்டை (Kisan ID) *",
      mobile: "கைபேசி எண் (SMS அறிவிப்புகள்) *",
      sec2: "2. விளைபொருள் மற்றும் மகசூல் விபரம்",
      selectCrop: "விளைபொருளைத் தேர்ந்தெடுக்கவும் *",
      qty: "மதிப்பிடப்பட்ட அளவு (குவிண்டால்) *",
      sec3: "3. போக்குவரத்து மற்றும் வாகன விபரம்",
      vehicleType: "வாகன வகை",
      plate: "வாகன பதிவு எண்",
      sec4: "4. கணிப்பு நேர ஒதுக்கீட்டு அமைப்பு",
      procDate: "கொள்முதல் தேதி",
      schedMode: "நேர ஒதுக்கீட்டு முறை",
      submitBtn: "முன்பதிவை உறுதிசெய்து நுழைவு அட்டை பெறுக",
    },
  }[language];
  const todayStr = new Date().toISOString().split('T')[0];

  const [farmerName, setFarmerName] = useState('Balwant Singh');
  const [farmerId, setFarmerId] = useState('12345');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [commodity, setCommodity] = useState<Booking['commodity']>('Wheat');
  const [quantityQuintals, setQuantityQuintals] = useState<number>(45);
  const [vehicleNumber, setVehicleNumber] = useState('HR-05-AR-2291');
  const [vehicleType, setVehicleType] = useState<Booking['vehicleType']>('Tractor Trolley');
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [slotPreference, setSlotPreference] = useState<'AUTO_OPTIMAL' | string>('AUTO_OPTIMAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dynamic slot capacities
  const slotCapacities = calculateSlotCapacities(existingBookings, bookingDate);

  // Preview what the predictive allocation will select
  const simulatedAllocation = allocateOptimalSlot(
    existingBookings,
    bookingDate,
    slotPreference
  );

  // Sync voice-transcribed fields when received
  useEffect(() => {
    if (voiceAutofillFields) {
      if (voiceAutofillFields.farmerName) setFarmerName(voiceAutofillFields.farmerName);
      if (voiceAutofillFields.commodity) setCommodity(voiceAutofillFields.commodity);
      if (voiceAutofillFields.quantityQuintals) setQuantityQuintals(voiceAutofillFields.quantityQuintals);
      if (voiceAutofillFields.vehicleNumber) setVehicleNumber(voiceAutofillFields.vehicleNumber);
      if (voiceAutofillFields.vehicleType) setVehicleType(voiceAutofillFields.vehicleType);
    }
  }, [voiceAutofillFields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!farmerName.trim()) {
      setErrorMsg('Please enter farmer name.');
      return;
    }
    if (!farmerId.trim()) {
      setErrorMsg('Please enter or generate a Farmer ID.');
      return;
    }
    if (!commodity) {
      setErrorMsg('Please select a commodity.');
      return;
    }
    if (quantityQuintals <= 0) {
      setErrorMsg('Please specify procurement quantity.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Dynamic allocation logic
      const allocation = allocateOptimalSlot(
        existingBookings,
        bookingDate,
        slotPreference
      );

      const bookingId = `BOOK-${Date.now().toString().slice(-6)}`;
      const qrData = JSON.stringify({
        id: bookingId,
        farmerId: farmerId.trim(),
        farmerName: farmerName.trim(),
        commodity,
        slot: allocation.allocatedSlot,
        date: bookingDate,
        qty: quantityQuintals,
        vehicle: vehicleNumber.trim() || 'Unspecified',
        mandi: MANDI_NAME,
        verified: true,
      });

      const newBooking: Booking = {
        id: bookingId,
        farmerId: farmerId.trim(),
        farmerName: farmerName.trim(),
        phone: phone.trim() || '+91 98765 43210',
        commodity,
        quantityQuintals,
        vehicleNumber: vehicleNumber.trim() || 'HR-05-T-1001',
        vehicleType,
        bookingDate,
        allocatedSlot: allocation.allocatedSlot,
        allocatedHour: allocation.allocatedHour,
        mandiName: MANDI_NAME,
        channel: 'web_portal',
        status: 'confirmed',
        tokenNumber: allocation.tokenNumber,
        estimatedWaitMinutes: allocation.estimatedWaitMinutes,
        qrPayload: qrData,
        bypassMorningRushNote: allocation.bypassMorningRushNote,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveBooking(newBooking);

      // Automatically dispatch official DLT SMS to entered farmer mobile number!
      const smsMessage = formatApmcPassSms(newBooking, language);
      dispatchApmcSms(newBooking.phone, smsMessage, newBooking).catch((smsErr) => {
        console.warn('SMS dispatch background notice:', smsErr);
      });

      setIsSubmitting(false);
      onBookingSuccess(newBooking);
    } catch (err: unknown) {
      console.error('Failed to save booking:', err);
      setIsSubmitting(false);
      setErrorMsg('Failed to confirm booking. Please check network connection.');
    }
  };

  const currentMsp = DEFAULT_COMMODITY_MSP[commodity] || 2275;
  const estimatedPayout = Math.round(quantityQuintals * currentMsp);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Banner / Value Proposition matching Slide 1 & 7 */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-amber-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-6 relative overflow-hidden border border-emerald-600/30">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Wheat className="w-64 h-64 text-amber-200" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-amber-400 text-stone-900 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {t.portalBadge}
            </span>
            <span className="text-emerald-100 text-xs flex items-center gap-1 bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-600/40">
              <Building2 className="w-3.5 h-3.5 text-amber-300" />
              {MANDI_NAME}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
            {t.title}
          </h1>
          <p className="mt-2 text-emerald-50 text-sm sm:text-base max-w-2xl leading-relaxed">
            {t.subtitle}
          </p>

          {/* Quick value cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-emerald-600/40 text-xs sm:text-sm">
            <div className="bg-emerald-900/30 backdrop-blur-xs rounded-xl p-3 border border-emerald-500/20">
              <span className="text-emerald-300 block text-[11px] font-semibold">Prev Physical Wait</span>
              <span className="text-base font-bold text-red-200 line-through">24 to 48 Hours</span>
            </div>
            <div className="bg-emerald-900/30 backdrop-blur-xs rounded-xl p-3 border border-emerald-500/20">
              <span className="text-emerald-300 block text-[11px] font-semibold">AgriSync Digital Wait</span>
              <span className="text-base font-bold text-amber-300 flex items-center gap-1">
                ~12 to 15 Mins
                <TrendingDown className="w-4 h-4 text-emerald-300" />
              </span>
            </div>
            <div className="bg-emerald-900/30 backdrop-blur-xs rounded-xl p-3 border border-emerald-500/20 col-span-2 sm:col-span-1">
              <span className="text-emerald-300 block text-[11px] font-semibold">Wheat Govt MSP 2026</span>
              <span className="text-base font-bold text-emerald-200">₹{currentMsp.toLocaleString('en-IN')}/qtl</span>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Transcribe Banner (gemini-3.5-transcribe) */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-amber-50 border border-emerald-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-amber-300 flex items-center justify-center shadow-md shrink-0">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-stone-900 font-serif">
                Kisan Vani — Voice Booking & Audio Transcription
              </span>
              <span className="text-[10px] font-mono font-bold bg-amber-400 text-stone-900 px-2 py-0.5 rounded-full shadow-xs">
                gemini-3.5-transcribe
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Speak into your microphone in English, हिंदी, தமிழ், or ਪੰਜਾਬੀ to transcribe audio and auto-fill your slot.
            </p>
          </div>
        </div>
        {onOpenTranscriber && (
          <button
            type="button"
            onClick={onOpenTranscriber}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Mic className="w-3.5 h-3.5 text-amber-300" />
            <span>Speak to Fill Form</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Main Booking Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 shadow-md overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Section 1: Farmer & Identification */}
          <div>
            <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <User className="w-5 h-5 text-emerald-700" />
              {t.sec1}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.farmerName}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    placeholder="e.g. Balwant Singh"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-sm bg-stone-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex justify-between">
                  <span>Farmer ID / Kisan Card *</span>
                  <button
                    type="button"
                    onClick={() => setFarmerId(Math.floor(10000 + Math.random() * 90000).toString())}
                    className="text-emerald-700 hover:underline text-[11px] font-medium"
                  >
                    Generate Random
                  </button>
                </label>
                <input
                  type="text"
                  required
                  value={farmerId}
                  onChange={(e) => setFarmerId(e.target.value)}
                  placeholder="e.g. 12345"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 font-mono text-sm bg-stone-50/50"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Shown on Gate Pass (e.g. 12345 as on Slide 7)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Mobile Number (SMS Updates) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-sm bg-stone-50/50"
                  />
                </div>
                <p className="text-[11px] text-emerald-800 mt-1.5 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Official DLT SMS pass with token & entry link dispatched instantly to this number.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Commodity & Produce Quantity */}
          <div>
            <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <Wheat className="w-5 h-5 text-amber-600" />
              {t.sec2}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.selectCrop}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Wheat', 'Paddy', 'Mustard', 'Cotton', 'Maize', 'Soyabean'] as const).map((crop) => (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => setCommodity(crop)}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                        commodity === crop
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30 font-bold'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span className="text-base">
                        {crop === 'Wheat' ? '🌾' : crop === 'Paddy' ? '🍚' : crop === 'Mustard' ? '🌼' : crop === 'Cotton' ? '☁️' : '🌽'}
                      </span>
                      <span>{crop}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.qty}
                </label>
                <div className="relative">
                  <Weight className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min={5}
                    max={500}
                    required
                    value={quantityQuintals}
                    onChange={(e) => setQuantityQuintals(Number(e.target.value))}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-sm font-semibold bg-stone-50/50"
                  />
                </div>
                {/* Financial MSP estimate card */}
                <div className="mt-2 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-amber-800 font-medium">MSP Guaranteed Rate: </span>
                    <span className="font-bold text-amber-950">₹{currentMsp}/qtl</span>
                  </div>
                  <div className="text-right">
                    <span className="text-stone-500 block text-[10px]">Estimated Value:</span>
                    <span className="font-bold text-emerald-800 text-sm">₹{estimatedPayout.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Transport & Logistics */}
          <div>
            <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <Truck className="w-5 h-5 text-emerald-700" />
              {t.sec3}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.vehicleType}
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as Booking['vehicleType'])}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-sm bg-stone-50/50"
                >
                  <option value="Tractor Trolley">Tractor Trolley (Standard APMC)</option>
                  <option value="Mini Truck (Pick-up)">Mini Truck (Pick-up / Bolero Maxi)</option>
                  <option value="Heavy Multi-axle Truck">Heavy Multi-axle Truck</option>
                  <option value="Bullock Cart">Bullock Cart (Local Short-haul)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.plate}
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. HR-05-AR-2291"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 font-mono text-sm bg-stone-50/50"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Dynamic Slot Allocation & Predictive Scheduling Engine */}
          <div className="bg-stone-50 p-5 rounded-xl border border-stone-200">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-200">
              <div>
                <h2 className="text-base font-semibold text-emerald-950 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  {t.sec4}
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  Dynamic algorithm analyzes mandi weighing scale capacity and shifts arrivals away from overloaded morning bottlenecks.
                </p>
              </div>
              <span className="shrink-0 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                AI / Predictive
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.procDate}
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    value={bookingDate}
                    min={todayStr}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.schedMode}
                </label>
                <select
                  value={slotPreference}
                  onChange={(e) => setSlotPreference(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-sm bg-white font-medium"
                >
                  <option value="AUTO_OPTIMAL">
                    ★ Smart Dynamic: Allocate 2:00 PM (Bypass Morning Rush)
                  </option>
                  <optgroup label="Or Manually Request Slot">
                    {STANDARD_SLOTS.map((slot) => {
                      const cap = slotCapacities.find((c) => c.slotId === slot.id);
                      const isFull = (cap?.congestionPercent || 0) >= 90;
                      return (
                        <option
                          key={slot.id}
                          value={slot.timeLabel}
                          disabled={isFull}
                        >
                          {slot.timeLabel} {slot.isPeakRush ? '(Morning Peak)' : ''} - {cap?.congestionPercent}% full {isFull ? '[CLOSED]' : ''}
                        </option>
                      );
                    })}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Smart Allocation Preview Box matching Slide 7 */}
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                      Predictive Recommendation for Your Load:
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-700 text-white shadow-xs">
                      {simulatedAllocation.allocatedSlot}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 mt-1 font-medium">
                    {simulatedAllocation.bypassMorningRushNote ||
                      'System balances arrivals against mandi processing rate to ensure zero gate idling.'}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-stone-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      Estimated Physical Wait: <strong>{simulatedAllocation.estimatedWaitMinutes} mins</strong> (vs 180 min morning peak)
                    </span>
                    <span className="flex items-center gap-1 text-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Weighbridge Lane 2 Reserved
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-stone-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Instant QR Gate Pass will be generated and stored securely in Firebase.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Allocating Slot via Cloud...
              </>
            ) : (
              <>
                {t.submitBtn}
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
