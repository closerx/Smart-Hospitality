export type RoomStatus = 'vacant' | 'occupied' | 'awaiting_arrival' | 'cleaning' | 'maintenance';
export type RoomType = 'single' | 'double' | 'suite' | 'deluxe' | 'studio' | 'standard';

export interface GuestInfo {
  name: string;
  phone: string;
  email?: string;
  nationalId?: string;
  checkIn: string; // ISO date or YYYY-MM-DD
  checkOut: string; // ISO date or YYYY-MM-DD
  guestCount?: number;
  approved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  sentViaWhatsapp?: boolean;
  sentAt?: string;
  notes?: string;
}

export interface Room {
  id: string;
  propertyId: string;
  roomNumber: string; // e.g. "101", "جناح 102", "غرفة 1"
  floor: number | string;
  type: RoomType;
  pricePerNight?: number;
  status: RoomStatus;
  lockPasscode?: string;
  passcodeGeneratedAt?: string;
  passcodeExpiresAt?: string;
  smartLockBattery?: number; // 0 - 100
  smartLockStatus?: 'online' | 'offline' | 'unlocked' | 'locked';
  currentGuest?: GuestInfo | null;
  history?: Array<{
    id: string;
    guestName: string;
    guestPhone: string;
    checkIn: string;
    checkOut: string;
    passcode: string;
    completedAt: string;
  }>;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}
