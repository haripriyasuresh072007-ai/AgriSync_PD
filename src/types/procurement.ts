export interface SlotCapacity {
  slotId: string;
  timeLabel: string;
  hour: number;
  maxVehicles: number;
  bookedVehicles: number;
  maxQuintals: number;
  bookedQuintals: number;
  isPeakRush: boolean;
  congestionPercent: number;
  estimatedWaitMinutes: number;
}

export interface Booking {
  id: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  commodity: 'Wheat' | 'Paddy' | 'Mustard' | 'Cotton' | 'Maize' | 'Soyabean';
  quantityQuintals: number;
  vehicleNumber: string;
  vehicleType: 'Tractor Trolley' | 'Mini Truck (Pick-up)' | 'Bullock Cart' | 'Heavy Multi-axle Truck';
  bookingDate: string; // YYYY-MM-DD
  allocatedSlot: string; // e.g. "02:00 PM - 02:30 PM"
  allocatedHour: number;
  mandiName: string;
  channel: 'web_portal' | 'sms_gateway' | 'walk_in';
  status: 'confirmed' | 'at_gate' | 'weighing' | 'completed' | 'cancelled';
  tokenNumber: number;
  estimatedWaitMinutes: number;
  qrPayload: string;
  bypassMorningRushNote?: string;
  createdAt: string;
  updatedAt: string;
  moisturePercent?: number;
  netWeightQuintals?: number;
  mspRatePerQuintal?: number;
  totalPmtAmount?: number;
}

export interface MandiDayArrival {
  day: string; // Mon, Tue, etc.
  date: string;
  arrivals: number; // vehicles
  wheatTonnes: number;
  otherTonnes: number;
  avgWaitMins: number;
}

export interface QueueTrendPoint {
  timeLabel: string;
  queueSize: number;
  avgWaitMinutes: number;
  processedCount: number;
}
