import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Booking, MandiDayArrival, QueueTrendPoint } from '../types/procurement';

const BOOKINGS_COLLECTION = 'bookings';

// Initial realistic SIH seed data matching Slide 7 & mandi requirements
export const SEED_BOOKINGS: Booking[] = [
  {
    id: 'BOOK-12345',
    farmerId: '12345',
    farmerName: 'Balwant Singh',
    phone: '+91 98765 43210',
    commodity: 'Wheat',
    quantityQuintals: 45,
    vehicleNumber: 'HR-05-AR-2291',
    vehicleType: 'Tractor Trolley',
    bookingDate: new Date().toISOString().split('T')[0],
    allocatedSlot: '02:00 PM - 02:30 PM',
    allocatedHour: 14.0,
    mandiName: 'APMC Karnal Grain Mandi (Terminal-01)',
    channel: 'sms_gateway',
    status: 'confirmed',
    tokenNumber: 101,
    estimatedWaitMinutes: 12,
    qrPayload: JSON.stringify({
      id: 'BOOK-12345',
      farmerId: '12345',
      commodity: 'Wheat',
      slot: '02:00 PM - 02:30 PM',
      qty: 45,
      mandi: 'APMC Karnal',
    }),
    bypassMorningRushNote: 'System intelligently allocated a 2 PM slot to bypass the morning rush.',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'BOOK-102',
    farmerId: 'FARM-88219',
    farmerName: 'Gurpreet Kaur',
    phone: '+91 94161 88210',
    commodity: 'Wheat',
    quantityQuintals: 80,
    vehicleNumber: 'PB-10-BK-7704',
    vehicleType: 'Mini Truck (Pick-up)',
    bookingDate: new Date().toISOString().split('T')[0],
    allocatedSlot: '08:30 AM - 09:00 AM',
    allocatedHour: 8.5,
    mandiName: 'APMC Karnal Grain Mandi (Terminal-01)',
    channel: 'web_portal',
    status: 'weighing',
    tokenNumber: 98,
    estimatedWaitMinutes: 14,
    qrPayload: JSON.stringify({
      id: 'BOOK-102',
      farmerId: 'FARM-88219',
      commodity: 'Wheat',
      slot: '08:30 AM - 09:00 AM',
      qty: 80,
    }),
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    moisturePercent: 11.8,
    netWeightQuintals: 79.2,
    mspRatePerQuintal: 2275,
    totalPmtAmount: 180180,
  },
  {
    id: 'BOOK-103',
    farmerId: 'FARM-99402',
    farmerName: 'Rameshwar Lal',
    phone: '+91 98120 44921',
    commodity: 'Wheat',
    quantityQuintals: 110,
    vehicleNumber: 'HR-02-C-5099',
    vehicleType: 'Tractor Trolley',
    bookingDate: new Date().toISOString().split('T')[0],
    allocatedSlot: '09:00 AM - 09:30 AM',
    allocatedHour: 9.0,
    mandiName: 'APMC Karnal Grain Mandi (Terminal-01)',
    channel: 'web_portal',
    status: 'at_gate',
    tokenNumber: 99,
    estimatedWaitMinutes: 15,
    qrPayload: JSON.stringify({
      id: 'BOOK-103',
      farmerId: 'FARM-99402',
      commodity: 'Wheat',
      slot: '09:00 AM - 09:30 AM',
      qty: 110,
    }),
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'BOOK-104',
    farmerId: 'FARM-33104',
    farmerName: 'Satnam Singh',
    phone: '+91 94670 12099',
    commodity: 'Wheat',
    quantityQuintals: 65,
    vehicleNumber: 'PB-11-R-3401',
    vehicleType: 'Tractor Trolley',
    bookingDate: new Date().toISOString().split('T')[0],
    allocatedSlot: '10:00 AM - 10:30 AM',
    allocatedHour: 10.0,
    mandiName: 'APMC Karnal Grain Mandi (Terminal-01)',
    channel: 'sms_gateway',
    status: 'completed',
    tokenNumber: 95,
    estimatedWaitMinutes: 10,
    qrPayload: JSON.stringify({
      id: 'BOOK-104',
      farmerId: 'FARM-33104',
      commodity: 'Wheat',
      slot: '10:00 AM - 10:30 AM',
      qty: 65,
    }),
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    moisturePercent: 12.0,
    netWeightQuintals: 64.8,
    mspRatePerQuintal: 2275,
    totalPmtAmount: 147420,
  },
  {
    id: 'BOOK-105',
    farmerId: 'FARM-55012',
    farmerName: 'Dharampal Yadav',
    phone: '+91 97280 99401',
    commodity: 'Mustard',
    quantityQuintals: 35,
    vehicleNumber: 'HR-36-P-8812',
    vehicleType: 'Mini Truck (Pick-up)',
    bookingDate: new Date().toISOString().split('T')[0],
    allocatedSlot: '11:00 AM - 11:30 AM',
    allocatedHour: 11.0,
    mandiName: 'APMC Karnal Grain Mandi (Terminal-01)',
    channel: 'walk_in',
    status: 'completed',
    tokenNumber: 96,
    estimatedWaitMinutes: 12,
    qrPayload: JSON.stringify({
      id: 'BOOK-105',
      farmerId: 'FARM-55012',
      commodity: 'Mustard',
      slot: '11:00 AM - 11:30 AM',
      qty: 35,
    }),
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    moisturePercent: 8.5,
    netWeightQuintals: 35.0,
    mspRatePerQuintal: 5650,
    totalPmtAmount: 197750,
  },
];

