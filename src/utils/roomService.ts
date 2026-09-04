import { Room, RoomStatus } from '../types/room';
import { Property } from '../types/property';
import { supabase } from '../lib/supabase';

// Helper to generate secure random 6-digit numerical pin
export function generateRoomPasscode(digits = 6): string {
  let code = '';
  for (let i = 0; i < digits; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

// Storage key helper
function getStorageKey(propertyId: string): string {
  return `smart_rooms_${propertyId}`;
}

// Default room generator if property has no rooms yet
export function generateInitialRoomsForProperty(property: Property): Room[] {
  const count = Math.max(1, Number(property.roomsCount) || 10);
  const floors = Math.max(1, Number(property.floorsCount) || 1);
  const roomsPerFloor = Math.ceil(count / floors);
  const rooms: Room[] = [];

  for (let i = 1; i <= count; i++) {
    const floorIndex = Math.min(floors, Math.floor((i - 1) / roomsPerFloor) + 1);
    const roomInFloor = ((i - 1) % roomsPerFloor) + 1;
    // Formatting: e.g. Floor 1: 101, 102... Floor 2: 201, 202...
    const roomNumStr = floors > 1 
      ? `${floorIndex}${roomInFloor < 10 ? '0' + roomInFloor : roomInFloor}`
      : `${i}`;

    rooms.push({
      id: `room_${property.id}_${i}_${Date.now().toString(36)}`,
      propertyId: property.id,
      roomNumber: roomNumStr,
      floor: floorIndex,
      type: i === 1 ? 'suite' : 'standard',
      status: 'vacant',
      smartLockBattery: Math.floor(80 + Math.random() * 20),
      smartLockStatus: 'online',
      createdAt: new Date().toISOString(),
    });
  }

  return rooms;
}

// Load rooms for a property
export async function getPropertyRooms(property: Property): Promise<Room[]> {
  const key = getStorageKey(property.id);
  
  // 1. Check local storage cache
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed: Room[] = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read cached rooms from localStorage', e);
  }

  // 2. Try fetching from Supabase table `property_rooms` if exists
  try {
    const { data, error } = await supabase
      .from('property_rooms')
      .select('*')
      .eq('property_id', property.id);

    if (!error && data && data.length > 0) {
      const dbRooms: Room[] = data.map((r: any) => ({
        id: r.id,
        propertyId: r.property_id || property.id,
        roomNumber: r.room_number || r.roomNumber,
        floor: r.floor || 1,
        type: r.type || 'standard',
        pricePerNight: r.price_per_night,
        status: r.status || 'vacant',
        lockPasscode: r.lock_passcode || r.lockPasscode,
        passcodeGeneratedAt: r.passcode_generated_at || r.passcodeGeneratedAt,
        passcodeExpiresAt: r.passcode_expires_at || r.passcodeExpiresAt,
        smartLockBattery: r.smart_lock_battery ?? 95,
        smartLockStatus: r.smart_lock_status || 'online',
        currentGuest: r.current_guest ? (typeof r.current_guest === 'string' ? JSON.parse(r.current_guest) : r.current_guest) : null,
        history: r.history ? (typeof r.history === 'string' ? JSON.parse(r.history) : r.history) : [],
        notes: r.notes,
        createdAt: r.created_at || new Date().toISOString(),
        updatedAt: r.updated_at,
      }));

      // Cache locally
      localStorage.setItem(key, JSON.stringify(dbRooms));
      return dbRooms;
    }
  } catch (e) {
    console.warn('Notice loading rooms from Supabase (using client store):', e);
  }

  // 3. If no rooms exist yet, auto-provision initial rooms for this property
  const initialRooms = generateInitialRoomsForProperty(property);
  savePropertyRooms(property.id, initialRooms);
  return initialRooms;
}

// Save rooms for a property
export async function savePropertyRooms(propertyId: string, rooms: Room[]): Promise<boolean> {
  const key = getStorageKey(propertyId);
  try {
    localStorage.setItem(key, JSON.stringify(rooms));
  } catch (e) {
    console.warn('Failed to save rooms to localStorage', e);
  }

  // Try background syncing to Supabase if table exists
  try {
    // Attempt upsert or store in metadata
    const payload = rooms.map(r => ({
      id: r.id,
      property_id: propertyId,
      room_number: r.roomNumber,
      floor: Number(r.floor) || 1,
      type: r.type,
      status: r.status,
      lock_passcode: r.lockPasscode,
      passcode_generated_at: r.passcodeGeneratedAt,
      passcode_expires_at: r.passcodeExpiresAt,
      current_guest: r.currentGuest ? JSON.stringify(r.currentGuest) : null,
      updated_at: new Date().toISOString()
    }));

    await supabase.from('property_rooms').upsert(payload, { onConflict: 'id' });
  } catch (e) {
    // Silent failover to localStorage
  }

  return true;
}

// Build standard WhatsApp Message Template
export function buildGuestApprovalWhatsAppMessage(
  guestName: string,
  propertyName: string,
  city: string,
  roomNumber: string,
  passcode: string,
  checkIn: string,
  checkOut: string,
  contactPhone?: string
): string {
  return `مرحباً بك أستاذ/ة ${guestName || 'النزيل العزيز'} في ${propertyName}! 🏨✨

نود إبلاغك بأنه تم تأكيد حجزك وسماح استخدام الغرفة بنجاح. تفاصيل إقامتك والدخول الذكي:

📍 العقار: ${propertyName} - ${city}
🚪 رقم الغرفة: ${roomNumber}
🔐 رمز القفل الذكي: *${passcode}*
📅 تاريخ الدخول: ${checkIn || 'اليوم'}
📅 تاريخ المغادرة: ${checkOut || 'حسب الحجز'}

💡 طريقة فتح الباب:
1. المس شاشة القفل الذكي لتشغيلها
2. أدخل الرمز: ${passcode} متبوعاً بزر (#)
3. يفتح الباب تلقائياً فوراً

${contactPhone ? `📞 للاستفسارات والدعم: ${contactPhone}` : ''}

نتمنى لك إقامة مريحة وهانئة! ✨`;
}
