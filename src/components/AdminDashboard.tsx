import React, { useState } from 'react';
import {
  LayoutDashboard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Wheat,
  Truck,
  Plus,
  RefreshCw,
  Eye,
  Scale,
  ShieldCheck,
  Building2,
  AlertCircle,
  Download,
  Calendar,
} from 'lucide-react';
import { Booking, MandiDayArrival, QueueTrendPoint } from '../types/procurement';
import { DailyArrivalsChart } from './DailyArrivalsChart';
import { LiveQueueTrendChart } from './LiveQueueTrendChart';
import { MandiOperationsCard } from './MandiOperationsCard';
import {
  MANDI_NAME,
  calculateMandiMetrics,
} from '../services/dynamicAllocation';
import { updateBookingStatus } from '../services/bookingStore';

interface AdminDashboardProps {
  bookings: Booking[];
  dailyArrivals: MandiDayArrival[];
  queueTrend: QueueTrendPoint[];
  onOpenGateScanner: () => void;
  onSelectBookingForPass: (booking: Booking) => void;
  onOpenWeighbridge: (booking: Booking) => void;
  onOpenNewBooking: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  bookings,
  dailyArrivals,
  queueTrend,
  onOpenGateScanner,
  onSelectBookingForPass,
  onOpenWeighbridge,
  onOpenNewBooking,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate live mandi metrics
  const metrics = calculateMandiMetrics(bookings, todayStr);

  // Filter bookings for the table
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.farmerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCommodity = selectedCommodity === 'ALL' || b.commodity === selectedCommodity;
    const matchesStatus = selectedStatus === 'ALL' || b.status === selectedStatus;