// Historical 7-day arrivals data for "Daily Arrivals" bar chart (Slide 7)
export const DEFAULT_DAILY_ARRIVALS: MandiDayArrival[] = [
  { day: 'Mon', date: 'Oct 06', arrivals: 120, wheatTonnes: 540, otherTonnes: 90, avgWaitMins: 14 },
  { day: 'Tue', date: 'Oct 07', arrivals: 100, wheatTonnes: 460, otherTonnes: 80, avgWaitMins: 13 },
  { day: 'Wed', date: 'Oct 08', arrivals: 75, wheatTonnes: 340, otherTonnes: 60, avgWaitMins: 11 },
  { day: 'Thu', date: 'Oct 09', arrivals: 90, wheatTonnes: 410, otherTonnes: 70, avgWaitMins: 12 },
  { day: 'Fri', date: 'Oct 10', arrivals: 110, wheatTonnes: 490, otherTonnes: 95, avgWaitMins: 15 },
  { day: 'Sat', date: 'Oct 11', arrivals: 85, wheatTonnes: 380, otherTonnes: 65, avgWaitMins: 12 },
  { day: 'Sun', date: 'Oct 12', arrivals: 35, wheatTonnes: 160, otherTonnes: 30, avgWaitMins: 9 },
];

// Queue Trend Graph Data (Live Queue Status)
export const DEFAULT_QUEUE_TREND: QueueTrendPoint[] = [
  { timeLabel: '08:00 AM', queueSize: 18, avgWaitMinutes: 16, processedCount: 12 },
  { timeLabel: '10:00 AM', queueSize: 24, avgWaitMinutes: 18, processedCount: 38 },
  { timeLabel: '12:00 PM', queueSize: 19, avgWaitMinutes: 15, processedCount: 65 },
  { timeLabel: '02:00 PM', queueSize: 15, avgWaitMinutes: 12, processedCount: 92 },
  { timeLabel: '04:00 PM', queueSize: 11, avgWaitMinutes: 10, processedCount: 118 },
  { timeLabel: '06:00 PM', queueSize: 6, avgWaitMinutes: 8, processedCount: 135 },
];

/**
 * Seed initial Firestore bookings if empty
 */
export async function seedInitialBookingsIfEmpty(): Promise<void> {
  try {
    const colRef = collection(db, BOOKINGS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      console.log('Seeding initial demonstration bookings to Firestore...');
      for (const item of SEED_BOOKINGS) {
        await setDoc(doc(db, BOOKINGS_COLLECTION, item.id), item);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BOOKINGS_COLLECTION);
  }
}

/**
 * Subscribe to real-time bookings
 */
export function subscribeToBookings(
  onUpdate: (bookings: Booking[]) => void,
  onError?: (err: unknown) => void
) {
  const colRef = collection(db, BOOKINGS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Booking[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Booking);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, BOOKINGS_COLLECTION);
      if (onError) onError(error);
    }
  );
}

/**
 * Save a new booking
 */
export async function saveBooking(booking: Booking): Promise<void> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, booking.id);
    await setDoc(docRef, booking);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${BOOKINGS_COLLECTION}/${booking.id}`);
    throw error;
  }
}

/**
 * Update an existing booking status
 */
export async function updateBookingStatus(
  bookingId: string,
  newStatus: Booking['status'],
  additionalFields?: Partial<Booking>
): Promise<void> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      ...(additionalFields || {}),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${BOOKINGS_COLLECTION}/${bookingId}`);
    throw error;
  }
}
