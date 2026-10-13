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
} from './services/bookingStore';
import { testConnection } from './firebase';
import { Sprout, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'farmer' | 'pass' | 'admin' | 'sms'>('farmer');
  const [bookings, setBookings] = useState<Booking[]>(SEED_BOOKINGS);
  const [activePassBooking, setActivePassBooking] = useState<Booking | null>(
    SEED_BOOKINGS.find((b) => b.farmerId === '12345') || SEED_BOOKINGS[0]
  );
  const [language, setLanguage] = useState<'en' | 'hi' | 'pa'>('en');

  // Modals
  const [isGateScannerOpen, setIsGateScannerOpen] = useState(false);
  const [weighbridgeBooking, setWeighbridgeBooking] = useState<Booking | null>(null);
  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

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
      />

      {/* Main Views */}
      <main className="flex-1">
        {currentTab === 'farmer' && (
          <FarmerPortal
            existingBookings={bookings}
            onBookingSuccess={handleBookingSuccess}
            language={language}
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
