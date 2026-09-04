import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  MapPin,
  KeyRound,
  CheckCircle2,
  Clock,
  Send,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Phone,
  User,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  LogOut,
  Layers,
  BatteryCharging,
  SlidersHorizontal,
  Search,
  Filter,
  MessageSquare,
  Share2,
  Printer,
  ChevronDown,
  Lock,
  Unlock,
  Eye,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Property } from '../types/property';
import { Room, RoomStatus, RoomType, GuestInfo } from '../types/room';
import {
  getPropertyRooms,
  savePropertyRooms,
  generateRoomPasscode,
  buildGuestApprovalWhatsAppMessage
} from '../utils/roomService';
import { useAuth } from '../context/AuthContext';

export default function PropertyRoomsManagement() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { currentUser, role, isAdmin } = useAuth();
  const isRtl = i18n.language === 'ar';

  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filters & Search
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'roomNumber' | 'status' | 'guest'>('roomNumber');

  // Interactive Modals
  const [approvalModalRoom, setApprovalModalRoom] = useState<Room | null>(null);
  const [guestForm, setGuestForm] = useState<{
    name: string;
    phone: string;
    checkIn: string;
    checkOut: string;
    notes: string;
  }>({
    name: '',
    phone: '',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    notes: ''
  });

  const [editRoomModal, setEditRoomModal] = useState<Room | null>(null);
  const [editRoomForm, setEditRoomForm] = useState<{
    roomNumber: string;
    floor: number | string;
    type: RoomType;
    pricePerNight: number | '';
    notes: string;
  }>({
    roomNumber: '',
    floor: 1,
    type: 'standard',
    pricePerNight: '',
    notes: ''
  });

  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState<{
    roomNumber: string;
    floor: number;
    type: RoomType;
  }>({
    roomNumber: '',
    floor: 1,
    type: 'standard'
  });

  const [copiedPasscodeId, setCopiedPasscodeId] = useState<string | null>(null);
  const [copiedMessageRoomId, setCopiedMessageRoomId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Load Property Details & Rooms
  useEffect(() => {
    async function loadData() {
      if (!propertyId) return;
      setLoading(true);

      try {
        // 1. Fetch Property from Supabase
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .maybeSingle();

        let propData: Property | null = null;
        if (data && !error) {
          propData = {
            id: data.id,
            ownerId: data.ownerId || data.owner_id,
            name: data.name || data.title || data.property_name || 'العقار',
            type: data.type || 'hotel',
            leaseType: data.leaseType || data.lease_type,
            contractDuration: data.contractDuration || data.contract_duration,
            city: data.city || 'الرياض',
            district: data.district || '',
            address: data.address || '',
            roomsCount: data.roomsCount || data.rooms_count || 10,
            floorsCount: data.floorsCount || data.floors_count || 1,
            smartLocksEnabled: data.smartLocksEnabled ?? true,
            contactPhone: data.contactPhone || data.contact_phone,
            description: data.description,
            coverImage: data.coverImage || data.cover_image,
            status: data.status || 'active',
            occupancyRate: data.occupancyRate ?? data.occupancy_rate ?? 0,
            createdAt: data.createdAt || data.created_at,
          };
        } else {
          // Fallback property mock if not found in db
          propData = {
            id: propertyId,
            ownerId: 'owner_1',
            name: isRtl ? 'عقار وفندق النخيل الذكي' : 'Smart Palm Residences',
            type: 'apartments',
            city: isRtl ? 'الرياض' : 'Riyadh',
            district: isRtl ? 'حي الصحافة' : 'Al Sahafa',
            address: isRtl ? 'طريق الملك فهد' : 'King Fahd Road',
            roomsCount: 10,
            floorsCount: 2,
            smartLocksEnabled: true,
            contactPhone: '0501234567',
            status: 'active',
            occupancyRate: 60,
            createdAt: new Date().toISOString(),
          };
        }

        setProperty(propData);

        // 2. Load Rooms for this property
        const loadedRooms = await getPropertyRooms(propData);
        setRooms(loadedRooms);
      } catch (err) {
        console.error('Error loading property rooms data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [propertyId, isRtl]);

  // Save room state updates
  const updateRoomsState = async (newRooms: Room[]) => {
    setRooms(newRooms);
    if (propertyId) {
      setIsSaving(true);
      await savePropertyRooms(propertyId, newRooms);
      setIsSaving(false);
    }
  };

  // Quick Passcode Generation
  const handleGeneratePasscodeForRoom = async (roomId: string) => {
    const newCode = generateRoomPasscode(6);
    const expires = new Date(Date.now() + 86400000 * 7).toISOString(); // 7 days default
    
    const updated = rooms.map((r) => {
      if (r.id === roomId) {
        return {
          ...r,
          lockPasscode: newCode,
          passcodeGeneratedAt: new Date().toISOString(),
          passcodeExpiresAt: expires,
          status: r.status === 'vacant' ? 'awaiting_arrival' : r.status,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });

    await updateRoomsState(updated);
    showToast(isRtl ? `تم توليد الرمز الجديد (${newCode}) بنجاح! 🔑` : `New Passcode (${newCode}) generated!`);
  };

  // Batch Generate Passcodes for all vacant rooms
  const handleBatchGeneratePasscodes = async () => {
    const updated = rooms.map((r) => {
      if (r.status === 'vacant' || !r.lockPasscode) {
        return {
          ...r,
          lockPasscode: generateRoomPasscode(6),
          passcodeGeneratedAt: new Date().toISOString(),
          passcodeExpiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });

    await updateRoomsState(updated);
    showToast(isRtl ? 'تم توليد رموز الأقفال الذكية لجميع الغرف بنجاح!' : 'Generated passcodes for all rooms!');
  };

  // Open Approval & Dispatch Modal
  const openApprovalModal = (room: Room) => {
    setApprovalModalRoom(room);
    // If room already has guest info, prefill
    if (room.currentGuest) {
      setGuestForm({
        name: room.currentGuest.name || '',
        phone: room.currentGuest.phone || '',
        checkIn: room.currentGuest.checkIn || new Date().toISOString().split('T')[0],
        checkOut: room.currentGuest.checkOut || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        notes: room.currentGuest.notes || ''
      });
    } else {
      // If room has contact phone on property, use default
      setGuestForm({
        name: '',
        phone: property?.contactPhone || '',
        checkIn: new Date().toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        notes: ''
      });
    }
  };

  // Submit Approval & Grant Room Access
  const handleConfirmApprovalAndGrant = async (sendWhatsApp: boolean = false) => {
    if (!approvalModalRoom || !property) return;

    if (!guestForm.name.trim()) {
      showToast(isRtl ? 'يرجى إدخال اسم النزيل' : 'Please enter guest name', 'error');
      return;
    }

    if (!guestForm.phone.trim()) {
      showToast(isRtl ? 'يرجى إدخال رقم جوال النزيل' : 'Please enter guest phone number', 'error');
      return;
    }

    // Ensure passcode exists
    const passcode = approvalModalRoom.lockPasscode || generateRoomPasscode(6);
    const guest: GuestInfo = {
      name: guestForm.name.trim(),
      phone: guestForm.phone.trim(),
      checkIn: guestForm.checkIn,
      checkOut: guestForm.checkOut,
      notes: guestForm.notes,
      approved: true,
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser?.email || 'المشرف',
      sentViaWhatsapp: sendWhatsApp,
      sentAt: sendWhatsApp ? new Date().toISOString() : undefined
    };

    const updated = rooms.map((r) => {
      if (r.id === approvalModalRoom.id) {
        return {
          ...r,
          status: 'occupied' as RoomStatus,
          lockPasscode: passcode,
          passcodeGeneratedAt: r.passcodeGeneratedAt || new Date().toISOString(),
          currentGuest: guest,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });

    await updateRoomsState(updated);

    if (sendWhatsApp) {
      const msg = buildGuestApprovalWhatsAppMessage(
        guest.name,
        property.name,
        property.city,
        approvalModalRoom.roomNumber,
        passcode,
        guest.checkIn,
        guest.checkOut,
        property.contactPhone
      );
      const cleanPhone = guest.phone.replace(/[^0-9]/g, '');
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
    }

    showToast(isRtl ? `تمت الموافقة وتفعيل دخول الغرفة (${approvalModalRoom.roomNumber}) بنجاح! 🎉` : 'Room access granted and approved successfully!');
    setApprovalModalRoom(null);
  };

  // Check-Out Guest
  const handleCheckOutGuest = async (room: Room) => {
    const updated = rooms.map((r) => {
      if (r.id === room.id) {
        const historyItem = r.currentGuest ? {
          id: `hist_${Date.now()}`,
          guestName: r.currentGuest.name,
          guestPhone: r.currentGuest.phone,
          checkIn: r.currentGuest.checkIn,
          checkOut: new Date().toISOString().split('T')[0],
          passcode: r.lockPasscode || '',
          completedAt: new Date().toISOString()
        } : null;

        return {
          ...r,
          status: 'cleaning' as RoomStatus, // Move to cleaning after checkout
          currentGuest: null,
          lockPasscode: undefined, // Reset passcode for safety
          history: historyItem ? [historyItem, ...(r.history || [])] : r.history,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });

    await updateRoomsState(updated);
    showToast(isRtl ? `تم تسجيل مغادرة النزيل من الغرفة (${room.roomNumber}) وتحويلها للتنظيف 🧹` : `Guest checked out from room ${room.roomNumber}`);
  };

  // Change Room Status directly
  const handleQuickStatusChange = async (roomId: string, newStatus: RoomStatus) => {
    const updated = rooms.map((r) => {
      if (r.id === roomId) {
        return {
          ...r,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });

    await updateRoomsState(updated);
    showToast(isRtl ? 'تم تحديث حالة الغرفة' : 'Room status updated');
  };

  // Open Edit Room Modal
  const openEditModal = (room: Room) => {
    setEditRoomModal(room);
    setEditRoomForm({
      roomNumber: room.roomNumber,
      floor: room.floor,
      type: room.type,
      pricePerNight: room.pricePerNight || '',
      notes: room.notes || ''
    });
  };

  // Save Room Edits
  const handleSaveRoomEdits = async () => {
    if (!editRoomModal) return;
    if (!editRoomForm.roomNumber.trim()) {
      showToast(isRtl ? 'يرجى كتابة رقم أو اسم الغرفة' : 'Please provide a room number', 'error');
      return;
    }

    const updated = rooms.map((r) => {
      if (r.id === editRoomModal.id) {
        return {
          ...r,
          roomNumber: editRoomForm.roomNumber.trim(),
          floor: editRoomForm.floor,
          type: editRoomForm.type,
          pricePerNight: editRoomForm.pricePerNight ? Number(editRoomForm.pricePerNight) : undefined,
          notes: editRoomForm.notes,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });

    await updateRoomsState(updated);
    showToast(isRtl ? `تم تحديث بيانات الغرفة (${editRoomForm.roomNumber}) بنجاح` : 'Room updated');
    setEditRoomModal(null);
  };

  // Add Single New Room
  const handleAddNewRoom = async () => {
    if (!property) return;
    const num = newRoomForm.roomNumber.trim() || `${rooms.length + 1}`;

    const newRoom: Room = {
      id: `room_${property.id}_${Date.now()}`,
      propertyId: property.id,
      roomNumber: num,
      floor: newRoomForm.floor || 1,
      type: newRoomForm.type || 'standard',
      status: 'vacant',
      smartLockBattery: 100,
      smartLockStatus: 'online',
      createdAt: new Date().toISOString()
    };

    const updated = [...rooms, newRoom];
    await updateRoomsState(updated);
    showToast(isRtl ? `تمت إضافة الغرفة (${num}) بنجاح! 🚪` : `Room ${num} added successfully`);
    setShowAddRoomModal(false);
    setNewRoomForm({ roomNumber: '', floor: 1, type: 'standard' });
  };

  // Delete Room
  const handleDeleteRoom = async (roomId: string, roomNum: string) => {
    if (!window.confirm(isRtl ? `هل أنت متأكد من حذف الغرفة (${roomNum})؟` : `Delete room ${roomNum}?`)) {
      return;
    }
    const updated = rooms.filter(r => r.id !== roomId);
    await updateRoomsState(updated);
    showToast(isRtl ? `تم حذف الغرفة (${roomNum})` : `Room ${roomNum} deleted`, 'info');
  };

  // Copy helper
  const copyToClipboard = (text: string, id: string, isMessage = false) => {
    navigator.clipboard.writeText(text);
    if (isMessage) {
      setCopiedMessageRoomId(id);
      setTimeout(() => setCopiedMessageRoomId(null), 2500);
    } else {
      setCopiedPasscodeId(id);
      setTimeout(() => setCopiedPasscodeId(null), 2500);
    }
    showToast(isRtl ? 'تم النسخ إلى الحافظة! 📋' : 'Copied to clipboard!');
  };

  // Statistics & KPI counts
  const stats = useMemo(() => {
    const total = rooms.length;
    const vacant = rooms.filter(r => r.status === 'vacant').length;
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const awaiting = rooms.filter(r => r.status === 'awaiting_arrival').length;
    const cleaning = rooms.filter(r => r.status === 'cleaning').length;
    const maintenance = rooms.filter(r => r.status === 'maintenance').length;
    const occupancyRate = total > 0 ? Math.round(((occupied + awaiting) / total) * 100) : 0;

    return { total, vacant, occupied, awaiting, cleaning, maintenance, occupancyRate };
  }, [rooms]);

  // Floors List
  const floorsList = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach(r => {
      if (r.floor !== undefined) set.add(String(r.floor));
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [rooms]);

  // Filtered & Sorted Rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      // Tab status filter
      if (selectedStatusTab === 'vacant' && r.status !== 'vacant') return false;
      if (selectedStatusTab === 'occupied' && r.status !== 'occupied') return false;
      if (selectedStatusTab === 'awaiting_arrival' && r.status !== 'awaiting_arrival') return false;
      if (selectedStatusTab === 'cleaning' && r.status !== 'cleaning') return false;
      if (selectedStatusTab === 'maintenance' && r.status !== 'maintenance') return false;

      // Floor filter
      if (selectedFloor !== 'all' && String(r.floor) !== selectedFloor) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = r.roomNumber.toLowerCase().includes(q);
        const guestNameMatch = r.currentGuest?.name.toLowerCase().includes(q);
        const guestPhoneMatch = r.currentGuest?.phone.includes(q);
        const codeMatch = r.lockPasscode?.includes(q);
        if (!numMatch && !guestNameMatch && !guestPhoneMatch && !codeMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'roomNumber') {
        const numA = parseInt(a.roomNumber.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.roomNumber.replace(/\D/g, '')) || 0;
        return numA - numB;
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      if (sortBy === 'guest') {
        return (a.currentGuest?.name || '').localeCompare(b.currentGuest?.name || '', isRtl ? 'ar' : 'en');
      }
      return 0;
    });
  }, [rooms, selectedStatusTab, selectedFloor, searchQuery, sortBy, isRtl]);

  const getStatusLabel = (status: RoomStatus) => {
    switch (status) {
      case 'vacant':
        return { label: isRtl ? 'شاغرة وجاهزة' : 'Vacant', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' };
      case 'occupied':
        return { label: isRtl ? 'مشغولة حالياً' : 'Occupied', bg: 'bg-blue-50 text-blue-900 border-blue-300', dot: 'bg-blue-600' };
      case 'awaiting_arrival':
        return { label: isRtl ? 'بانتظار وصول النزيل' : 'Awaiting Guest', bg: 'bg-amber-50 text-amber-900 border-amber-300', dot: 'bg-amber-500 animate-pulse' };
      case 'cleaning':
        return { label: isRtl ? 'جاري التنظيف' : 'Cleaning', bg: 'bg-purple-50 text-purple-900 border-purple-300', dot: 'bg-purple-500' };
      case 'maintenance':
        return { label: isRtl ? 'تحت الصيانة' : 'Maintenance', bg: 'bg-rose-50 text-rose-900 border-rose-300', dot: 'bg-rose-500' };
      default:
        return { label: status, bg: 'bg-slate-50 text-slate-800 border-slate-300', dot: 'bg-slate-400' };
    }
  };

  const getRoomTypeLabel = (type: RoomType) => {
    switch (type) {
      case 'suite': return isRtl ? 'جناح فندقي' : 'Suite';
      case 'deluxe': return isRtl ? 'غرفة ديلوكس' : 'Deluxe';
      case 'studio': return isRtl ? 'استوديو' : 'Studio';
      case 'double': return isRtl ? 'غرفة مزدوجة' : 'Double';
      case 'single': return isRtl ? 'غرفة فردية' : 'Single';
      default: return isRtl ? 'غرفة قياسية' : 'Standard';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-16" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className={`px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 font-black text-sm ${
            toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : toastMessage.type === 'info'
              ? 'bg-[#0B1B3D] text-white border-slate-800'
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}>
            <Sparkles size={16} />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Breadcrumb & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 font-black text-xs cursor-pointer"
              title={isRtl ? 'العودة للوحة الإدارة' : 'Back to Admin'}
            >
              {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
              <span className="hidden sm:inline">{isRtl ? 'لوحة تحكم الإدارة' : 'Admin'}</span>
            </button>

            <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-[#0B1B3D] tracking-tight truncate max-w-[220px] sm:max-w-md">
                  {property?.name || (isRtl ? 'إدارة وتشغيل الغرف' : 'Property Rooms')}
                </h1>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md hidden md:inline-flex items-center gap-1">
                  <KeyRound size={11} />
                  <span>{isRtl ? 'نظام التشغيل الذكي' : 'PMS Smart Operations'}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-amber-500" />
                  <span>{property?.city} - {property?.district}</span>
                </span>
                {property?.contactPhone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Phone size={11} />
                      <span dir="ltr">{property.contactPhone}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBatchGeneratePasscodes()}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title={isRtl ? 'توليد رموز أقفال جديدة للغرف' : 'Generate Codes for Vacant'}
            >
              <RefreshCw size={13} className={isSaving ? 'animate-spin' : ''} />
              <span>{isRtl ? 'توليد رموز دفعة واحدة' : 'Batch Generate Pins'}</span>
            </button>

            <button
              onClick={() => setShowAddRoomModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0B1B3D] hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>{isRtl ? 'إضافة غرفة' : 'Add Room'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title={isRtl ? 'طباعة كشف الغرف والرموز' : 'Print Room Sheet'}
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Stats Bar */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Total */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>{isRtl ? 'إجمالي الغرف' : 'Total Rooms'}</span>
              <Building2 size={16} className="text-slate-400" />
            </div>
            <p className="text-2xl font-black text-[#0B1B3D]">{stats.total}</p>
            <span className="text-[10px] text-slate-400 font-bold block">{isRtl ? 'في هذا العقار' : 'in property'}</span>
          </div>

          {/* Vacant */}
          <div 
            onClick={() => setSelectedStatusTab(selectedStatusTab === 'vacant' ? 'all' : 'vacant')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
              selectedStatusTab === 'vacant'
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/30'
                : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={selectedStatusTab === 'vacant' ? 'text-emerald-100' : 'text-emerald-700'}>
                {isRtl ? 'شاغرة ومتاحة' : 'Vacant'}
              </span>
              <CheckCircle2 size={16} className={selectedStatusTab === 'vacant' ? 'text-white' : 'text-emerald-600'} />
            </div>
            <p className="text-2xl font-black">{stats.vacant}</p>
            <span className={`text-[10px] font-bold block ${selectedStatusTab === 'vacant' ? 'text-emerald-100' : 'text-slate-400'}`}>
              {isRtl ? 'جاهزة للتسكين الفوري' : 'Ready for guests'}
            </span>
          </div>

          {/* Occupied */}
          <div 
            onClick={() => setSelectedStatusTab(selectedStatusTab === 'occupied' ? 'all' : 'occupied')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
              selectedStatusTab === 'occupied'
                ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400/30'
                : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={selectedStatusTab === 'occupied' ? 'text-blue-100' : 'text-blue-700'}>
                {isRtl ? 'مشغولة حالياً' : 'Occupied'}
              </span>
              <User size={16} className={selectedStatusTab === 'occupied' ? 'text-white' : 'text-blue-600'} />
            </div>
            <p className="text-2xl font-black">{stats.occupied}</p>
            <span className={`text-[10px] font-bold block ${selectedStatusTab === 'occupied' ? 'text-blue-100' : 'text-slate-400'}`}>
              {isRtl ? 'نزلاء مقيمون' : 'Active tenants'}
            </span>
          </div>

          {/* Awaiting Arrival */}
          <div 
            onClick={() => setSelectedStatusTab(selectedStatusTab === 'awaiting_arrival' ? 'all' : 'awaiting_arrival')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
              selectedStatusTab === 'awaiting_arrival'
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-400/30'
                : 'bg-white border-slate-200 hover:border-amber-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={selectedStatusTab === 'awaiting_arrival' ? 'text-slate-950' : 'text-amber-700'}>
                {isRtl ? 'بانتظار الوصول' : 'Awaiting Arrival'}
              </span>
              <Clock size={16} className={selectedStatusTab === 'awaiting_arrival' ? 'text-slate-950' : 'text-amber-600'} />
            </div>
            <p className="text-2xl font-black">{stats.awaiting}</p>
            <span className={`text-[10px] font-bold block ${selectedStatusTab === 'awaiting_arrival' ? 'text-slate-900' : 'text-slate-400'}`}>
              {isRtl ? 'تم توليد الرمز' : 'Passcode sent'}
            </span>
          </div>

          {/* Cleaning / Maintenance */}
          <div 
            onClick={() => setSelectedStatusTab(selectedStatusTab === 'cleaning' ? 'all' : 'cleaning')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
              selectedStatusTab === 'cleaning'
                ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-400/30'
                : 'bg-white border-slate-200 hover:border-purple-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={selectedStatusTab === 'cleaning' ? 'text-purple-100' : 'text-purple-700'}>
                {isRtl ? 'تنظيف / صيانة' : 'Cleaning'}
              </span>
              <Sparkles size={16} className={selectedStatusTab === 'cleaning' ? 'text-white' : 'text-purple-600'} />
            </div>
            <p className="text-2xl font-black">{stats.cleaning + stats.maintenance}</p>
            <span className={`text-[10px] font-bold block ${selectedStatusTab === 'cleaning' ? 'text-purple-100' : 'text-slate-400'}`}>
              {isRtl ? 'تحت التجهيز' : 'In turnover'}
            </span>
          </div>

          {/* Occupancy Rate */}
          <div className="bg-gradient-to-br from-[#0B1B3D] to-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-2xs space-y-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-300 text-xs font-bold">
              <span>{isRtl ? 'نسبة الإشغال' : 'Occupancy'}</span>
              <ShieldCheck size={16} className="text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400">{stats.occupancyRate}%</p>
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${stats.occupancyRate}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* Toolbar: Search, Filters & Sorters */}
        <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'بحث برقم الغرفة، النزيل، الجوال، الرمز...' : 'Search room, guest, phone...'}
                className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-black cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {/* Status Tabs Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
              {[
                { key: 'all', label: isRtl ? 'جميع الغرف' : 'All Rooms', count: rooms.length },
                { key: 'vacant', label: isRtl ? 'شاغرة' : 'Vacant', count: stats.vacant },
                { key: 'occupied', label: isRtl ? 'مشغولة' : 'Occupied', count: stats.occupied },
                { key: 'awaiting_arrival', label: isRtl ? 'بانتظار الوصول' : 'Awaiting', count: stats.awaiting },
                { key: 'cleaning', label: isRtl ? 'تنظيف' : 'Cleaning', count: stats.cleaning },
                { key: 'maintenance', label: isRtl ? 'صيانة' : 'Maintenance', count: stats.maintenance },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedStatusTab(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedStatusTab === tab.key
                      ? 'bg-[#0B1B3D] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedStatusTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Floor & Sort Dropdowns */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              {/* Floor Filter */}
              {floorsList.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-bold">
                  <Layers size={13} className="text-slate-400" />
                  <select
                    value={selectedFloor}
                    onChange={(e) => setSelectedFloor(e.target.value)}
                    className="bg-transparent border-0 font-bold text-slate-700 text-xs focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">{isRtl ? 'كل الطوابق' : 'All Floors'}</option>
                    {floorsList.map((f) => (
                      <option key={f} value={f}>
                        {isRtl ? `طابق ${f}` : `Floor ${f}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort selector */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-bold">
                <SlidersHorizontal size={13} className="text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-0 font-bold text-slate-700 text-xs focus:outline-hidden cursor-pointer"
                >
                  <option value="roomNumber">{isRtl ? 'ترتيب: رقم الغرفة' : 'Sort: Room #'}</option>
                  <option value="status">{isRtl ? 'ترتيب: الحالة' : 'Sort: Status'}</option>
                  <option value="guest">{isRtl ? 'ترتيب: اسم النزيل' : 'Sort: Guest'}</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Rooms Cards Grid */}
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#0B1B3D] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-700">
              {isRtl ? 'جاري تحميل وتشغيل غرف العقار والأقفال الذكية...' : 'Loading smart rooms...'}
            </p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <KeyRound size={28} />
            </div>
            <h3 className="text-base font-black text-slate-800">
              {isRtl ? 'لا توجد غرف مطابقة لمعايير البحث' : 'No matching rooms found'}
            </h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm">
              {isRtl ? 'جرب تغيير التبويب المختار أو مسح نص البحث.' : 'Try changing your filter criteria or search query.'}
            </p>
            <button
              onClick={() => {
                setSelectedStatusTab('all');
                setSelectedFloor('all');
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-2 bg-[#0B1B3D] text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
            >
              {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredRooms.map((room) => {
              const statusCfg = getStatusLabel(room.status);
              const hasGuest = Boolean(room.currentGuest);
              const isApproved = Boolean(room.currentGuest?.approved);

              return (
                <div
                  key={room.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between p-4 sm:p-5 shadow-2xs hover:shadow-md ${
                    room.status === 'occupied'
                      ? 'border-blue-200 ring-1 ring-blue-100'
                      : room.status === 'awaiting_arrival'
                      ? 'border-amber-300 ring-1 ring-amber-100'
                      : room.status === 'vacant'
                      ? 'border-slate-200 hover:border-emerald-300'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Room Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Room Number Badge with Edit action */}
                        <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1 rounded-xl shadow-2xs font-mono font-black text-sm">
                          <span>🚪 {room.roomNumber}</span>
                        </div>

                        {/* Quick Edit Room Button */}
                        <button
                          onClick={() => openEditModal(room)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title={isRtl ? 'تعديل رقم وبيانات الغرفة' : 'Edit Room Number/Details'}
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>

                      {/* Floor & Type badge */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {isRtl ? `طابق ${room.floor}` : `F${room.floor}`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {getRoomTypeLabel(room.type)}
                        </span>
                      </div>
                    </div>

                    {/* Room Status Pill & Quick Switcher */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${statusCfg.bg}`}>
                        <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`}></span>
                        <span>{statusCfg.label}</span>
                      </span>

                      {/* Quick Status Dropdown */}
                      <select
                        value={room.status}
                        onChange={(e) => handleQuickStatusChange(room.id, e.target.value as RoomStatus)}
                        className="text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 focus:outline-hidden cursor-pointer"
                      >
                        <option value="vacant">{isRtl ? 'شاغرة' : 'Vacant'}</option>
                        <option value="occupied">{isRtl ? 'مشغولة' : 'Occupied'}</option>
                        <option value="awaiting_arrival">{isRtl ? 'بانتظار الوصول' : 'Awaiting'}</option>
                        <option value="cleaning">{isRtl ? 'تنظيف' : 'Cleaning'}</option>
                        <option value="maintenance">{isRtl ? 'صيانة' : 'Maintenance'}</option>
                      </select>
                    </div>

                    {/* Smart Lock Keypad / Passcode Box */}
                    <div className="bg-gradient-to-br from-slate-900 to-[#0B1B3D] text-white p-3.5 rounded-2xl shadow-xs space-y-2 relative overflow-hidden">
                      <div className="flex items-center justify-between text-slate-300 text-[11px] font-bold">
                        <span className="flex items-center gap-1.5 text-amber-300">
                          <KeyRound size={13} />
                          <span>{isRtl ? 'رمز القفل الذكي (PIN)' : 'Smart Lock PIN'}</span>
                        </span>
                        {room.smartLockBattery !== undefined && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <BatteryCharging size={12} className="text-emerald-400" />
                            <span>{room.smartLockBattery}%</span>
                          </span>
                        )}
                      </div>

                      {room.lockPasscode ? (
                        <div className="flex items-center justify-between gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-white/10">
                          <div className="font-mono text-lg font-black tracking-widest text-amber-400 drop-shadow-xs" dir="ltr">
                            {room.lockPasscode}
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Copy Code */}
                            <button
                              onClick={() => copyToClipboard(room.lockPasscode!, room.id)}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                              title={isRtl ? 'نسخ الرمز' : 'Copy Passcode'}
                            >
                              {copiedPasscodeId === room.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>

                            {/* Regenerate Single Code */}
                            <button
                              onClick={() => handleGeneratePasscodeForRoom(room.id)}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                              title={isRtl ? 'توليد رمز جديد' : 'Generate New Pin'}
                            >
                              <RefreshCw size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGeneratePasscodeForRoom(room.id)}
                          className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <KeyRound size={14} />
                          <span>{isRtl ? 'توليد رمز القفل الآن 🔑' : 'Generate PIN'}</span>
                        </button>
                      )}

                      {/* Expiry note */}
                      {room.lockPasscode && room.passcodeGeneratedAt && (
                        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                          <span>
                            {isRtl ? 'تم التوليد:' : 'Created:'} {new Date(room.passcodeGeneratedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-emerald-400 font-bold">
                            {isRtl ? 'جاهز للاستخدام' : 'Active'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Guest Section (Current Tenant / Booking) */}
                    <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl space-y-2">
                      {hasGuest && room.currentGuest ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-[#0B1B3D] flex items-center gap-1.5">
                              <User size={13} className="text-slate-400" />
                              <span>{room.currentGuest.name}</span>
                            </span>

                            {/* Approval state */}
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              isApproved 
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                                : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                            }`}>
                              {isApproved ? <CheckCircle2 size={11} className="text-emerald-700" /> : <Clock size={11} />}
                              <span>{isApproved ? (isRtl ? 'تمت الموافقة' : 'Approved') : (isRtl ? 'بانتظار الموافقة' : 'Pending')}</span>
                            </span>
                          </div>

                          {/* Guest Phone & WhatsApp click */}
                          <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                            <span className="flex items-center gap-1" dir="ltr">
                              <Phone size={12} className="text-slate-400" />
                              <span>{room.currentGuest.phone}</span>
                            </span>

                            <a
                              href={`https://wa.me/${room.currentGuest.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-emerald-700 hover:text-emerald-800 font-black flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                            >
                              <MessageSquare size={10} />
                              <span>واتساب</span>
                            </a>
                          </div>

                          {/* Checkin - Checkout dates */}
                          <div className="text-[10px] text-slate-500 font-bold flex items-center justify-between pt-1 border-t border-slate-200">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} className="text-slate-400" />
                              <span>{room.currentGuest.checkIn} ➔ {room.currentGuest.checkOut}</span>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2 space-y-1">
                          <span className="text-xs font-bold text-slate-400 block">
                            {isRtl ? 'لا يوجد نزيل مسكن حالياً' : 'No active guest assigned'}
                          </span>
                          <button
                            onClick={() => openApprovalModal(room)}
                            className="text-[11px] font-black text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                          >
                            {isRtl ? '+ تسكين نزيل وإصدار موافقة' : '+ Assign & Grant Access'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-3.5 mt-3 border-t border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      {/* Grant Access & Send Code Button */}
                      <button
                        onClick={() => openApprovalModal(room)}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Send size={13} />
                        <span>{isRtl ? 'الموافقة والإرسال للنزيل' : 'Approve & Send'}</span>
                      </button>

                      {/* Check-Out / Release room if occupied */}
                      {hasGuest ? (
                        <button
                          onClick={() => handleCheckOutGuest(room)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                          title={isRtl ? 'تسجيل مغادرة النزيل' : 'Check-Out Guest'}
                        >
                          <LogOut size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteRoom(room.id, room.roomNumber)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-400 hover:border-rose-200 border border-transparent transition-colors cursor-pointer"
                          title={isRtl ? 'حذف هذه الغرفة' : 'Delete room'}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL 1: Guest Approval & Send Passcode Modal */}
      {approvalModalRoom && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 min-h-screen">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#0B1B3D] to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {isRtl ? `الموافقة وإرسال رمز الغرفة (${approvalModalRoom.roomNumber})` : `Grant Access: Room ${approvalModalRoom.roomNumber}`}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    {property?.name} - {property?.city}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setApprovalModalRoom(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-black transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Passcode preview badge */}
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-900 font-bold block">{isRtl ? 'رمز القفل الذكي المخصص للدخول:' : 'Smart Lock Code:'}</span>
                  <span className="text-xl font-mono font-black text-slate-950" dir="ltr">
                    {approvalModalRoom.lockPasscode || (isRtl ? 'سيتم توليده تلقائياً' : 'Will be generated')}
                  </span>
                </div>
                <button
                  onClick={() => handleGeneratePasscodeForRoom(approvalModalRoom.id)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>{isRtl ? 'رمز جديد' : 'New PIN'}</span>
                </button>
              </div>

              {/* Guest Details Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isRtl ? 'اسم النزيل / المستأجر *' : 'Guest Name *'}
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={guestForm.name}
                      onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                      placeholder={isRtl ? 'مثال: محمد عبدالله القحطاني' : 'e.g. John Doe'}
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isRtl ? 'رقم جوال النزيل (لإرسال الواتساب) *' : 'Guest Phone Number *'}
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      dir="ltr"
                      value={guestForm.phone}
                      onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                      placeholder="+966 5X XXX XXXX"
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      {isRtl ? 'تاريخ الدخول' : 'Check-In'}
                    </label>
                    <input
                      type="date"
                      value={guestForm.checkIn}
                      onChange={(e) => setGuestForm({ ...guestForm, checkIn: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      {isRtl ? 'تاريخ المغادرة' : 'Check-Out'}
                    </label>
                    <input
                      type="date"
                      value={guestForm.checkOut}
                      onChange={(e) => setGuestForm({ ...guestForm, checkOut: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isRtl ? 'ملاحظات إضافية للنزيل' : 'Notes'}
                  </label>
                  <input
                    type="text"
                    value={guestForm.notes}
                    onChange={(e) => setGuestForm({ ...guestForm, notes: e.target.value })}
                    placeholder={isRtl ? 'مثال: شامل الإفطار، موقف سيارة رقم 4' : 'Special requests'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                  />
                </div>
              </div>

              {/* Live Preview of WhatsApp Message */}
              <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-700">
                  <span className="flex items-center gap-1 text-emerald-800">
                    <MessageSquare size={14} className="text-emerald-600" />
                    <span>{isRtl ? 'معاينة رسالة الإشعار التلقائية:' : 'WhatsApp Message Preview:'}</span>
                  </span>
                  <button
                    onClick={() => {
                      if (!property) return;
                      const msg = buildGuestApprovalWhatsAppMessage(
                        guestForm.name,
                        property.name,
                        property.city,
                        approvalModalRoom.roomNumber,
                        approvalModalRoom.lockPasscode || '842915',
                        guestForm.checkIn,
                        guestForm.checkOut,
                        property.contactPhone
                      );
                      copyToClipboard(msg, approvalModalRoom.id, true);
                    }}
                    className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={11} />
                    <span>{isRtl ? 'نسخ نص الرسالة' : 'Copy Text'}</span>
                  </button>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 font-sans whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                  {property && buildGuestApprovalWhatsAppMessage(
                    guestForm.name,
                    property.name,
                    property.city,
                    approvalModalRoom.roomNumber,
                    approvalModalRoom.lockPasscode || 'XXXXXX',
                    guestForm.checkIn,
                    guestForm.checkOut,
                    property.contactPhone
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2.5">
              {/* WhatsApp & Grant */}
              <button
                onClick={() => handleConfirmApprovalAndGrant(true)}
                className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <MessageSquare size={16} />
                <span>{isRtl ? 'اعتماد وإرسال فوراً عبر واتساب 📲' : 'Approve & Send via WhatsApp'}</span>
              </button>

              {/* Just Grant without opening whatsapp */}
              <button
                onClick={() => handleConfirmApprovalAndGrant(false)}
                className="w-full sm:w-auto py-3 px-4 bg-[#0B1B3D] hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>{isRtl ? 'اعتماد وسماح فقط' : 'Grant Only'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Room Modal */}
      {editRoomModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 min-h-screen">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-[#0B1B3D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 size={18} className="text-amber-400" />
                <h3 className="text-base font-black">
                  {isRtl ? `تعديل بيانات الغرفة (${editRoomModal.roomNumber})` : `Edit Room ${editRoomModal.roomNumber}`}
                </h3>
              </div>
              <button
                onClick={() => setEditRoomModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-black transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isRtl ? 'رقم أو اسم الغرفة *' : 'Room Number / Name *'}
                </label>
                <input
                  type="text"
                  value={editRoomForm.roomNumber}
                  onChange={(e) => setEditRoomForm({ ...editRoomForm, roomNumber: e.target.value })}
                  placeholder={isRtl ? 'مثال: 101 أو جناح النخيل VIP' : 'e.g. 101 or Palm Suite'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isRtl ? 'الطابق' : 'Floor'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editRoomForm.floor}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, floor: Number(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isRtl ? 'نوع الغرفة' : 'Room Type'}
                  </label>
                  <select
                    value={editRoomForm.type}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, type: e.target.value as RoomType })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                  >
                    <option value="standard">{isRtl ? 'غرفة قياسية' : 'Standard'}</option>
                    <option value="suite">{isRtl ? 'جناح فندقي' : 'Suite'}</option>
                    <option value="deluxe">{isRtl ? 'غرفة ديلوكس' : 'Deluxe'}</option>
                    <option value="studio">{isRtl ? 'استوديو' : 'Studio'}</option>
                    <option value="double">{isRtl ? 'غرفة مزدوجة' : 'Double'}</option>
                    <option value="single">{isRtl ? 'غرفة فردية' : 'Single'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isRtl ? 'سعر الليلة التقديري (ر.س)' : 'Price per Night (SAR)'}
                </label>
                <input
                  type="number"
                  placeholder="350"
                  value={editRoomForm.pricePerNight}
                  onChange={(e) => setEditRoomForm({ ...editRoomForm, pricePerNight: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isRtl ? 'ملاحظات الغرفة الداخلية' : 'Internal Notes'}
                </label>
                <textarea
                  rows={2}
                  value={editRoomForm.notes}
                  onChange={(e) => setEditRoomForm({ ...editRoomForm, notes: e.target.value })}
                  placeholder={isRtl ? 'ملاحظات الصيانة أو التجهيز...' : 'Room notes...'}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                />
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditRoomModal(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveRoomEdits}
                className="px-5 py-2.5 bg-[#0B1B3D] hover:bg-slate-800 text-white rounded-xl font-black text-xs transition-all shadow-sm cursor-pointer"
              >
                {isRtl ? 'حفظ التعديلات' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Add New Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 min-h-screen">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-[#0B1B3D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-amber-400" />
                <h3 className="text-base font-black">
                  {isRtl ? 'إضافة غرفة جديدة للعقار' : 'Add New Room'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddRoomModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-black transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  {isRtl ? 'رقم أو اسم الغرفة الجديدة *' : 'Room Number / Name *'}
                </label>
                <input
                  type="text"
                  value={newRoomForm.roomNumber}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, roomNumber: e.target.value })}
                  placeholder={isRtl ? `مثال: ${rooms.length + 101} أو جناح 302` : `e.g. ${rooms.length + 1}`}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isRtl ? 'الطابق' : 'Floor'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newRoomForm.floor}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, floor: Number(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    {isRtl ? 'نوع الغرفة' : 'Room Type'}
                  </label>
                  <select
                    value={newRoomForm.type}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, type: e.target.value as RoomType })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                  >
                    <option value="standard">{isRtl ? 'غرفة قياسية' : 'Standard'}</option>
                    <option value="suite">{isRtl ? 'جناح فندقي' : 'Suite'}</option>
                    <option value="deluxe">{isRtl ? 'غرفة ديلوكس' : 'Deluxe'}</option>
                    <option value="studio">{isRtl ? 'استوديو' : 'Studio'}</option>
                    <option value="double">{isRtl ? 'غرفة مزدوجة' : 'Double'}</option>
                    <option value="single">{isRtl ? 'غرفة فردية' : 'Single'}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAddRoomModal(false)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleAddNewRoom}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={15} />
                <span>{isRtl ? 'إضافة وتثبيت الغرفة' : 'Add Room'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
