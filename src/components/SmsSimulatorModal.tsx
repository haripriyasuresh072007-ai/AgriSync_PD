import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Ticket,
  ArrowRight,
  ShieldCheck,
  Radio,
  ExternalLink,
  Share2,
  Copy,
  Check,
  QrCode as QrCodeIcon,
  RefreshCw,
  PhoneCall,
  Wifi,
  BatteryCharging
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Booking } from '../types/procurement';
import { allocateOptimalSlot, MANDI_NAME } from '../services/dynamicAllocation';
import { saveBooking } from '../services/bookingStore';
import {
  formatApmcPassSms,
  sanitizePhoneNumber,
  buildNativeSmsUri,
  buildWhatsAppUri,
  shareSmsNatively,
  dispatchApmcSms,
  getStoredSmsHistory,
  SmsDispatchRecord
} from '../services/smsService';

interface SmsSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingBookings: Booking[];
  onBookingCreated: (booking: Booking) => void;
  initialPhone?: string;
  initialBooking?: Booking | null;
}

export const SmsSimulatorModal: React.FC<SmsSimulatorModalProps> = ({
  isOpen,
  onClose,
  existingBookings,
  onBookingCreated,
  initialPhone = '+91 98765 43210',
  initialBooking = null,
}) => {
  const [activeTab, setActiveTab] = useState<'handset' | 'direct_send' | 'smpp_logs'>('handset');
  const [phoneInput, setPhoneInput] = useState(initialPhone || '+91 98765 43210');
  const [farmerNameInput, setFarmerNameInput] = useState(initialBooking?.farmerName || 'Balwant Singh');
  const [selectedCrop, setSelectedCrop] = useState<Booking['commodity']>('Wheat');
  const [quantityInput, setQuantityInput] = useState<number>(45);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'pa' | 'ta'>('en');
  const [carrier, setCarrier] = useState('Airtel Enterprise DLT');

  const [inputText, setInputText] = useState('Book slot for wheat');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [deliveryToast, setDeliveryToast] = useState<string | null>(null);
  const [qrMode, setQrMode] = useState<'smsto' | 'weblink'>('smsto');

  const [messages, setMessages] = useState<
    {
      id: string;
      sender: 'farmer' | 'system';
      text: string;
      time: string;
      status?: 'SENT' | 'DELIVRD';
      bookingRef?: Booking;
    }[]
  >([]);

  const [dispatchLogs, setDispatchLogs] = useState<SmsDispatchRecord[]>([]);

  // Update phone when initialPhone changes or when opened
  useEffect(() => {
    if (initialPhone) setPhoneInput(initialPhone);
    if (initialBooking?.farmerName) setFarmerNameInput(initialBooking.farmerName);
  }, [initialPhone, initialBooking]);

  // Load message history or initial seed messages
  useEffect(() => {
    if (!isOpen) return;

    const storedLogs = getStoredSmsHistory();
    setDispatchLogs(storedLogs);

    if (messages.length === 0) {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages([
        {
          id: 'welcome-1',
          sender: 'system',
          text: 'Welcome to APMC AgriSync National Gateway (Toll-Free SMS 1800-AGRI-SYNC / ShortCode 57575). Reply "Book slot for [crop]" or "STATUS" to reserve guaranteed queue pass.',
          time: '09:00 AM',
          status: 'DELIVRD',
        },
      ]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanPhone = sanitizePhoneNumber(phoneInput);

  // Quick Action handler
  const handleQuickCommand = (cmd: string) => {
    setInputText(cmd);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Process and simulate dynamic SMS booking logic
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `MSG-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'farmer',
        text: userMsg,
        time: timeStr,
        status: 'SENT',
      },
    ]);
    setInputText('');
    setIsSending(true);

    // Dynamic NLP & keyword understanding for SMS commands
    setTimeout(async () => {
      const lower = userMsg.toLowerCase();
      const todayStr = new Date().toISOString().split('T')[0];
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Handle HELP command
      if (lower === 'help' || lower === '?') {
        const helpText = `[APMC HELP] Commands:\n1. BOOK [CROP] [QTY] - e.g. "BOOK WHEAT 45"\n2. STATUS [REF] - Check pass status\n3. CANCEL [REF] - Cancel slot\nSupport: 1800-AGRI-SYNC`;
        setMessages((prev) => [
          ...prev,
          {
            id: `SYS-${Date.now()}`,
            sender: 'system',
            text: helpText,
            time: replyTime,
            status: 'DELIVRD',
          },
        ]);
        setIsSending(false);
        return;
      }

      // Handle STATUS command
      if (lower.startsWith('status')) {
        const statusText = `[APMC STATUS] Mandi: ${MANDI_NAME}. Active queues: 4 trucks in weighing lane. Morning rush flattener active. Normal gate turnaround: 12-15 mins.`;
        setMessages((prev) => [
          ...prev,
          {
            id: `SYS-${Date.now()}`,
            sender: 'system',
            text: statusText,
            time: replyTime,
            status: 'DELIVRD',
          },
        ]);
        setIsSending(false);
        return;
      }

      // Intelligent Booking Allocation
      const allocation = allocateOptimalSlot(existingBookings, todayStr, 'AUTO_OPTIMAL');
      const farmerId = String(Math.floor(10000 + Math.random() * 90000));
      const bookingId = `SMS-${Date.now().toString().slice(-5)}`;

      let commodity: Booking['commodity'] = selectedCrop;
      if (lower.includes('paddy') || lower.includes('dhan')) commodity = 'Paddy';
      else if (lower.includes('mustard') || lower.includes('sarson')) commodity = 'Mustard';
      else if (lower.includes('cotton')) commodity = 'Cotton';
      else if (lower.includes('maize')) commodity = 'Maize';
      else if (lower.includes('wheat') || lower.includes('gehun')) commodity = 'Wheat';

      // Parse quantity if provided
      const qtyMatch = userMsg.match(/(\d+)\s*(?:qtl|quintal|क्विंटल|कुंतल)?/i);
      const parsedQty = qtyMatch ? parseInt(qtyMatch[1], 10) : quantityInput;

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://apmc.agrisync.gov.in';
      const webUrl = `${origin}/?passId=${bookingId}`;

      const qrData = JSON.stringify({
        id: bookingId,
        farmerId,
        farmerName: farmerNameInput.trim() || 'Balwant Singh (SMS)',
        commodity,
        slot: allocation.allocatedSlot,
        mandi: MANDI_NAME,
        verified: true,
      });

      const newBooking: Booking = {
        id: bookingId,
        farmerId,
        farmerName: farmerNameInput.trim() || 'Balwant Singh (SMS)',
        phone: cleanPhone,
        commodity,
        quantityQuintals: parsedQty > 0 ? parsedQty : 45,
        vehicleNumber: 'HR-05-AR-2291',
        vehicleType: 'Tractor Trolley',
        bookingDate: todayStr,
        allocatedSlot: allocation.allocatedSlot,
        allocatedHour: allocation.allocatedHour,
        mandiName: MANDI_NAME,
        channel: 'sms_gateway',
        status: 'confirmed',
        tokenNumber: allocation.tokenNumber,
        estimatedWaitMinutes: allocation.estimatedWaitMinutes,
        qrPayload: qrData,
        bypassMorningRushNote: 'System intelligently allocated a 2 PM slot to bypass morning rush.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await saveBooking(newBooking);
        onBookingCreated(newBooking);
      } catch (err) {
        console.error('Save booking notice:', err);
      }

      // Generate official DLT message matching Slide 7
      const replyText = formatApmcPassSms(newBooking, selectedLanguage);

      // Dispatch to carrier log
      const dispatchRecord = await dispatchApmcSms(cleanPhone, replyText, newBooking, carrier);
      setDispatchLogs((prev) => [dispatchRecord, ...prev]);

      setMessages((prev) => [
        ...prev,
        {
          id: `SYS-${Date.now()}`,
          sender: 'system',
          text: replyText,
          time: replyTime,
          status: 'DELIVRD',
          bookingRef: newBooking,
        },
      ]);

      setIsSending(false);
      setDeliveryToast(`SMS successfully dispatched to ${cleanPhone} via ${carrier}`);
      setTimeout(() => setDeliveryToast(null), 4000);
    }, 750);
  };

  // Direct Send to real mobile
  const handleDirectSendToPhone = async () => {
    setIsSending(true);
    const todayStr = new Date().toISOString().split('T')[0];
    const allocation = allocateOptimalSlot(existingBookings, todayStr, 'AUTO_OPTIMAL');
    const farmerId = String(Math.floor(10000 + Math.random() * 90000));
    const bookingId = `SMS-${Date.now().toString().slice(-5)}`;

    const newBooking: Booking = {
      id: bookingId,
      farmerId,
      farmerName: farmerNameInput.trim() || 'Farmer',
      phone: cleanPhone,
      commodity: selectedCrop,
      quantityQuintals: quantityInput,
      vehicleNumber: 'HR-05-AR-2291',
      vehicleType: 'Tractor Trolley',
      bookingDate: todayStr,
      allocatedSlot: allocation.allocatedSlot,
      allocatedHour: allocation.allocatedHour,
      mandiName: MANDI_NAME,
      channel: 'sms_gateway',
      status: 'confirmed',
      tokenNumber: allocation.tokenNumber,
      estimatedWaitMinutes: allocation.estimatedWaitMinutes,
      qrPayload: JSON.stringify({ id: bookingId, farmerId, slot: allocation.allocatedSlot }),
      bypassMorningRushNote: 'Bypasses morning rush with 2 PM guaranteed slot.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveBooking(newBooking);
    onBookingCreated(newBooking);

    const smsBody = formatApmcPassSms(newBooking, selectedLanguage);
    const record = await dispatchApmcSms(cleanPhone, smsBody, newBooking, carrier);
    setDispatchLogs((prev) => [record, ...prev]);

    setMessages((prev) => [
      ...prev,
      {
        id: `SYS-${Date.now()}`,
        sender: 'system',
        text: smsBody,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'DELIVRD',
        bookingRef: newBooking,
      },
    ]);

    setIsSending(false);
    setDeliveryToast(`Pass confirmed & dispatched to ${cleanPhone}`);
    setTimeout(() => setDeliveryToast(null), 4000);
  };

  // The latest booking in context for quick sharing
  const latestBooking =
    [...messages].reverse().find((m) => m.bookingRef)?.bookingRef || initialBooking;

  const currentPreviewSms = latestBooking
    ? formatApmcPassSms(latestBooking, selectedLanguage)
    : `[APMC AgriSync] Confirmed: Token #101. Farmer: ${farmerNameInput}. Crop: ${selectedCrop} (${quantityInput} Qtl). Slot: 2 PM (02:00 PM - 02:30 PM). Avoids morning rush. Ref: 12345. Pass: ${typeof window !== 'undefined' ? window.location.origin : ''}/?passId=SMS-101`;

  const nativeSmsUri = buildNativeSmsUri(cleanPhone, currentPreviewSms);
  const whatsAppUri = buildWhatsAppUri(cleanPhone, currentPreviewSms);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-stone-700 flex flex-col my-auto max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="bg-stone-900 text-stone-100 px-5 py-3.5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider uppercase text-amber-400">
                  GSM & DLT SMS Gateway
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  TRAI DLT Verified (Header: VM-AGRIAPMC)
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Offline-First Procurement Pass via GSM SMS • No Smartphone or Internet Required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-stone-100 border-b border-stone-200 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('handset')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'handset'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-200/80 border border-stone-300'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Interactive Phone (Slide 7)</span>
            </button>
            <button
              onClick={() => setActiveTab('direct_send')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'direct_send'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-200/80 border border-stone-300'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-amber-500" />
              <span>Send to My Actual Mobile</span>
            </button>
            <button
              onClick={() => setActiveTab('smpp_logs')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'smpp_logs'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-200/80 border border-stone-300'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-blue-500" />
              <span>Telecom SMPP & DLT Log ({dispatchLogs.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-stone-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>SMPP Bind: smpp.agrisync.gov.in (ESTABLISHED)</span>
          </div>
        </div>

        {/* Global Toast */}
        {deliveryToast && (
          <div className="bg-emerald-800 text-white px-4 py-2 text-xs flex items-center justify-between animate-in slide-in-from-top duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="font-medium">{deliveryToast}</span>
            </div>
            <a
              href={nativeSmsUri}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs"
            >
              <Smartphone className="w-3 h-3" />
              Open in Native SMS
            </a>
          </div>
        )}

        {/* TAB 1: INTERACTIVE HANDSET VIEW */}
        {activeTab === 'handset' && (
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 bg-stone-50">
            {/* Left: Mobile Phone Simulation */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-sm bg-stone-900 rounded-[2.5rem] p-3 shadow-2xl border-4 border-stone-800 flex flex-col h-[520px]">
                {/* Phone Top Bezel & Status Bar */}
                <div className="px-4 pt-1 pb-2 flex items-center justify-between text-stone-300 text-[10px]">
                  <span className="font-mono font-bold">09:41</span>
                  {/* Dynamic Island / Speaker Notch */}
                  <div className="w-20 h-4 bg-stone-950 rounded-full flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-stone-800"></span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[9px] text-emerald-400">5G</span>
                    <Wifi className="w-3 h-3" />
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>

                {/* Handset Messaging App Header */}
                <div className="bg-stone-800/90 rounded-t-2xl px-3 py-2 text-white flex items-center justify-between border-b border-stone-700">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                      🏛️
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs tracking-tight">VM-AGRIAPMC</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-[9px] text-stone-400">Official Krishi DLT Service</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-amber-400 font-mono block">
                      To: {cleanPhone}
                    </span>
                    <span className="text-[9px] text-stone-400">Toll-Free 1800</span>
                  </div>
                </div>

                {/* Chat Message Thread */}
                <div className="flex-1 bg-stone-950/70 p-3 overflow-y-auto space-y-3 font-sans text-xs">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === 'farmer' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[88%] p-3 rounded-2xl shadow-sm leading-relaxed ${
                          m.sender === 'farmer'
                            ? 'bg-emerald-600 text-white rounded-tr-xs'
                            : 'bg-stone-800 text-stone-100 rounded-tl-xs border border-stone-700'
                        }`}
                      >
                        <div className="text-[9px] opacity-75 font-mono mb-1 flex items-center justify-between">
                          <span>{m.sender === 'farmer' ? `Farmer (${cleanPhone})` : 'VM-AGRIAPMC'}</span>
                          <span>{m.time}</span>
                        </div>
                        <p className="font-medium text-xs whitespace-pre-line leading-relaxed">
                          {m.text}
                        </p>

                        {/* Interactive pass button inside message bubble */}
                        {m.bookingRef && (
                          <div className="mt-2.5 pt-2 border-t border-stone-600 space-y-1.5">
                            <button
                              onClick={() => {
                                onBookingCreated(m.bookingRef!);
                                onClose();
                              }}
                              className="w-full py-1.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              Open Official Gate Pass (#{m.bookingRef.tokenNumber})
                            </button>

                            <div className="flex gap-1">
                              <a
                                href={buildNativeSmsUri(cleanPhone, m.text)}
                                className="flex-1 py-1 px-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded text-[10px] font-semibold text-center flex items-center justify-center gap-1"
                              >
                                <Smartphone className="w-2.5 h-2.5 text-amber-400" />
                                <span>Native SMS</span>
                              </a>
                              <a
                                href={buildWhatsAppUri(cleanPhone, m.text)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-1 px-1.5 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 rounded text-[10px] font-semibold text-center flex items-center justify-center gap-1"
                              >
                                <Share2 className="w-2.5 h-2.5 text-emerald-400" />
                                <span>WhatsApp</span>
                              </a>
                              <button
                                onClick={() => handleCopyText(m.text, m.id)}
                                className="py-1 px-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded text-[10px] font-semibold flex items-center justify-center cursor-pointer"
                              >
                                {copiedId === m.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-stone-500 mt-0.5 px-1 flex items-center gap-1">
                        {m.sender === 'farmer' ? 'Delivered ✓✓' : 'Govt DLT Route • 160 GSM'}
                      </span>
                    </div>
                  ))}

                  {isSending && (
                    <div className="flex items-center gap-2 text-stone-400 text-xs italic bg-stone-800/60 p-2 rounded-xl">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      APMC Cloud computing 2 PM optimal slot to bypass morning rush...
                    </div>
                  )}
                </div>

                {/* Handset Message Input Bar */}
                <form
                  onSubmit={handleSend}
                  className="p-2 bg-stone-900 rounded-b-2xl border-t border-stone-800 flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type SMS or reply..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-stone-800 text-white placeholder-stone-400 border border-stone-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !inputText.trim()}
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl cursor-pointer transition-all flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Farmer Configuration & Quick Scenario Triggers */}
            <div className="lg:col-span-5 space-y-4">
              {/* Recipient Number Configuration Card */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
                    Farmer Mobile Number (Recipient)
                  </h4>
                  <span className="text-[10px] text-stone-500 font-mono">+91 Validated</span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] text-stone-600 block mb-1 font-medium">
                      Mobile Number (Type your real phone to receive SMS):
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-stone-50 font-mono focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setPhoneInput('+91 98765 43210')}
                        className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-medium cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-stone-500 block">Farmer Name</label>
                      <input
                        type="text"
                        value={farmerNameInput}
                        onChange={(e) => setFarmerNameInput(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-stone-300 bg-stone-50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-stone-500 block">Crop</label>
                      <select
                        value={selectedCrop}
                        onChange={(e) => setSelectedCrop(e.target.value as any)}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-stone-300 bg-stone-50 cursor-pointer"
                      >
                        <option value="Wheat">Wheat (गेहूं)</option>
                        <option value="Paddy">Paddy (धान)</option>
                        <option value="Mustard">Mustard (सरसों)</option>
                        <option value="Cotton">Cotton (कपास)</option>
                        <option value="Maize">Maize (मक्का)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-stone-500 block">Quantity (Quintals)</label>
                      <input
                        type="number"
                        value={quantityInput}
                        onChange={(e) => setQuantityInput(Number(e.target.value))}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-stone-300 bg-stone-50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-stone-500 block">Language</label>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value as any)}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-stone-300 bg-stone-50 cursor-pointer"
                      >
                        <option value="en">English</option>
                        <option value="hi">हिंदी (Hindi)</option>
                        <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                        <option value="ta">தமிழ் (Tamil)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Preset SMS Commands */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                <h4 className="font-bold text-stone-900 text-xs mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Quick Slide 7 GSM Scenarios
                </h4>
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      handleQuickCommand('Book slot for wheat');
                    }}
                    className="w-full p-2 text-left rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>🌾 "Book slot for wheat" (Slide 7 Benchmark)</span>
                    <ArrowRight className="w-3 h-3 text-amber-700" />
                  </button>
                  <button
                    onClick={() => {
                      handleQuickCommand('BOOK 12345 WHEAT 45 TRACTOR HR05');
                    }}
                    className="w-full p-2 text-left rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>🚜 "BOOK 12345 WHEAT 45 TRACTOR HR05"</span>
                    <ArrowRight className="w-3 h-3 text-emerald-700" />
                  </button>
                  <button
                    onClick={() => {
                      handleQuickCommand('STATUS 12345');
                    }}
                    className="w-full p-2 text-left rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>📊 "STATUS 12345" (Check Gate Queue)</span>
                    <ArrowRight className="w-3 h-3 text-stone-500" />
                  </button>
                  <button
                    onClick={() => {
                      handleQuickCommand('HELP');
                    }}
                    className="w-full p-2 text-left rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>❓ "HELP" (List Toll-Free Keywords)</span>
                    <ArrowRight className="w-3 h-3 text-stone-500" />
                  </button>
                </div>
              </div>

              {/* Direct Actions to Real Phone */}
              <div className="bg-gradient-to-r from-emerald-800 to-amber-800 text-white p-4 rounded-2xl shadow-md space-y-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-300" />
                  <span className="font-bold text-xs">Direct Mobile Delivery Actions</span>
                </div>
                <p className="text-[11px] text-emerald-100 leading-relaxed">
                  Trigger native SMS on your phone, launch WhatsApp with prefilled gate pass, or scan the QR to receive immediately.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={nativeSmsUri}
                    className="py-2 px-3 bg-white hover:bg-stone-100 text-stone-900 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Native SMS App</span>
                  </a>
                  <a
                    href={whatsAppUri}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEND TO ACTUAL MOBILE & QR TO PHONE */}
        {activeTab === 'direct_send' && (
          <div className="p-5 flex-1 overflow-y-auto bg-stone-50 space-y-5">
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-3xl border border-stone-200 shadow-md space-y-5">
              <div>
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Real Mobile Delivery Hub
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-2">
                  Dispatch APMC Gate Entry Pass to Any Mobile Phone
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Enter your real mobile number below. You can send it directly to your phone's Messages app, WhatsApp, or scan the QR code with your camera.
                </p>
              </div>

              {/* Form Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    Mobile Number (Recipient) *
                  </label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 font-mono focus:bg-white focus:ring-2 focus:ring-emerald-600"
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    Target: {cleanPhone}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    Farmer Name
                  </label>
                  <input
                    type="text"
                    value={farmerNameInput}
                    onChange={(e) => setFarmerNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    Commodity & Quantity
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedCrop}
                      onChange={(e) => setSelectedCrop(e.target.value as any)}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50"
                    >
                      <option value="Wheat">Wheat</option>
                      <option value="Paddy">Paddy</option>
                      <option value="Mustard">Mustard</option>
                      <option value="Cotton">Cotton</option>
                      <option value="Maize">Maize</option>
                    </select>
                    <input
                      type="number"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(Number(e.target.value))}
                      className="w-20 px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50"
                  >
                    <option value="en">English (DLT Approved)</option>
                    <option value="hi">हिंदी (Hindi Unicode)</option>
                    <option value="pa">ਪੰਜਾਬੀ (Punjabi Unicode)</option>
                    <option value="ta">தமிழ் (Tamil Unicode)</option>
                  </select>
                </div>
              </div>

              {/* Message Preview Box */}
              <div className="bg-stone-900 rounded-2xl p-4 text-stone-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-400 border-b border-stone-800 pb-2">
                  <span className="font-mono text-amber-400">Header: VM-AGRIAPMC</span>
                  <span>
                    Length: {currentPreviewSms.length} chars (
                    {Math.ceil(currentPreviewSms.length / 160)} SMS)
                  </span>
                </div>
                <p className="text-xs font-mono whitespace-pre-line leading-relaxed text-emerald-200">
                  {currentPreviewSms}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href={nativeSmsUri}
                  className="py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Smartphone className="w-4 h-4 text-amber-300" />
                  <span>Open in Mobile SMS</span>
                </a>
                <a
                  href={whatsAppUri}
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Send via WhatsApp</span>
                </a>
                <button
                  onClick={handleDirectSendToPhone}
                  disabled={isSending}
                  className="py-3 px-4 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'Sending...' : 'Dispatch Gateway SMS'}</span>
                </button>
              </div>

              {/* QR Code to Receive on Phone */}
              <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center gap-5 bg-stone-50 p-4 rounded-2xl">
                <div className="p-3 bg-white rounded-2xl border-2 border-stone-300 shadow-sm shrink-0">
                  <QRCodeSVG
                    value={
                      qrMode === 'smsto'
                        ? `SMSTO:${cleanPhone}:${currentPreviewSms}`
                        : `${typeof window !== 'undefined' ? window.location.origin : ''}/?passId=${latestBooking?.id || 'SMS-101'}`
                    }
                    size={130}
                    level="H"
                  />
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <span className="font-bold text-stone-900 text-xs">
                      Scan with Phone Camera to Text Instantly:
                    </span>
                    <button
                      onClick={() => setQrMode(qrMode === 'smsto' ? 'weblink' : 'smsto')}
                      className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-semibold cursor-pointer hover:bg-stone-300"
                    >
                      Switch to: {qrMode === 'smsto' ? 'Web Link' : 'SMS Protocol (SMSTO:)'}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Point your mobile phone camera at this QR code. Your camera app will automatically pop up <strong>"Send text to {cleanPhone}"</strong> with the entire APMC Gate Entry Pass pre-filled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TELECOM SMPP 3.4 & DLT LOGS */}
        {activeTab === 'smpp_logs' && (
          <div className="p-5 flex-1 overflow-y-auto bg-stone-950 text-stone-200 font-mono text-xs space-y-4">
            {/* Telecom Carrier Status Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-500 block">SMPP PROTOCOL</span>
                <span className="text-emerald-400 font-bold text-xs">v3.4 (TRANSCEIVER)</span>
              </div>
              <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-500 block">TRAI DLT HEADER</span>
                <span className="text-amber-400 font-bold text-xs">VM-AGRIAPMC (Govt)</span>
              </div>
              <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-500 block">TEMPLATE ID</span>
                <span className="text-stone-300 font-bold text-xs">1407161234567</span>
              </div>
              <div className="bg-stone-900 p-3 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-500 block">SMPP STATUS</span>
                <span className="text-emerald-400 font-bold text-xs">0x00 (ESME_ROK)</span>
              </div>
            </div>

            {/* Log Stream */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-stone-400 text-[11px] pb-1 border-b border-stone-800">
                <span>RECENT TELECOM DISPATCHES ({dispatchLogs.length})</span>
                <span>CARRIER: {carrier}</span>
              </div>

              {dispatchLogs.length === 0 ? (
                <div className="p-6 text-center text-stone-600 italic">
                  No SMS dispatches recorded yet. Send a message to see the SMPP PDU log stream.
                </div>
              ) : (
                dispatchLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-stone-900/90 rounded-xl border border-stone-800 hover:border-stone-700 transition-colors space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                      <span className="text-amber-400 font-bold">{log.id}</span>
                      <span className="text-stone-400">Target: {log.to}</span>
                      <span className="text-emerald-400 font-bold">STATUS: {log.status}</span>
                      <span className="text-stone-500">{log.timestamp}</span>
                    </div>
                    <div className="text-stone-300 text-[11px] leading-relaxed break-all">
                      {log.message}
                    </div>
                    <div className="text-[9px] text-stone-500 flex items-center justify-between pt-1 border-t border-stone-800">
                      <span>Header: {log.senderId} • DLT: {log.templateId}</span>
                      <span>
                        {log.chars} chars • {log.segments} PDU Segment(s) • Gateway: {log.carrier}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Modal Bottom Footer */}
        <div className="bg-stone-100 px-5 py-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-stone-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Toll-Free Gateway: <strong>1800-AGRI-SYNC</strong> • SIH Slide 7 Predictive Engine
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
            {latestBooking && (
              <button
                onClick={() => {
                  onBookingCreated(latestBooking);
                  onClose();
                }}
                className="px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Open Active Pass</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
