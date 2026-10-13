import React from 'react';
import { X, Printer, FileText, Download, CheckCircle, Wheat, Sparkles, ShieldCheck } from 'lucide-react';

interface ProjectReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectReportModal: React.FC<ProjectReportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-amber-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/60 flex items-center justify-center border border-emerald-500/30">
              <FileText className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg font-serif">
                AgriSync — Official Project Report
              </h3>
              <p className="text-[11px] text-emerald-200">
                Smart India Hackathon 2026 • Smart Agriculture Domain
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-stone-800 text-sm leading-relaxed font-sans">
          {/* Title banner */}
          <div className="border-b border-stone-200 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Technical Documentation & Architecture Report
              </span>
              <span className="text-xs text-stone-500 font-mono">Date: October 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-950 mt-2">
              AgriSync: Cloud-Based Farmer Procurement & Digital Queue Platform
            </h1>
            <p className="text-emerald-800 italic font-medium mt-1">
              "Valuing the farmer's time, protecting the farmer's yield."
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-stone-500">
              <span><strong>Team:</strong> AgriDev</span>
              <span><strong>Institution:</strong> National Institute of Technology</span>
              <span><strong>Deployment:</strong> Google Cloud Run & Firebase Cloud Firestore</span>
            </div>
          </div>

          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-bold text-emerald-950 border-b border-stone-100 pb-1 mb-2 font-serif">
              1. Executive Summary & Problem Definition
            </h2>
            <p>
              In agricultural procurement centers across India (APMC Mandis, FCI depots, and Sugar Mills), manual intake workflows create severe systemic bottlenecks. Farmers face 24 to 48 hours of physical road congestion, resulting in rapid crop desiccation, post-harvest spoilage, and arbitrary token allocation prone to favoritism. Mandi administrators operate without real-time visibility into arriving truck densities or daily processing capacities.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900 block text-xs">Chain of Pain Identified</span>
                <ul className="list-disc list-inside text-xs text-stone-600 mt-1 space-y-0.5">
                  <li><strong>Physical Congestion:</strong> Miles-long queues idling outside gates.</li>
                  <li><strong>Asset Degradation:</strong> Wheat & produce spoilage from exposure.</li>
                  <li><strong>Systemic Inequity:</strong> Non-transparent manual paper slips.</li>
                  <li><strong>Administrative Blindness:</strong> Zero predictive load visibility.</li>
                </ul>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-900 block text-xs">AgriSync Solution</span>
                <ul className="list-disc list-inside text-xs text-emerald-800 mt-1 space-y-0.5">
                  <li><strong>Wait Time Reduction:</strong> 48 hours slashed to ~12–15 minutes.</li>
                  <li><strong>Predictive Scheduling:</strong> Balances arrivals against scale rate.</li>
                  <li><strong>Instant Digital QR Pass:</strong> Touchless gate admission.</li>
                  <li><strong>Immutable Records:</strong> Direct weighbridge & MSP settlement.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-bold text-emerald-950 border-b border-stone-100 pb-1 mb-2 font-serif">
              2. System Architecture: Three-Tiered Data Ecosystem
            </h2>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg border border-stone-200">
                <span className="font-bold text-stone-900">Tier 1: Edge & Omnichannel Frontend</span>
                <p className="text-stone-600 mt-0.5">
                  Mobile-responsive Web Application (React 19 + Tailwind CSS) and an Offline-First SMS Gateway allowing farmers without smartphones or active internet to book slots via standard GSM SMS.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-stone-200">
                <span className="font-bold text-stone-900">Tier 2: Cloud Backend & Predictive Scheduling Engine</span>
                <p className="text-stone-600 mt-0.5">
                  Cloud Firestore dynamic load balancer that calculates mandi capacity (15 vehicles / 450 quintals per 30-min window). It prevents morning congestion (08:30–11:00 AM) by automatically allocating the 02:00 PM slot.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-stone-200">
                <span className="font-bold text-stone-900">Tier 3: Physical-to-Digital Bridge</span>
                <p className="text-stone-600 mt-0.5">
                  Gate QR scanner integration with automatic barrier clearance, IoT-linked electronic weighbridges for gross and tare tare recording, automated moisture deductions (standard ≤12%), and PFMS/DBT digital payment orders.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-bold text-emerald-950 border-b border-stone-100 pb-1 mb-2 font-serif">
              3. Implemented Modules & Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <h3 className="font-bold text-stone-900 mb-1">Farmer Procurement Portal</h3>
                <p className="text-stone-600">
                  Enables rapid booking for Wheat (Govt MSP ₹2,275/qtl), Mustard, Paddy, and other crops. Features automatic MSP payout projections, vehicle specification, and date selection.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-stone-900 mb-1">Digital Gate Entry Pass</h3>
                <p className="text-stone-600">
                  Renders the official smartphone pass with scannable QR code, mock Farmer ID (e.g. 12345), confirmed slot (2 PM), commodity name, and green verified security badge.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-stone-900 mb-1">Admin Monitoring Dashboard</h3>
                <p className="text-stone-600">
                  Features a 7-day "Daily Arrivals" bar chart, live queue count with SVG trend graph, "Slots Filled" progress bar (85%), and "Avg. Wait: 12 min" metric badge.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-stone-900 mb-1">Interactive Gate & Scale Simulators</h3>
                <p className="text-stone-600">
                  Provides a live QR camera/code scanner for gate operators and a digital weighbridge simulator that computes net produce weight and prints official APMC receipts.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-bold text-emerald-950 border-b border-stone-100 pb-1 mb-2 font-serif">
              4. Database & Security Implementation
            </h2>
            <p className="text-xs text-stone-600">
              The project utilizes Google Cloud Firestore with real-time listeners (<code>onSnapshot</code>) and strict Attribute-Based Access Control (ABAC) in <code>firestore.rules</code>:
            </p>
            <div className="bg-stone-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto mt-2">
              <code>{`// Cloud Firestore Security Rules Configuration
match /bookings/{bookingId} {
  allow read: if true;
  allow create: if isValidBooking(request.resource.data);
  allow update: if isValidBooking(request.resource.data)
    && request.resource.data.id == resource.data.id;
}`}</code>
            </div>
          </section>

          {/* Visual Figures Section matching User's Report */}
          <section className="space-y-6 pt-4 border-t border-stone-200">
            <h2 className="text-xl font-bold text-emerald-950 font-serif border-b border-stone-200 pb-2">
              5. Visual System Walkthrough (Figures 5.1 – 5.6)
            </h2>

            {/* Figure 5.1 */}
            <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-3">
              <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-stone-900 text-sm">AgriSync Farmer Procurement Portal</span>
                  </div>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                    APMC Karnal Node
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                    <span className="text-stone-500 block text-[10px]">Farmer Profile</span>
                    <span className="font-bold text-stone-900">Balwant Singh</span>
                    <span className="text-stone-400 block text-[10px] font-mono">ID: 12345 • +91 98765 43210</span>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200">
                    <span className="text-amber-800 block text-[10px] font-semibold">Commodity & Quantity</span>
                    <span className="font-bold text-stone-900 flex items-center gap-1">
                      🌾 Wheat • 45 Quintals
                    </span>
                    <span className="text-amber-700 block text-[10px] font-mono">MSP: ₹2,275/qtl (Govt Rate)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                    <span className="text-emerald-800 block text-[10px] font-semibold">Projected Valuation</span>
                    <span className="font-bold text-emerald-900 text-base">₹1,02,375</span>
                    <span className="text-emerald-700 block text-[10px]">Vehicle: HR-05-AR-2291 (Tractor)</span>
                  </div>
                </div>
              </div>
              <div className="text-center text-xs font-semibold text-stone-600 italic">
                <strong>Figure 5.1:</strong> Farmer booking portal with commodity selection and MSP projection
              </div>
            </div>

            {/* Figure 5.2 */}
            <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-3">
              <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm space-y-3">
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-white to-amber-50 border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-400 text-stone-900 uppercase">
                      Predictive Load Balancer
                    </span>
                    <h4 className="font-bold text-stone-900 text-sm mt-1">
                      Allocated Window: 02:00 PM – 02:30 PM (Bypass Morning Congestion)
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Morning peak (08:30–11:00 AM) exceeded 80% capacity threshold. Automated scheduling moved request to 02:00 PM.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-stone-400 block uppercase">Est. Physical Wait</span>
                    <span className="text-xl font-extrabold text-emerald-800 font-mono">12 Minutes</span>
                    <span className="text-[10px] text-red-500 line-through block">vs 180 min morning peak</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-center">
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800">
                    <span className="block font-bold">Morning Peak (09:00 AM)</span>
                    <span>180 Min Queue • 95% Congestion [BYPASSED]</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                    <span className="block font-bold">Assigned Afternoon Slot (02:00 PM)</span>
                    <span>12 Min Turnaround • 40% Congestion [CONFIRMED]</span>
                  </div>
                </div>
              </div>
              <div className="text-center text-xs font-semibold text-stone-600 italic">
                <strong>Figure 5.2:</strong> Slot confirmation and allocation to the afternoon window (shifting arrival away from morning congestion)
              </div>
            </div>

            {/* Figure 5.3 */}
            <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-3">
              <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-center gap-6">
                {/* Smartphone Pass Simulation */}
                <div className="w-64 bg-stone-900 rounded-[32px] p-3 shadow-xl border-2 border-stone-700 text-center">
                  <div className="bg-white rounded-[24px] p-4 text-stone-900 text-xs space-y-2">
                    <div className="font-bold text-sm font-serif">Gate Entry Pass</div>
                    <div className="text-[10px] text-stone-500">APMC Karnal Grain Mandi</div>
                    <div className="w-28 h-28 mx-auto bg-stone-100 rounded-lg border-2 border-stone-300 flex items-center justify-center p-1">
                      {/* Stylized QR placeholder */}
                      <div className="w-full h-full bg-emerald-950 rounded p-1.5 flex flex-wrap gap-1 items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white bg-emerald-900"></div>
                        <div className="w-6 h-6 border-2 border-white bg-emerald-900"></div>
                        <div className="w-12 h-6 bg-white/20"></div>
                        <div className="w-6 h-6 border-2 border-white bg-emerald-900"></div>
                        <div className="w-6 h-6 bg-white/40"></div>
                      </div>
                    </div>
                    <div className="bg-stone-50 p-2 rounded text-left text-[11px] space-y-1 font-mono">
                      <div>Farmer ID: <strong>12345</strong></div>
                      <div>Slot: <strong className="text-emerald-700">2 PM (14:00 - 14:30)</strong></div>
                      <div>Commodity: <strong className="text-amber-800">Wheat (45 qtl)</strong></div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-sm font-bold">
                      ✓
                    </div>
                  </div>
                </div>

                {/* Printable Thermal Slip */}
                <div className="w-64 bg-stone-50 rounded-xl p-4 border border-dashed border-stone-300 font-mono text-[11px] space-y-1.5 shadow-xs">
                  <div className="text-center font-bold border-b border-stone-200 pb-1 font-sans">
                    APMC THERMAL TOKEN PASS
                  </div>
                  <div>PASS REF: <strong>BOOK-12345</strong></div>
                  <div>FARMER: <strong>BALWANT SINGH</strong></div>
                  <div>KISAN ID: <strong>12345</strong></div>
                  <div>TIME SLOT: <strong>02:00 PM - 02:30 PM</strong></div>
                  <div>COMMODITY: <strong>WHEAT</strong></div>
                  <div>EST. WAIT: <strong>12 MINUTES</strong></div>
                  <div className="border-t border-stone-200 pt-1 text-center text-[10px] text-stone-500 font-sans">
                    SCAN AT GATE TERMINAL-01
                  </div>
                </div>
              </div>
              <div className="text-center text-xs font-semibold text-stone-600 italic">
                <strong>Figure 5.3:</strong> Digital gate pass (smartphone view and printable thermal view)
              </div>
            </div>

            {/* Figure 5.4 */}
            <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-3">
              <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm max-w-md mx-auto">
                <div className="bg-stone-900 text-stone-200 px-3 py-2 rounded-t-xl text-[11px] font-mono flex justify-between">
                  <span>GSM SMS GATEWAY (TOLL-FREE)</span>
                  <span className="text-emerald-400">ONLINE</span>
                </div>
                <div className="p-4 bg-stone-100 rounded-b-xl space-y-3 text-xs">
                  {/* SMS 1 */}
                  <div className="flex flex-col items-end">
                    <div className="bg-emerald-700 text-white p-2.5 rounded-xl rounded-tr-xs max-w-[85%] font-medium">
                      Book slot for wheat
                    </div>
                    <span className="text-[9px] text-stone-400 mt-0.5">Farmer • 09:15 AM</span>
                  </div>
                  {/* SMS 2 */}
                  <div className="flex flex-col items-start">
                    <div className="bg-white border border-stone-200 text-stone-900 p-2.5 rounded-xl rounded-tl-xs max-w-[85%] leading-relaxed font-medium">
                      Confirmed. Slot: 2 PM (02:00 PM - 02:30 PM). Ref: 12345. Avoids morning rush. Gate turnaround: ~15 mins. Show SMS or QR at gate.
                    </div>
                    <span className="text-[9px] text-stone-400 mt-0.5">AgriSync System • 09:15 AM</span>
                  </div>
                </div>
              </div>
              <div className="text-center text-xs font-semibold text-stone-600 italic">
                <strong>Figure 5.4:</strong> Offline SMS booking simulator for non-smartphone users
              </div>
            </div>

            {/* Figure 5.5 */}
            <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-3">
              <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                  <span className="font-bold text-sm text-stone-900">APMC Mandi Administrator Live Monitoring</span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                    Terminal-01 Real-Time
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                    <span className="text-stone-500 text-[10px] block">Daily Arrivals (Weekly)</span>
                    <span className="font-bold text-stone-900 text-sm">615 Trucks / 2,815 T</span>
                    <span className="text-emerald-700 text-[10px] block mt-0.5">Mon–Sun Monitored</span>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-emerald-800 text-[10px] block font-semibold">Live Queue Status</span>
                    <span className="font-extrabold text-emerald-950 text-xl font-mono">15 Trucks</span>
                    <span className="text-emerald-700 text-[10px] block">Wait Trend: Flattened</span>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <span className="text-amber-800 text-[10px] block font-semibold">Mandi Operations</span>
                    <div className="flex justify-between items-center font-bold text-stone-900 text-sm">
                      <span>Slots: 85%</span>
                      <span className="text-emerald-800">Avg Wait: 12m</span>
                    </div>
                    <div className="w-full h-2 bg-stone-200 rounded-full mt-1.5 overflow-hidden">
                      <div className="w-[85%] h-full bg-amber-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center text-xs font-semibold text-stone-600 italic">
                <strong>Figure 5.5:</strong> Mandi administrator live dashboard with arrivals chart and live queue metrics
              </div>
            </div>

            {/* Figure 5.6 */}
            <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-3">
              <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm max-w-lg mx-auto space-y-3 font-mono text-xs">
                <div className="bg-stone-900 text-white p-3 rounded-lg flex justify-between items-center font-sans">
                  <span className="font-bold text-xs">Digital Weighbridge Terminal</span>
                  <span className="text-amber-400 text-[11px]">IoT Calibrated</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-stone-800">
                  <div className="p-2 rounded bg-stone-50 border border-stone-200">Gross Weight: <strong>67.0 qtl</strong></div>
                  <div className="p-2 rounded bg-stone-50 border border-stone-200">Tare Weight: <strong>22.0 qtl</strong></div>
                  <div className="p-2 rounded bg-stone-50 border border-stone-200">Moisture: <strong>11.5% (Passed)</strong></div>
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold">
                    Net Produce: <strong>45.0 Quintals</strong>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 font-sans flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-amber-800 block">Govt MSP Rate (₹2,275/qtl)</span>
                    <span className="font-extrabold text-base text-stone-900">Total Payout: ₹1,02,375</span>
                  </div>
                  <span className="text-[11px] font-bold bg-emerald-600 text-white px-2 py-1 rounded">
                    PFMS / DBT Sent
                  </span>
                </div>
              </div>
              <div className="text-center text-xs font-semibold text-stone-600 italic">
                <strong>Figure 5.6:</strong> Weighbridge, moisture test and digital payment slip
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3.5 border-t border-stone-200 flex justify-between items-center text-xs text-stone-500 shrink-0">
          <span>AgriSync Platform • Smart India Hackathon 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg text-xs cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
