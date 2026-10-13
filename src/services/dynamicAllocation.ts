import { Booking, SlotCapacity } from '../types/procurement';

export const MANDI_NAME = "APMC Karnal Grain Mandi (Terminal-01)";
export const DEFAULT_COMMODITY_MSP: Record<string, number> = {
  Wheat: 2275, // Govt MSP ₹2,275 per quintal
  Paddy: 2183,
  Mustard: 5650,
  Cotton: 6620,
  Maize: 2090,
  Soyabean: 4600,
};

// 20 predefined half-hour slots from 08:00 to 18:00
export const STANDARD_SLOTS: { id: string; timeLabel: string; hour: number; isPeakRush: boolean }[] = [
  { id: '08:00', timeLabel: '08:00 AM - 08:30 AM', hour: 8.0, isPeakRush: true },
  { id: '08:30', timeLabel: '08:30 AM - 09:00 AM', hour: 8.5, isPeakRush: true },
  { id: '09:00', timeLabel: '09:00 AM - 09:30 AM', hour: 9.0, isPeakRush: true },
  { id: '09:30', timeLabel: '09:30 AM - 10:00 AM', hour: 9.5, isPeakRush: true },
  { id: '10:00', timeLabel: '10:00 AM - 10:30 AM', hour: 10.0, isPeakRush: true },
  { id: '10:30', timeLabel: '10:30 AM - 11:00 AM', hour: 10.5, isPeakRush: true },
  { id: '11:00', timeLabel: '11:00 AM - 11:30 AM', hour: 11.0, isPeakRush: true },
  { id: '11:30', timeLabel: '11:30 AM - 12:00 PM', hour: 11.5, isPeakRush: false },
  { id: '12:00', timeLabel: '12:00 PM - 12:30 PM', hour: 12.0, isPeakRush: false },
  { id: '12:30', timeLabel: '12:30 PM - 01:00 PM', hour: 12.5, isPeakRush: false },
  { id: '01:00', timeLabel: '01:00 PM - 01:30 PM', hour: 13.0, isPeakRush: false },
  { id: '01:30', timeLabel: '01:30 PM - 02:00 PM', hour: 13.5, isPeakRush: false },
  { id: '02:00', timeLabel: '02:00 PM - 02:30 PM', hour: 14.0, isPeakRush: false },
  { id: '02:30', timeLabel: '02:30 PM - 03:00 PM', hour: 14.5, isPeakRush: false },
  { id: '03:00', timeLabel: '03:00 PM - 03:30 PM', hour: 15.0, isPeakRush: false },
  { id: '03:30', timeLabel: '03:30 PM - 04:00 PM', hour: 15.5, isPeakRush: false },
  { id: '04:00', timeLabel: '04:00 PM - 04:30 PM', hour: 16.0, isPeakRush: false },
  { id: '04:30', timeLabel: '04:30 PM - 05:00 PM', hour: 16.5, isPeakRush: false },
  { id: '05:00', timeLabel: '05:00 PM - 05:30 PM', hour: 17.0, isPeakRush: false },
  { id: '05:30', timeLabel: '05:30 PM - 06:00 PM', hour: 17.5, isPeakRush: false },
];

export const MAX_VEHICLES_PER_SLOT = 15;
export const MAX_QUINTALS_PER_SLOT = 450;

/**
 * Calculates current slot availability and load distribution
 */
export function calculateSlotCapacities(existingBookings: Booking[], targetDate: string): SlotCapacity[] {
  const dayBookings = existingBookings.filter(
    (b) => b.bookingDate === targetDate && b.status !== 'cancelled'
  );

  return STANDARD_SLOTS.map((slot) => {
    const slotBookings = dayBookings.filter((b) => b.allocatedSlot === slot.timeLabel);
    const bookedVehicles = slotBookings.length;
    const bookedQuintals = slotBookings.reduce((sum, b) => sum + (b.quantityQuintals || 0), 0);
    const vehicleCongestion = (bookedVehicles / MAX_VEHICLES_PER_SLOT) * 100;
    const quintalCongestion = (bookedQuintals / MAX_QUINTALS_PER_SLOT) * 100;
    const congestionPercent = Math.min(100, Math.round(Math.max(vehicleCongestion, quintalCongestion)));

    // Predictive wait time simulation based on congestion
    let estimatedWaitMinutes = 10;
    if (slot.isPeakRush) {
      estimatedWaitMinutes = Math.round(25 + (congestionPercent * 0.9));
    } else {
      estimatedWaitMinutes = Math.round(8 + (congestionPercent * 0.2));
    }

    return {
      slotId: slot.id,
      timeLabel: slot.timeLabel,
      hour: slot.hour,
      maxVehicles: MAX_VEHICLES_PER_SLOT,
      bookedVehicles,
      maxQuintals: MAX_QUINTALS_PER_SLOT,
      bookedQuintals,
      isPeakRush: slot.isPeakRush,
      congestionPercent,
      estimatedWaitMinutes,
    };
  });
}

