/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { FarmerPortal } from './components/FarmerPortal';
import { DigitalPass } from './components/DigitalPass';
import { AdminDashboard } from './components/AdminDashboard';
import { GateScannerModal } from './components/GateScannerModal';
import { WeighingBridgeModal } from './components/WeighingBridgeModal';
import { SmsSimulatorModal } from './components/SmsSimulatorModal';
import { ProjectReportModal } from './components/ProjectReportModal';
import { AudioTranscriberModal } from './components/AudioTranscriberModal';
import {
  Booking,
  MandiDayArrival,
  QueueTrendPoint,
} from './types/procurement';
import {
  SEED_BOOKINGS,
  DEFAULT_DAILY_ARRIVALS,
  DEFAULT_QUEUE_TREND,
  seedInitialBookingsIfEmpty,
  subscribeToBookings,
  getLocalBookings,
  saveBooking,
} from './services/bookingStore';
import { TranscriptionResult } from './services/transcriptionService';
import { testConnection } from './firebase';
import { Sprout, ShieldCheck, Cpu, ArrowRight, Smartphone } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'farmer' | 'pass' | 'admin' | 'sms'>('farmer');
  const [bookings, setBookings] = useState<Booking[]>(() => getLocalBookings());
  const [activePassBooking, setActivePassBooking] = useState<Booking | null>(() => {
    const list = getLocalBookings();
    return list.find((b) => b.farmerId === '12345') || list[0] || null;
  });
  const [language, setLanguage] = useState<'en' | 'hi' | 'pa' | 'ta'>('en');
  const [isMobileScannedPass, setIsMobileScannedPass] = useState(false);

  // Modals
  const [isGateScannerOpen, setIsGateScannerOpen] = useState(false);
  const [weighbridgeBooking, setWeighbridgeBooking] = useState<Booking | null>(null);
  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isTranscriberOpen, setIsTranscriberOpen] = useState(false);
  const [voiceAutofillData, setVoiceAutofillData] = useState<TranscriptionResult['parsedFields'] | null>(null);

  // Handle URL parameters (e.g. when farmer scans QR code on phone)
  useEffect(() => {
    const handleUrlParams = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const passId = searchParams.get('passId') || searchParams.get('id') || hashParams.get('passId');

      if (passId) {
        setIsMobileScannedPass(true);
        const currentList = getLocalBookings();
        const existing = currentList.find((b) => b.id === passId || b.farmerId === passId);

        if (existing) {
          setActivePassBooking(existing);
          setCurrentTab('pass');
        } else {
          // Reconstruct pass data from URL parameters
          const reconstructedBooking: Booking = {
            id: passId,
            farmerId: searchParams.get('fId') || searchParams.get('farmerId') || '12345',
            farmerName: searchParams.get('fName') || searchParams.get('farmerName') || 'Balwant Singh',
            phone: searchParams.get('phone') || '+91 98765 43210',
            commodity: (searchParams.get('comm') || searchParams.get('commodity') || 'Wheat') as any,
            quantityQuintals: Number(searchParams.get('qty') || 45),
            vehicleNumber: searchParams.get('veh') || 'HR-05-AR-2291',
            vehicleType: (searchParams.get('vehType') || 'Tractor Trolley') as any,
            bookingDate: searchParams.get('date') || new Date().toISOString().split('T')[0],
            allocatedSlot: searchParams.get('slot') || '02:00 PM - 02:30 PM',
            allocatedHour: 14.0,
            mandiName: searchParams.get('mandi') || 'APMC Karnal Grain Mandi (Terminal-01)',
            channel: 'web_portal',
            status: (searchParams.get('status') as any) || 'confirmed',
            tokenNumber: Number(searchParams.get('token') || 101),
            estimatedWaitMinutes: 12,
            qrPayload: window.location.href,
            bypassMorningRushNote: 'System intelligently allocated a 2 PM slot to bypass morning rush.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          setActivePassBooking(reconstructedBooking);
          setBookings((prev) => {
            if (prev.some((b) => b.id === reconstructedBooking.id)) return prev;
            return [reconstructedBooking, ...prev];
          });
          saveBooking(reconstructedBooking);
          setCurrentTab('pass');
        }
      }
    };

    handleUrlParams();
    window.addEventListener('popstate', handleUrlParams);
    return () => window.removeEventListener('popstate', handleUrlParams);
  }, []);

  // Initialize Firebase connection and data subscription
  useEffect(() => {
    testConnection();
    seedInitialBookingsIfEmpty();

    const unsubscribe = subscribeToBookings(
      (updatedList) => {
        if (updatedList.length > 0) {
          setBookings(updatedList);
          // If active pass booking exists, refresh it from updated data
          setActivePassBooking((prev) => {
            if (!prev) return updatedList[0];
            const refreshed = updatedList.find((b) => b.id === prev.id);
            return refreshed || prev;
          });
        }
      },
      (err) => {
        console.warn('Real-time subscription notice:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleBookingSuccess = (newBooking: Booking) => {
    setActivePassBooking(newBooking);
    setCurrentTab('pass');
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans antialiased selection:bg-emerald-200 selection:text-emerald-900">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab === 'sms' ? 'farmer' : currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'sms') {
            setIsSmsOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        hasActivePass={Boolean(activePassBooking)}
        language={language}
        setLanguage={setLanguage}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenTranscriber={() => setIsTranscriberOpen(true)}
      />

      {/* Mobile QR Scan Notification Banner */}
      {isMobileScannedPass && (
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-amber-800 text-white px-4 py-2.5 text-xs shadow-md border-b border-emerald-600/40 animate-in slide-in-from-top duration-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <Smartphone className="w-4 h-4 text-amber-300" />
              <span className="font-bold">
                Official Gate Entry Pass Opened via Mobile QR Scan
              </span>
              <span className="hidden sm:inline text-emerald-100">
                • Verified APMC Mandi Security Token #{activePassBooking?.tokenNumber || '101'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsMobileScannedPass(false);
                  window.history.replaceState({}, document.title, window.location.pathname);
                }}
                className="text-emerald-100 hover:text-white underline cursor-pointer text-[11px] font-medium"
              >
                Dismiss Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Views */}
      <main className="flex-1">
        {currentTab === 'farmer' && (
          <FarmerPortal
            existingBookings={bookings}
            onBookingSuccess={handleBookingSuccess}
            language={language}
            onOpenTranscriber={() => setIsTranscriberOpen(true)}
            voiceAutofillFields={voiceAutofillData}
          />
        )}

        {currentTab === 'pass' && (
          <DigitalPass
            booking={activePassBooking}
            onOpenGateScanner={() => setIsGateScannerOpen(true)}
            onBookAnother={() => setCurrentTab('farmer')}
            onViewAdmin={() => setCurrentTab('admin')}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            bookings={bookings}
            dailyArrivals={DEFAULT_DAILY_ARRIVALS}
            queueTrend={DEFAULT_QUEUE_TREND}
            onOpenGateScanner={() => setIsGateScannerOpen(true)}
            onSelectBookingForPass={(b) => {
              setActivePassBooking(b);
              setCurrentTab('pass');
            }}
            onOpenWeighbridge={(b) => setWeighbridgeBooking(b)}
            onOpenNewBooking={() => setCurrentTab('farmer')}
          />
        )}
      </main>

      {/* Modals */}
      <GateScannerModal
        isOpen={isGateScannerOpen}
        onClose={() => setIsGateScannerOpen(false)}
        bookings={bookings}
        onPassVerified={(verifiedBooking) => {
          setActivePassBooking(verifiedBooking);
        }}
      />

      <WeighingBridgeModal
        isOpen={Boolean(weighbridgeBooking)}
        onClose={() => setWeighbridgeBooking(null)}
        booking={weighbridgeBooking}
      />

      <SmsSimulatorModal
        isOpen={isSmsOpen}
        onClose={() => setIsSmsOpen(false)}
        existingBookings={bookings}
        onBookingCreated={(newBooking) => {
          setActivePassBooking(newBooking);
          setCurrentTab('pass');
        }}
      />

      <ProjectReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      {isTranscriberOpen && (
        <AudioTranscriberModal
          isOpen={isTranscriberOpen}
          onClose={() => setIsTranscriberOpen(false)}
          language={language}
          onApplyFields={(fields) => {
            setVoiceAutofillData(fields);
            setCurrentTab('farmer');
          }}
        />
      )}

      {/* Footer matching Slide 1 & 10 */}
      <footer className="bg-white border-t border-stone-200 mt-12 py-8 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center font-bold">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-stone-800 text-sm font-serif">
                AgriSync Cloud Platform
              </div>
              <div>Valuing the farmer's time, protecting the farmer's yield.</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-center sm:text-right text-[11px]">
            <div>Team AgriDev • Smart India Hackathon 2026</div>
            <div className="hidden sm:inline">•</div>
            <div>Department of Computer Science • NIT</div>
            <div className="hidden sm:inline">•</div>
            <div className="text-emerald-700 font-semibold">Firebase Firestore Sync Active</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