    return matchesSearch && matchesCommodity && matchesStatus;
  });

  const handleUpdateStatus = async (
    bookingId: string,
    newStatus: Booking['status']
  ) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Mandi Administrator Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse mr-1"></span>
              APMC Command Center
            </span>
            <span className="text-xs text-stone-500 font-mono">
              Live Cloud Node: Terminal-01
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
            Mandi Administration Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            {MANDI_NAME} • Automated Predictive Queue & Dynamic Load Balancing
          </p>
        </div>

        {/* Quick action toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenGateScanner}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>Gate QR Scanner</span>
          </button>

          <button
            onClick={onOpenNewBooking}
            className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book Walk-in Slot</span>
          </button>
        </div>
      </div>

      {/* Primary Mandi Charts & Live Metrics Grid (As shown on Slide 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Daily Arrivals Bar Chart (Slide 7 Top Left) */}
        <DailyArrivalsChart data={dailyArrivals} />

        {/* Card 2: Live Queue Status with Trend Graph (Slide 7 Top Right & Bottom Left) */}
        <LiveQueueTrendChart
          currentQueueSize={metrics.currentQueueSize}
          totalToday={metrics.totalBookingsToday}
          atGateCount={metrics.atGateCount}
          weighingCount={metrics.weighingCount}
          completedCount={metrics.completedCount}
          trendData={queueTrend}
        />
      </div>

      {/* Mandi Operations Section (Slide 7 Bottom Right) + Operational Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mandi Operations: Slots Filled progress bar & Avg. Wait (Slide 7) */}
        <div className="lg:col-span-2">
          <MandiOperationsCard
            slotsFilledPercent={metrics.slotsFilledPercent}
            avgWaitTime={metrics.avgWaitTime}
            totalBookings={metrics.totalBookingsToday}
            onOpenGateScanner={onOpenGateScanner}
          />
        </div>

        {/* Dynamic Capacity Allocation Diagnostic Box */}
        <div className="bg-gradient-to-br from-emerald-900 to-stone-900 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800/80">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Predictive Load Balancer
              </span>
              <span className="text-[10px] bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded-full font-mono">
                Active Policy
              </span>
            </div>

            <h4 className="text-lg font-serif font-bold text-white mt-3">
              Morning Rush Bypass Logic
            </h4>
            <p className="text-xs text-emerald-100/90 mt-2 leading-relaxed">
              When 08:30–11:00 AM slots hit &gt;75% queue threshold, new farmer requests are automatically diverted to <strong>02:00 PM</strong> window.
            </p>

            <div className="space-y-2 mt-4 text-xs">
              <div className="flex justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-stone-300">Morning Peak Influx</span>
                <span className="font-mono font-bold text-amber-300">Flattened (-72%)</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-stone-300">Crop Spoilage Risk</span>
                <span className="font-mono font-bold text-emerald-300">Negligible (0.02%)</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-stone-300">Average Turnaround</span>
                <span className="font-mono font-bold text-emerald-300">12–15 Minutes</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-800/60 text-[11px] text-emerald-300 flex items-center justify-between">
            <span>Sync Engine: Cloud Firestore</span>
            <span className="font-semibold text-amber-300">100% Online</span>
          </div>
        </div>
      </div>

      {/* Live Procurement Queue Records Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Table Filter & Search Header */}
        <div className="p-5 border-b border-stone-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
              <Wheat className="w-5 h-5 text-emerald-700" />
              Live Queue & Arrival Records
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Real-time gate passes, weighbridge status, and transaction settlement
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search Farmer / ID / Vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-stone-50"
              />
            </div>

            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 font-medium text-stone-700"
            >
              <option value="ALL">All Commodities</option>
              <option value="Wheat">Wheat</option>
              <option value="Mustard">Mustard</option>
              <option value="Paddy">Paddy</option>
              <option value="Cotton">Cotton</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 font-medium text-stone-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="confirmed">Confirmed (Scheduled)</option>
              <option value="at_gate">At Gate</option>
              <option value="weighing">In Weighing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 text-[11px] font-bold text-stone-700 uppercase tracking-wider border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4">Token & Farmer</th>
                <th className="py-3.5 px-4">Commodity</th>
                <th className="py-3.5 px-4">Vehicle & Qty</th>
                <th className="py-3.5 px-4">Allocated Slot</th>
                <th className="py-3.5 px-4">Queue Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-stone-400">
                    No matching bookings found.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const is2PM = b.allocatedSlot.includes('02:00 PM');
                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-stone-50/80 transition-colors"
                    >
                      {/* Token & Farmer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center justify-center text-xs">
                            #{b.tokenNumber}
                          </span>
                          <div>
                            <div className="font-bold text-stone-900 flex items-center gap-1.5">
                              {b.farmerName}
                              {b.farmerId === '12345' && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 px-1 rounded font-semibold border border-amber-300">
                                  Demo Target
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-400 font-mono">
                              ID: {b.farmerId} • {b.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Commodity */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-stone-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Wheat className="w-3.5 h-3.5 text-amber-600" />
                          {b.commodity}
                        </span>
                      </td>

                      {/* Vehicle & Qty */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">
                          {b.quantityQuintals} Quintals
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          {b.vehicleNumber} ({b.vehicleType.split(' ')[0]})
                        </div>
                      </td>

                      {/* Allocated Slot */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-xs inline-block ${
                              is2PM
                                ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                                : 'bg-stone-100 text-stone-800'
                            }`}
                          >
                            {b.allocatedSlot}
                          </span>
                          {b.bypassMorningRushNote && (
                            <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
                              ✓ Predictive Rush Bypass
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="py-3.5 px-4">
                        {b.status === 'confirmed' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            Confirmed
                          </span>
                        )}
                        {b.status === 'at_gate' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                            At Gate Verification
                          </span>
                        )}
                        {b.status === 'weighing' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-900 border border-purple-200">
                            On Weighbridge
                          </span>
                        )}
                        {b.status === 'completed' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ Procured & Paid
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectBookingForPass(b)}
                            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors"
                            title="View Gate Pass"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(b.id, 'at_gate')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] transition-colors"
                              title="Admit at gate"
                            >
                              Admit at Gate
                            </button>
                          )}

                          {b.status === 'at_gate' && (
                            <button
                              onClick={() => onOpenWeighbridge(b)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-[11px] transition-colors flex items-center gap-1"
                              title="Send to Weighbridge"
                            >
                              <Scale className="w-3 h-3" />
                              Weigh & Settle
                            </button>
                          )}

                          {b.status === 'weighing' && (
                            <button
                              onClick={() => onOpenWeighbridge(b)}
                              className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold text-[11px] transition-colors flex items-center gap-1"
                            >
                              <Scale className="w-3 h-3" />
                              Finish Weighing
                            </button>
                          )}

                          {b.status === 'completed' && (
                            <button
                              onClick={() => onOpenWeighbridge(b)}
                              className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-[11px] transition-colors"
                            >
                              View Slip
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