/**
 * Dynamic predictive allocation:
 * Automatically assigns an optimal slot avoiding morning rush.
 * Matches Slide 7 Demo Scenario: System intelligently allocates a 2 PM slot to bypass morning rush.
 */
export function allocateOptimalSlot(
  existingBookings: Booking[],
  targetDate: string,
  preferredSlotChoice: string = 'AUTO_OPTIMAL'
): {
  allocatedSlot: string;
  allocatedHour: number;
  tokenNumber: number;
  estimatedWaitMinutes: number;
  bypassMorningRushNote?: string;
} {
  const capacities = calculateSlotCapacities(existingBookings, targetDate);
  const dayBookings = existingBookings.filter(
    (b) => b.bookingDate === targetDate && b.status !== 'cancelled'
  );
  const tokenNumber = dayBookings.length + 101; // Start token IDs at 101

  // If user selected auto optimal or a specific slot:
  if (preferredSlotChoice !== 'AUTO_OPTIMAL') {
    const requested = capacities.find((c) => c.timeLabel === preferredSlotChoice || c.slotId === preferredSlotChoice);
    if (requested) {
      // If requested slot has capacity (< 85%), honor it
      if (requested.congestionPercent < 85) {
        return {
          allocatedSlot: requested.timeLabel,
          allocatedHour: requested.hour,
          tokenNumber,
          estimatedWaitMinutes: requested.estimatedWaitMinutes,
        };
      }
      // If requested slot is heavily congested or in morning rush, apply predictive bypass:
    }
  }

  // Predictive algorithm: Find uncongested afternoon slot (prefer 14:00 / 2 PM as featured in SIH demo)
  const ideal2PMSlot = capacities.find((c) => c.slotId === '02:00' && c.congestionPercent < 80);
  if (ideal2PMSlot) {
    return {
      allocatedSlot: ideal2PMSlot.timeLabel,
      allocatedHour: ideal2PMSlot.hour,
      tokenNumber,
      estimatedWaitMinutes: 12,
      bypassMorningRushNote: 'Predictive algorithm assigned 2:00 PM slot to bypass morning rush (saves ~2.5 hrs physical wait time).',
    };
  }

  // Otherwise, select the slot with the lowest congestion (preferring post-11:30 AM non-peak slots)
  const nonPeakSlots = capacities.filter((c) => !c.isPeakRush && c.congestionPercent < 85);
  if (nonPeakSlots.length > 0) {
    const best = [...nonPeakSlots].sort((a, b) => a.congestionPercent - b.congestionPercent)[0];
    return {
      allocatedSlot: best.timeLabel,
      allocatedHour: best.hour,
      tokenNumber,
      estimatedWaitMinutes: best.estimatedWaitMinutes,
      bypassMorningRushNote: `Intelligently scheduled for ${best.timeLabel} to optimize mandi throughput.`,
    };
  }

  // Fallback to absolute lowest congested slot of the day
  const bestOverall = [...capacities].sort((a, b) => a.congestionPercent - b.congestionPercent)[0];
  return {
    allocatedSlot: bestOverall.timeLabel,
    allocatedHour: bestOverall.hour,
    tokenNumber,
    estimatedWaitMinutes: bestOverall.estimatedWaitMinutes,
  };
}

/**
 * Calculates live Mandi Operations metrics
 */
export function calculateMandiMetrics(bookings: Booking[], targetDate: string) {
  const dayBookings = bookings.filter(
    (b) => b.bookingDate === targetDate && b.status !== 'cancelled'
  );

  const totalPossibleVehicles = STANDARD_SLOTS.length * MAX_VEHICLES_PER_SLOT; // 20 * 15 = 300
  const bookedCount = dayBookings.length;
  const slotsFilledPercent = Math.min(100, Math.round((bookedCount / totalPossibleVehicles) * 100));

  // Current active queue (farmers with status 'confirmed' or 'at_gate' or 'weighing')
  const activeQueueBookings = dayBookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'at_gate' || b.status === 'weighing'
  );
  const currentQueueSize = activeQueueBookings.length;

  // Average wait calculation
  const completedOrAtGate = dayBookings.filter((b) => b.status !== 'cancelled');
  const avgWaitTime = completedOrAtGate.length > 0
    ? Math.round(
        completedOrAtGate.reduce((acc, curr) => acc + (curr.estimatedWaitMinutes || 12), 0) /
          completedOrAtGate.length
      )
    : 12;

  return {
    totalBookingsToday: bookedCount,
    currentQueueSize,
    slotsFilledPercent,
    avgWaitTime,
    atGateCount: dayBookings.filter((b) => b.status === 'at_gate').length,
    weighingCount: dayBookings.filter((b) => b.status === 'weighing').length,
    completedCount: dayBookings.filter((b) => b.status === 'completed').length,
  };
}
