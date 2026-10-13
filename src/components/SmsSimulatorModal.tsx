import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Ticket,
  ArrowRight
} from 'lucide-react';
import { Booking } from '../types/procurement';
import { allocateOptimalSlot, MANDI_NAME } from '../services/dynamicAllocation';
import { saveBooking } from '../services/bookingStore';

interface SmsSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingBookings: Booking[];
  onBookingCreated: (booking: Booking) => void;
}

export const SmsSimulatorModal: React.FC<SmsSimulatorModalProps> = ({
  isOpen,
  onClose,
  existingBookings,
  onBookingCreated,
}) => {
  const [inputText, setInputText] = useState('Book slot for wheat');
  const [messages, setMessages] = useState<
    { sender: 'farmer' | 'system'; text: string; time: string; bookingRef?: Booking }[]
  >([
    {
      sender: 'system',
      text: 'Welcome to APMC AgriSync SMS Gateway (Toll-Free 1800-AGRI-SYNC). Reply "Book slot for [crop]" or "Status" to reserve queue pass.',
      time: '09:00 AM',
    },
  ]);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [...prev, { sender: 'farmer', text: userMsg, time: timeStr }]);
    setInputText('');
    setIsSending(true);

    // Simulate SMS processing with the dynamic predictive allocation logic!
    setTimeout(async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const allocation = allocateOptimalSlot(existingBookings, todayStr, 'AUTO_OPTIMAL');

      const farmerId = '12345';
      const bookingId = `SMS-${Date.now().toString().slice(-5)}`;
      const qrData = JSON.stringify({
        id: bookingId,
        farmerId,
        commodity: 'Wheat',
        slot: allocation.allocatedSlot,
        mandi: MANDI_NAME,
        verified: true,
      });

      const newBooking: Booking = {
        id: bookingId,
        farmerId,
        farmerName: 'Balwant Singh (SMS)',
        phone: '+91 98765 43210',
        commodity: 'Wheat',
        quantityQuintals: 45,
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
        bypassMorningRushNote: 'System intelligently allocates a 2 PM slot to bypass morning rush.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await saveBooking(newBooking);
        onBookingCreated(newBooking);
      } catch (err) {
        console.error(err);
      }

      // Exact text matching Slide 7:
      // "SMS 2: System -> Farmer: Confirmed. Slot: 2 PM. Ref: 12345. Avoids morning rush."
      const replyText = `Confirmed. Slot: 2 PM (${allocation.allocatedSlot}). Ref: ${farmerId}. Avoids morning rush. Gate turnaround: ~15 mins. Show SMS or QR at gate.`;

      setMessages((prev) => [
        ...prev,
        {
          sender: 'system',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          bookingRef: newBooking,
        },
      ]);
      setIsSending(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border-4 border-stone-800">
        {/* Retro Phone Top Bezel */}
        <div className="bg-stone-900 text-stone-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold font-mono tracking-wider">
              OFFLINE-FIRST SMS GATEWAY
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* SIH Slide 7 Callout banner */}
        <div className="bg-amber-100/80 px-4 py-2 border-b border-amber-200 text-[11px] text-amber-900 flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>Interactive Slide 7 demo: SMS booking without internet access!</span>
        </div>

        {/* Message Thread */}
        <div className="p-4 h-80 overflow-y-auto space-y-3 bg-stone-100 text-xs font-sans">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'farmer' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl shadow-xs leading-relaxed ${
                  m.sender === 'farmer'
                    ? 'bg-emerald-700 text-white rounded-tr-xs'
                    : 'bg-white text-stone-900 rounded-tl-xs border border-stone-200'
                }`}
              >
                <div className="text-[10px] opacity-75 font-mono mb-1">
                  {m.sender === 'farmer' ? 'Farmer → APMC' : 'APMC AgriSync'}
                </div>
                <p className="font-medium text-xs">{m.text}</p>
                {m.bookingRef && (
                  <button
                    onClick={() => {
                      onBookingCreated(m.bookingRef!);
                      onClose();
                    }}
                    className="mt-2.5 w-full py-1.5 px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Ticket className="w-3.5 h-3.5 text-emerald-700" />
                    Open Generated Gate Pass
                  </button>
                )}
              </div>
              <span className="text-[9px] text-stone-400 mt-0.5 px-1">{m.time}</span>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-stone-500 text-xs italic">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              APMC Cloud allocating 2 PM slot...
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-stone-200 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type 'Book slot for wheat'..."
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-stone-50"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="bg-stone-50 px-4 py-2 text-[10px] text-stone-500 text-center border-t border-stone-100">
          Tip: Send <strong>"Book slot for wheat"</strong> to trigger the Slide 7 predictive scenario.
        </div>
      </div>
    </div>
  );
};
