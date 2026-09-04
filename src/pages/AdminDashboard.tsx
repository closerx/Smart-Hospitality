import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Property, PropertyStatus, PropertyType } from '../types/property';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Search, 
  Phone, 
  MapPin, 
  Eye, 
  RefreshCw, 
  ExternalLink, 
  LogOut, 
  Home, 
  Sparkles, 
  KeyRound, 
  FileText, 
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
  Trash2,
  Mail,
  UserPlus,
  ShieldAlert,
  Copy,
  Code,
  Users,
  Send,
  Database,
  Filter,
  Layers,
  LayoutGrid,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Navigation
} from 'lucide-react';
import { clearAllDatabaseAccounts, PurgeResult } from '../utils/dbReset';
import { getOTPEmailHTML, getSupabaseNativeOTPEmailTemplate, createAndSaveOTP, generateOTP } from '../utils/otpService';
import { safeUpdateProperty, unpackPropertyMetadata } from '../utils/propertyPersistence';

export default function AdminDashboard() {
  const { i18n } = useTranslation();
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';

  // Navigation View
  const [activeMainSection, setActiveMainSection] = useState<'properties' | 'db_reset' | 'otp_hub' | 'admins'>('properties');

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'all' | 'active' | 'deletion_requests' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // City-wise Filter & Sort State
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'city' | 'rooms_desc' | 'rooms_asc'>('newest');
  const [viewMode, setViewMode] = useState<'grouped_by_city' | 'grid'>('grouped_by_city');
  const [collapsedCities, setCollapsedCities] = useState<Record<string, boolean>>({});
  
  // Rejection Modal State
  const [rejectingProperty, setRejectingProperty] = useState<Property | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [propertyToDeletePermanently, setPropertyToDeletePermanently] = useState<Property | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Gallery Modal State
  const [galleryModalImages, setGalleryModalImages] = useState<string[] | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Database Reset / Purge State
  const [showPurgeConfirmModal, setShowPurgeConfirmModal] = useState(false);
  const [purgeAlsoProperties, setPurgeAlsoProperties] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<PurgeResult | null>(null);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');

  // OTP Testing Hub State
  const [otpTestEmail, setOtpTestEmail] = useState('closer2019@yahoo.com');
  const [otpTestName, setOtpTestName] = useState('مشرف النظام / هادي');
  const [otpTestCode, setOtpTestCode] = useState('849201');
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedSupabaseHtml, setCopiedSupabaseHtml] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [sendTestEmailResult, setSendTestEmailResult] = useState<{ success: boolean; message: string; provider?: string } | null>(null);

  // Co-Admin Management State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [adminAddStatus, setAdminAddStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [platformUsers, setPlatformUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [modifyingUserId, setModifyingUserId] = useState<string | null>(null);

  // Stats for DB collections
  const [dbCounts, setDbCounts] = useState({
    users: 0,
    tenants: 0,
    owners: 0,
    cleaners: 0,
    properties: 0,
    verifications: 0
  });

  const fetchDbCounts = async () => {
    try {
      const [uRes, tRes, oRes, cRes, pRes, vRes] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('tenants').select('*', { count: 'exact', head: true }),
        supabase.from('owners').select('*', { count: 'exact', head: true }),
        supabase.from('cleaners').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('email_verifications').select('*', { count: 'exact', head: true })
      ]);
      setDbCounts({
        users: uRes.count ?? 0,
        tenants: tRes.count ?? 0,
        owners: oRes.count ?? 0,
        cleaners: cRes.count ?? 0,
        properties: pRes.count ?? 0,
        verifications: vRes.count ?? 0
      });
    } catch (e) {
      console.warn('Error fetching db counts from Supabase:', e);
    }
  };

  // Fetch all properties
  const fetchProperties = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*');

      if (error) {
        console.warn('Supabase fetch properties notice:', error.message);
      }

      const list: Property[] = (data || []).map((item: any) => {
        const { cleanDescription, meta } = unpackPropertyMetadata(item.description);
        return {
          id: item.id,
          ownerId: item.ownerId || item.owner_id,
          name: item.name || item.title || item.property_name || '',
          type: item.type,
          leaseType: item.leaseType || item.lease_type,
          contractDuration: item.contractDuration || item.contract_duration,
          agreedToContractTerms: item.agreedToContractTerms ?? true,
          city: item.city,
          district: item.district,
          address: item.address,
          roomsCount: item.roomsCount || item.rooms_count || 10,
          floorsCount: item.floorsCount || item.floors_count,
          smartLocksEnabled: item.smartLocksEnabled ?? true,
          contactPhone: item.contactPhone || item.contact_phone,
          description: cleanDescription,
          amenities: item.amenities || [],
          coverImage: item.coverImage || item.cover_image,
          images: item.images || [],
          status: item.status || 'pending_approval',
          rejectionReason: item.rejectionReason || item.rejection_reason || meta.rejectionReason,
          deletionReason: item.deletionReason || item.deletion_reason || meta.deletionReason,
          deletionRequestedAt: item.deletionRequestedAt || item.deletion_requested_at || meta.deletionRequestedAt,
          deletionRequestedBy: item.deletionRequestedBy || item.deletion_requested_by || meta.deletionRequestedBy,
          previousStatus: item.previousStatus || item.previous_status || meta.previousStatus,
          reviewedAt: item.reviewedAt || item.reviewed_at || meta.reviewedAt,
          reviewedBy: item.reviewedBy || item.reviewed_by || meta.reviewedBy,
          reviewerNotes: item.reviewerNotes || item.reviewer_notes || meta.reviewerNotes,
          occupancyRate: item.occupancyRate ?? item.occupancy_rate ?? 0,
          createdAt: item.createdAt || item.created_at,
          updatedAt: item.updatedAt || item.updated_at,
        };
      });

      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      setProperties(list);
      await fetchDbCounts();

      // If there are no pending approval properties but there are active deletion requests, auto-focus deletion requests
      const pendingCount = list.filter((p) => p.status === 'pending_approval').length;
      const deletionCount = list.filter((p) => p.status === 'deletion_requested').length;
      if (pendingCount === 0 && deletionCount > 0) {
        setSelectedTab('deletion_requests');
      }
    } catch (err) {
      console.error('Error fetching properties for admin from Supabase:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProperties();

    const handleFocus = () => {
      fetchProperties();
    };
    window.addEventListener('focus', handleFocus);

    const intervalId = setInterval(() => {
      fetchProperties();
    }, 25000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, []);

  // Handle Purge Database
  const handleExecutePurge = async () => {
    if (purgeConfirmText !== 'تأكيد' && purgeConfirmText.toLowerCase() !== 'confirm') {
      return;
    }

    setIsPurging(true);
    try {
      const res = await clearAllDatabaseAccounts(purgeAlsoProperties);
      setPurgeResult(res);
      setShowPurgeConfirmModal(false);
      setPurgeConfirmText('');
      setActionSuccessMsg(
        isRtl
          ? `تم تصفير وتفريغ قاعدة البيانات بنجاح! (${res.usersDeleted} حسابات، ${res.verificationsDeleted} رموز تحقق). الحساب الإداري محفوظ.`
          : `Database purged successfully! (${res.usersDeleted} accounts cleared). Admin account preserved.`
      );
      await fetchProperties();
    } catch (err) {
      console.error('Error purging database:', err);
      setActionSuccessMsg(isRtl ? 'حدث خطأ أثناء تصفير قاعدة البيانات' : 'Failed to purge database');
    } finally {
      setIsPurging(false);
    }
  };

  // Fetch registered users for role management
  const fetchPlatformUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setPlatformUsers(data);
      }
    } catch (e) {
      console.warn('Could not fetch platform users:', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeMainSection === 'admins') {
      fetchPlatformUsers();
    }
  }, [activeMainSection]);

  // Handle Promote User to Admin via email
  const handlePromoteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToPromote = newAdminEmail.trim().toLowerCase();
    if (!emailToPromote || !emailToPromote.includes('@')) {
      setAdminAddStatus({
        type: 'error',
        message: isRtl ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address'
      });
      return;
    }

    setIsAddingAdmin(true);
    setAdminAddStatus(null);

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('users')
        .update({ role: 'admin', updated_at: now })
        .eq('email', emailToPromote)
        .select();

      if (!error && data && data.length > 0) {
        setAdminAddStatus({
          type: 'success',
          message: isRtl 
            ? `تم ترقية المستخدم (${emailToPromote}) إلى رتبة مدير (Admin) بنجاح!` 
            : `User (${emailToPromote}) promoted to Admin successfully!`
        });
        setNewAdminEmail('');
        await fetchDbCounts();
        await fetchPlatformUsers();
      } else {
        // Upsert admin user
        const { error: upsertErr } = await supabase.from('users').upsert({
          id: `admin_${emailToPromote.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email: emailToPromote,
          role: 'admin',
          full_name: 'مشرف إدارة',
          is_email_verified: true,
          updated_at: now
        }, { onConflict: 'email' });

        if (upsertErr) throw upsertErr;

        setAdminAddStatus({
          type: 'success',
          message: isRtl 
            ? `تم ترقية وتعيين المستخدم (${emailToPromote}) مديراً للمنصة بنجاح!` 
            : `User (${emailToPromote}) promoted to Admin successfully!`
        });
        setNewAdminEmail('');
        await fetchDbCounts();
        await fetchPlatformUsers();
      }
    } catch (err: any) {
      console.error('Error promoting admin:', err);
      setAdminAddStatus({
        type: 'error',
        message: isRtl ? 'حدث خطأ أثناء ترقية المشرف' : 'Failed to promote admin'
      });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  // Toggle user role between Admin and standard role
  const handleToggleUserAdminRole = async (targetUser: any) => {
    const isCurrentlyAdmin = targetUser.role === 'admin';
    const newRole = isCurrentlyAdmin ? 'owner' : 'admin';
    setModifyingUserId(targetUser.id);
    setAdminAddStatus(null);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('users')
        .update({ role: newRole, updated_at: now })
        .eq('id', targetUser.id);

      if (error) throw error;

      setPlatformUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole, updated_at: now } : u))
      );
      await fetchDbCounts();
      setAdminAddStatus({
        type: 'success',
        message: isRtl
          ? (newRole === 'admin'
              ? `تمت ترقية الحساب (${targetUser.email}) إلى مشرف إدارة (Admin) بنجاح!`
              : `تم تحويل الحساب (${targetUser.email}) إلى رتبة مالك (تمت إزالة صلاحية الأدمن)`)
          : (newRole === 'admin'
              ? `User (${targetUser.email}) promoted to Admin!`
              : `User (${targetUser.email}) role changed to Owner.`)
      });
    } catch (err: any) {
      console.error('Error toggling admin role:', err);
      setAdminAddStatus({
        type: 'error',
        message: isRtl ? 'حدث خطأ أثناء تعديل صلاحية الحساب' : 'Failed to update user role'
      });
    } finally {
      setModifyingUserId(null);
    }
  };

  const handleGenerateNewOtpTest = () => {
    const newOtp = generateOTP();
    setOtpTestCode(newOtp);
    setSendTestEmailResult(null);
  };

  const handleSendRealTestEmail = async () => {
    if (!otpTestEmail || !otpTestEmail.includes('@')) {
      alert(isRtl ? 'يرجى إدخال بريد إلكتروني صالح' : 'Please enter a valid email address');
      return;
    }

    setIsSendingTestEmail(true);
    setSendTestEmailResult(null);

    try {
      // 1. Save in Supabase & local storage
      const res = await createAndSaveOTP(otpTestEmail, otpTestName);
      const codeToSend = res.otp || otpTestCode;
      setOtpTestCode(codeToSend);

      // 2. Call backend send-otp endpoint
      const apiRes = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: otpTestEmail.trim().toLowerCase(),
          otp: codeToSend,
          fullName: otpTestName.trim()
        })
      });

      const json = await apiRes.json();
      if (json.success) {
        setSendTestEmailResult({
          success: true,
          message: isRtl 
            ? `تم إرسال رمز التحقق (${codeToSend}) بنجاح إلى البريد: ${otpTestEmail}`
            : `OTP (${codeToSend}) sent successfully to: ${otpTestEmail}`,
          provider: json.provider
        });
      } else {
        setSendTestEmailResult({
          success: false,
          message: json.error || (isRtl ? 'تعذر إرسال البريد الإلكتروني حالياً' : 'Failed to send email')
        });
      }
    } catch (err: any) {
      console.error('Error sending test OTP email:', err);
      setSendTestEmailResult({
        success: false,
        message: err?.message || (isRtl ? 'حدث خطأ في الاتصال بالخادم' : 'Server connection error')
      });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleCopyHtmlTemplate = () => {
    const html = getOTPEmailHTML(otpTestName, otpTestCode);
    navigator.clipboard.writeText(html);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const handleCopySupabaseHtml = () => {
    const template = getSupabaseNativeOTPEmailTemplate();
    navigator.clipboard.writeText(template);
    setCopiedSupabaseHtml(true);
    setTimeout(() => setCopiedSupabaseHtml(false), 2500);
  };

  const handleCopyOtpCode = () => {
    navigator.clipboard.writeText(otpTestCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Handle Approve
  const handleApproveProperty = async (prop: Property) => {
    if (!prop.id) return;
    setIsProcessingAction(true);
    try {
      const now = new Date().toISOString();
      await safeUpdateProperty(prop.id, {
        status: 'active',
        currentDescription: prop.description,
        reviewedAt: now,
        reviewedBy: currentUser?.email || 'admin',
        deletionReason: null,
        deletionRequestedAt: null,
        deletionRequestedBy: null,
      });

      setProperties((prev) =>
        prev.map((p) =>
          p.id === prop.id
            ? { ...p, status: 'active', reviewedAt: now, reviewedBy: currentUser?.email || 'admin' }
            : p
        )
      );

      setActionSuccessMsg(
        isRtl
          ? `تم اعتماد وتفعيل عقار "${prop.name}" بنجاح!`
          : `Property "${prop.name}" approved successfully!`
      );
      setTimeout(() => setActionSuccessMsg(null), 4000);
      if (selectedProperty?.id === prop.id) {
        setSelectedProperty((prev) => (prev ? { ...prev, status: 'active' } : null));
      }
    } catch (err) {
      console.error('Error approving property on Supabase:', err);
      alert(isRtl ? 'حدث خطأ أثناء اعتماد العقار' : 'Failed to approve property');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!rejectingProperty?.id) return;
    setIsProcessingAction(true);
    try {
      const now = new Date().toISOString();
      const reason = rejectionReason.trim() || (isRtl ? 'بيانات غير مكتملة أو صور غير واضحة' : 'Incomplete data or unclear images');

      await safeUpdateProperty(rejectingProperty.id, {
        status: 'rejected',
        currentDescription: rejectingProperty.description,
        rejectionReason: reason,
        reviewedAt: now,
        reviewedBy: currentUser?.email || 'admin',
      });

      setProperties((prev) =>
        prev.map((p) =>
          p.id === rejectingProperty.id
            ? { ...p, status: 'rejected', rejectionReason: reason, reviewedAt: now, reviewedBy: currentUser?.email || 'admin' }
            : p
        )
      );

      setActionSuccessMsg(
        isRtl
          ? `تم رفض طلب عقار "${rejectingProperty.name}" وتسجيل السبب`
          : `Property "${rejectingProperty.name}" rejected.`
      );
      setTimeout(() => setActionSuccessMsg(null), 4000);
      setRejectingProperty(null);
      setRejectionReason('');
      if (selectedProperty?.id === rejectingProperty.id) {
        setSelectedProperty((prev) => (prev ? { ...prev, status: 'rejected', rejectionReason: reason } : null));
      }
    } catch (err) {
      console.error('Error rejecting property on Supabase:', err);
      alert(isRtl ? 'حدث خطأ أثناء رفض العقار' : 'Failed to reject property');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Reject Deletion Request: Admin decides to keep property active/pending
  const handleRejectDeletionRequest = async (prop: Property) => {
    if (!prop.id) return;
    setIsProcessingAction(true);
    try {
      const now = new Date().toISOString();
      const targetStatus = prop.previousStatus || (prop.reviewedAt ? 'active' : 'pending_approval');
      await safeUpdateProperty(prop.id, {
        status: targetStatus,
        currentDescription: prop.description,
        deletionReason: null,
        deletionRequestedAt: null,
        deletionRequestedBy: null,
        reviewerNotes: isRtl ? 'تم رفض طلب الحذف من قِبل الإدارة وإبقاء العقار' : 'Deletion request rejected by admin, property preserved',
        reviewedAt: now,
        reviewedBy: currentUser?.email || 'admin',
      });

      setProperties((prev) =>
        prev.map((p) =>
          p.id === prop.id
            ? { ...p, status: targetStatus, deletionReason: undefined, deletionRequestedAt: undefined }
            : p
        )
      );

      setActionSuccessMsg(
        isRtl
          ? `تم رفض طلب الحذف وإعادة عقار "${prop.name}" بنجاح.`
          : `Deletion request rejected. "${prop.name}" restored.`
      );
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error rejecting deletion request:', err);
      alert(isRtl ? 'حدث خطأ أثناء معالجة الطلب' : 'Failed to reject deletion request');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Permanently delete property from Supabase when approved by admin
  const handleConfirmPermanentDelete = async () => {
    if (!propertyToDeletePermanently?.id) return;
    setIsProcessingAction(true);
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyToDeletePermanently.id);

      if (error) throw error;

      setProperties((prev) => prev.filter((p) => p.id !== propertyToDeletePermanently.id));
      await fetchDbCounts();

      setActionSuccessMsg(
        isRtl
          ? `تمت الموافقة وحذف عقار "${propertyToDeletePermanently.name}" نهائياً من قاعدة البيانات.`
          : `Property "${propertyToDeletePermanently.name}" deleted permanently.`
      );
      setTimeout(() => setActionSuccessMsg(null), 4000);
      setPropertyToDeletePermanently(null);
    } catch (err) {
      console.error('Error permanently deleting property on Supabase:', err);
      alert(isRtl ? 'حدث خطأ أثناء حذف العقار نهائياً' : 'Failed to delete property permanently');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Type labels
  const getPropertyTypeLabel = (type: PropertyType) => {
    const labels: Record<PropertyType, { ar: string; en: string }> = {
      hotel: { ar: 'فندق', en: 'Hotel' },
      building: { ar: 'عمارة سكنية', en: 'Building' },
      apartments: { ar: 'شقق مفروشة', en: 'Furnished Apts' },
      villa: { ar: 'فيلا مستقلة', en: 'Villa' },
      resort: { ar: 'منتجع / شاليه', en: 'Resort' },
      compound: { ar: 'مجمع سكني', en: 'Compound' },
    };
    return isRtl ? labels[type]?.ar || type : labels[type]?.en || type;
  };

  const amenityLabels: Record<string, { ar: string; en: string }> = {
    pool: { ar: 'مسبح', en: 'Pool' },
    wifi: { ar: 'واي فاي', en: 'Wi-Fi' },
    parking: { ar: 'موقف سيارات', en: 'Parking' },
    kitchen: { ar: 'مطبخ مجهز', en: 'Kitchen' },
    outdoor: { ar: 'جلسات خارجية', en: 'Outdoor Seating' },
    cameras: { ar: 'كاميرات مراقبة', en: 'Surveillance' },
  };

  // Extract unique cities list
  const citiesList = useMemo(() => {
    const citySet = new Set<string>();
    properties.forEach((p) => {
      if (p.city && p.city.trim()) {
        citySet.add(p.city.trim());
      }
    });
    return Array.from(citySet).sort((a, b) => a.localeCompare(b, isRtl ? 'ar' : 'en'));
  }, [properties, isRtl]);

  // City-wise statistics for current tab
  const cityStats = useMemo(() => {
    const map: Record<string, { total: number; inCurrentTab: number; pending: number; active: number }> = {};
    properties.forEach((p) => {
      const c = p.city?.trim() || (isRtl ? 'مدينة غير محددة' : 'Unspecified');
      if (!map[c]) {
        map[c] = { total: 0, inCurrentTab: 0, pending: 0, active: 0 };
      }
      map[c].total += 1;
      if (p.status === 'pending_approval') map[c].pending += 1;
      if (p.status === 'active') map[c].active += 1;

      // Check current tab match
      let matchesTab = true;
      if (selectedTab === 'pending' && p.status !== 'pending_approval') matchesTab = false;
      if (selectedTab === 'active' && p.status !== 'active') matchesTab = false;
      if (selectedTab === 'deletion_requests' && p.status !== 'deletion_requested') matchesTab = false;
      if (selectedTab === 'rejected' && p.status !== 'rejected') matchesTab = false;

      if (matchesTab) {
        map[c].inCurrentTab += 1;
      }
    });
    return map;
  }, [properties, selectedTab, isRtl]);

  // Filter & Sort properties
  const filteredProperties = useMemo(() => {
    const list = properties.filter((p) => {
      // Tab filter
      if (selectedTab === 'pending' && p.status !== 'pending_approval') return false;
      if (selectedTab === 'active' && p.status !== 'active') return false;
      if (selectedTab === 'deletion_requests' && p.status !== 'deletion_requested') return false;
      if (selectedTab === 'rejected' && p.status !== 'rejected') return false;

      // City filter
      if (selectedCity !== 'all') {
        const pCity = p.city?.trim() || (isRtl ? 'مدينة غير محددة' : 'Unspecified');
        if (pCity !== selectedCity) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = p.name?.toLowerCase().includes(q);
        const cityMatch = p.city?.toLowerCase().includes(q);
        const districtMatch = p.district?.toLowerCase().includes(q);
        const phoneMatch = p.contactPhone?.toLowerCase().includes(q);
        const ownerMatch = p.ownerId?.toLowerCase().includes(q);
        return nameMatch || cityMatch || districtMatch || phoneMatch || ownerMatch;
      }

      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'oldest') {
        const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
        return dateA - dateB;
      }
      if (sortBy === 'city') {
        return (a.city || '').localeCompare(b.city || '', isRtl ? 'ar' : 'en');
      }
      if (sortBy === 'rooms_desc') {
        return (Number(b.roomsCount) || 0) - (Number(a.roomsCount) || 0);
      }
      if (sortBy === 'rooms_asc') {
        return (Number(a.roomsCount) || 0) - (Number(b.roomsCount) || 0);
      }
      return 0;
    });
  }, [properties, selectedTab, selectedCity, searchQuery, sortBy, isRtl]);

  // Group filtered properties by city for categorized view
  const propertiesGroupedByCity = useMemo(() => {
    const groups: Record<string, Property[]> = {};
    filteredProperties.forEach((p) => {
      const cityName = p.city?.trim() || (isRtl ? 'مدينة غير محددة' : 'Unspecified City');
      if (!groups[cityName]) {
        groups[cityName] = [];
      }
      groups[cityName].push(p);
    });
    return groups;
  }, [filteredProperties, isRtl]);

  const toggleCityCollapse = (cityName: string) => {
    setCollapsedCities((prev) => ({
      ...prev,
      [cityName]: !prev[cityName]
    }));
  };

  // Counts
  const counts = useMemo(() => {
    return {
      pending: properties.filter((p) => p.status === 'pending_approval').length,
      active: properties.filter((p) => p.status === 'active').length,
      deletionRequests: properties.filter((p) => p.status === 'deletion_requested').length,
      rejected: properties.filter((p) => p.status === 'rejected').length,
      all: properties.length,
    };
  }, [properties]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderPropertyCard = (p: Property) => {
    const isPending = p.status === 'pending_approval';
    const isRejected = p.status === 'rejected';
    const isActive = p.status === 'active';
    const isDeletionRequested = p.status === 'deletion_requested';

    return (
      <div
        key={p.id}
        className={`rounded-2xl border p-5 transition-all flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md ${
          isDeletionRequested
            ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-400/40'
            : isPending
            ? 'bg-amber-50/40 border-amber-200 ring-1 ring-amber-300/40'
            : isRejected
            ? 'bg-red-50/30 border-red-200'
            : 'bg-white border-slate-200'
        }`}
      >
        <div>
          {/* Top Status & Review Notice */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
              isDeletionRequested
                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                : isPending
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : isActive
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : isRejected
                ? 'bg-red-100 text-red-900 border border-red-300'
                : 'bg-slate-100 text-slate-800 border border-slate-300'
            }`}>
              {isDeletionRequested && <Trash2 size={12} className="text-rose-700 animate-pulse" />}
              {isPending && <Clock size={12} className="text-amber-700 animate-pulse" />}
              {isActive && <CheckCircle2 size={12} className="text-emerald-700" />}
              {isRejected && <XCircle size={12} className="text-red-700" />}
              <span>
                {isDeletionRequested && (isRtl ? 'طلب حذف من المالك' : 'Deletion Requested by Owner')}
                {isPending && (isRtl ? 'بانتظار المراجعة (1-3 أيام)' : 'Pending Review')}
                {isActive && (isRtl ? 'معتمد ونشط' : 'Approved & Active')}
                {isRejected && (isRtl ? 'مرفوض' : 'Rejected')}
                {p.status === 'maintenance' && (isRtl ? 'تحت الصيانة' : 'Maintenance')}
                {p.status === 'inactive' && (isRtl ? 'غير نشط' : 'Inactive')}
              </span>
            </span>

            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              {getPropertyTypeLabel(p.type)}
            </span>
          </div>

          {/* Cover Image & Gallery Count */}
          {p.coverImage ? (
            <div 
              onClick={() => {
                const allImgs = [p.coverImage!, ...(p.images || [])];
                setGalleryModalImages(allImgs);
                setActiveImageIndex(0);
              }}
              className="relative w-full h-40 rounded-xl overflow-hidden mb-3.5 border border-slate-200 cursor-pointer group bg-slate-100"
            >
              <img 
                src={p.coverImage} 
                alt={p.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="bg-white/90 text-[#0B1B3D] text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                  <Eye size={14} />
                  <span>{isRtl ? 'تكبير واستعراض الصور' : 'View Gallery'}</span>
                </span>
              </div>
              {p.images && p.images.length > 0 && (
                <span className="absolute bottom-2 left-2 bg-[#0B1B3D]/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ImageIcon size={11} />
                  <span>+{p.images.length} صور</span>
                </span>
              )}
            </div>
          ) : (
            <div className="w-full h-24 rounded-xl bg-slate-100 border border-slate-200 border-dashed mb-3.5 flex items-center justify-center text-slate-400 gap-1.5 text-xs font-bold">
              <ImageIcon size={16} />
              <span>{isRtl ? 'لا توجد صورة غلاف مرفقة' : 'No cover image'}</span>
            </div>
          )}

          {/* Property Title & Location */}
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#0B1B3D] tracking-tight">{p.name}</h3>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <MapPin size={13} className="text-slate-400 shrink-0" />
              <span>{p.city} - {p.district}</span>
            </div>
            {p.address && (
              <p className="text-[11px] text-slate-500 line-clamp-1">{p.address}</p>
            )}
          </div>

          {/* Property Metrics */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/80 text-center">
            <div className="bg-slate-100/70 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-bold">{isRtl ? 'الغرف' : 'Rooms'}</span>
              <span className="text-xs font-black text-[#0B1B3D]">{p.roomsCount || 0}</span>
            </div>
            <div className="bg-slate-100/70 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-bold">{isRtl ? 'الطوابق' : 'Floors'}</span>
              <span className="text-xs font-black text-[#0B1B3D]">{p.floorsCount || 1}</span>
            </div>
            <div className="bg-slate-100/70 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-bold">{isRtl ? 'أقفال ذكية' : 'Smart Lock'}</span>
              <span className={`text-xs font-black ${p.smartLocksEnabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                {p.smartLocksEnabled ? (isRtl ? 'نعم' : 'Yes') : (isRtl ? 'لا' : 'No')}
              </span>
            </div>
          </div>

          {/* Contract & Lease */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {p.contractDuration && (
              <span className="text-[10px] font-bold text-[#0B1B3D] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                <FileText size={11} className="text-amber-600" />
                <span>{isRtl ? 'عقد:' : 'Contract:'}</span>
                <span className="font-black">
                  {p.contractDuration === '3_months' && (isRtl ? '3 أشهر' : '3 Mo')}
                  {p.contractDuration === '6_months' && (isRtl ? '6 أشهر' : '6 Mo')}
                  {p.contractDuration === '1_year' && (isRtl ? 'سنة واحدة' : '1 Yr')}
                </span>
              </span>
            )}

            {p.leaseType && (
              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {p.leaseType === 'daily' ? (isRtl ? 'تأجير يومي' : 'Daily') : (isRtl ? 'شهري/سنوي' : 'Monthly')}
              </span>
            )}
          </div>

          {/* Amenities chips */}
          {p.amenities && p.amenities.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400">{isRtl ? 'المرافق:' : 'Amenities:'}</span>
              {p.amenities.map((aId) => (
                <span key={aId} className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                  {isRtl ? amenityLabels[aId]?.ar || aId : amenityLabels[aId]?.en || aId}
                </span>
              ))}
            </div>
          )}

          {/* Owner Contact Phone with Direct Links */}
          {p.contactPhone && (
            <div className="mt-3 p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-500" />
                <span className="text-xs font-black text-slate-800" dir="ltr">{p.contactPhone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={`https://wa.me/${p.contactPhone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all"
                >
                  واتساب
                </a>
                <a
                  href={`tel:${p.contactPhone}`}
                  className="px-2 py-1 bg-[#0B1B3D] hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg transition-all"
                >
                  اتصال
                </a>
              </div>
            </div>
          )}

          {/* Deletion Request Box if requested */}
          {isDeletionRequested && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-950 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-rose-900">
                <AlertCircle size={14} className="text-rose-600 shrink-0" />
                <span>{isRtl ? 'طلب حذف العقار نهائياً من المالك' : 'Owner Requested Property Deletion'}</span>
              </div>
              {p.deletionReason ? (
                <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-rose-100 leading-relaxed font-medium">
                  <span className="text-rose-900 font-black block mb-0.5">{isRtl ? 'سبب الحذف المقدم من المالك:' : 'Deletion Reason:'}</span>
                  {p.deletionReason}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic bg-white/60 p-2 rounded-lg">
                  {isRtl ? 'لم يذكر المالك سبباً محدداً' : 'No specific reason provided'}
                </div>
              )}
              <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-rose-200/60">
                <span>
                  {isRtl ? 'تاريخ الطلب: ' : 'Requested: '}
                  {p.deletionRequestedAt ? new Date(p.deletionRequestedAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : (isRtl ? 'مؤخراً' : 'Recently')}
                </span>
                <span className="font-black text-rose-700">
                  {isRtl ? '⚠️ يُرجى التحقق قبل الحذف' : '⚠️ Please verify before deleting'}
                </span>
              </div>
            </div>
          )}

          {/* Rejection Reason Display if rejected */}
          {isRejected && p.rejectionReason && (
            <div className="mt-3 p-3 rounded-xl bg-red-100/70 border border-red-300 text-red-900 space-y-1">
              <div className="flex items-center gap-1 text-xs font-black text-red-800">
                <AlertCircle size={14} />
                <span>{isRtl ? 'سبب الرفض المسجل:' : 'Rejection Reason:'}</span>
              </div>
              <p className="text-xs font-semibold text-red-900 leading-relaxed">{p.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Primary Room Operations Button */}
        <div className="pt-2">
          <button
            onClick={() => navigate(`/admin/property/${p.id}/rooms`)}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-[#0B1B3D] to-slate-800 hover:from-slate-900 hover:to-[#0B1B3D] text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-xs hover:shadow-md cursor-pointer border border-slate-700/50"
          >
            <KeyRound size={15} className="text-amber-400" />
            <span>
              {isRtl
                ? `تشغيل وإدارة الغرف (${p.roomsCount || 10} غرف) 🔑`
                : `Manage Rooms (${p.roomsCount || 10})`}
            </span>
          </button>
        </div>

        {/* Actions Row */}
        <div className="pt-3 border-t border-slate-200/80 flex items-center gap-2">
          {isDeletionRequested ? (
            <>
              {/* Approve Deletion and Delete Permanently */}
              <button
                onClick={() => setPropertyToDeletePermanently(p)}
                disabled={isProcessingAction}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 size={15} />
                <span>{isRtl ? 'الموافقة والحذف النهائي' : 'Approve & Delete'}</span>
              </button>

              {/* Reject Deletion Request and keep property active */}
              <button
                onClick={() => handleRejectDeletionRequest(p)}
                disabled={isProcessingAction}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                title={isRtl ? 'رفض طلب الحذف وإعادة العقار للخدمة' : 'Reject request and keep active'}
              >
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>{isRtl ? 'رفض الطلب (إبقاء)' : 'Keep Active'}</span>
              </button>
            </>
          ) : isPending ? (
            <>
              {/* Approve Button */}
              <button
                onClick={() => handleApproveProperty(p)}
                disabled={isProcessingAction}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>{isRtl ? 'قبول واعتماد العقار' : 'Approve Property'}</span>
              </button>

              {/* Reject Button */}
              <button
                onClick={() => {
                  setRejectingProperty(p);
                  setRejectionReason('');
                }}
                disabled={isProcessingAction}
                className="py-2.5 px-3 bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <XCircle size={15} />
                <span>{isRtl ? 'رفض' : 'Reject'}</span>
              </button>
            </>
          ) : isRejected ? (
            <>
              {/* Re-Approve Option for rejected */}
              <button
                onClick={() => handleApproveProperty(p)}
                disabled={isProcessingAction}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-[#0B1B3D] text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>{isRtl ? 'إعادة اعتماد وتفعيل' : 'Re-Approve'}</span>
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>{isRtl ? 'عقار معتمد ومتاح' : 'Approved & Active'}</span>
              </span>
              <button
                onClick={() => {
                  setRejectingProperty(p);
                  setRejectionReason('');
                }}
                className="text-[11px] text-red-600 hover:text-red-800 underline font-bold cursor-pointer"
              >
                {isRtl ? 'تعطيل' : 'Deactivate'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Admin Navigation Header */}
      <header className="bg-[#0B1B3D] text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {isRtl ? 'بوابة الإدارة والتحقق' : 'Admin Operations Portal'}
                </h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                  {isRtl ? 'صلاحيات المدير' : 'ADMIN'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {isRtl ? 'مراجعة واعتماد طلبات تسجيل العقارات' : 'Review and approve registered property requests'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* User details badge */}
            <div className="hidden md:flex items-center gap-2 bg-slate-900/60 border border-slate-700/60 px-3 py-1.5 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-xs font-semibold text-slate-300">
                {currentUser?.email || userProfile?.fullName || 'Admin'}
              </span>
            </div>

            {/* Back to Home button */}
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700/50"
              title={isRtl ? 'الرئيسية' : 'Home'}
            >
              <Home size={15} />
              <span className="hidden sm:inline">{isRtl ? 'الرئيسية' : 'Home'}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchProperties}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer border border-slate-700/50"
              title={isRtl ? 'تحديث البيانات' : 'Refresh'}
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin text-amber-400' : ''} />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">{isRtl ? 'تسجيل الخروج' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Top Feature Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          <button
            onClick={() => setActiveMainSection('properties')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeMainSection === 'properties'
                ? 'bg-[#0B1B3D] text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 size={16} />
            <span>{isRtl ? 'طلبات واعتماد العقارات' : 'Property Approvals'}</span>
            <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
              {counts.pending}
            </span>
          </button>

          <button
            onClick={() => setActiveMainSection('db_reset')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeMainSection === 'db_reset'
                ? 'bg-rose-700 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Trash2 size={16} className="text-rose-500" />
            <span>{isRtl ? 'تفريغ وتصفير قاعدة البيانات' : 'Purge & Reset Database'}</span>
            <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-[10px] font-black">
              {dbCounts.users} {isRtl ? 'حساب' : 'users'}
            </span>
          </button>

          <button
            onClick={() => setActiveMainSection('otp_hub')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeMainSection === 'otp_hub'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Mail size={16} />
            <span>{isRtl ? 'تصميم رسالة OTP والتحقق' : 'OTP & Email Template'}</span>
          </button>

          <button
            onClick={() => setActiveMainSection('admins')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeMainSection === 'admins'
                ? 'bg-indigo-700 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserPlus size={16} />
            <span>{isRtl ? 'إضافة وإدارة المشرفين' : 'Co-Admins Access'}</span>
          </button>
        </div>

        {/* Success Alert Banner */}
        {actionSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <span className="text-sm font-bold">{actionSuccessMsg}</span>
            </div>
            <button 
              onClick={() => setActionSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100/50 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: DATABASE PURGE & RESET FOR FRESH START */}
        {/* ========================================================================= */}
        {activeMainSection === 'db_reset' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Warning Box */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Database size={26} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      {isRtl ? 'تفريغ وتصفير قاعدة البيانات للبدء من جديد' : 'Clear & Reset Database for Fresh Start'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {isRtl ? 'حذف كافة الحسابات التجريبية والبريد المسجل مع حماية حساب الإدارة' : 'Delete all test registrations and accounts with super admin preservation'}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-emerald-800 text-xs font-bold">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>{isRtl ? 'حساب الإدارة محمي: ' : 'Protected Admin: '}</span>
                  <span className="font-mono text-emerald-950 font-black">hadi185018@gmail.com</span>
                </div>
              </div>

              {/* Current Records Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">{isRtl ? 'المستخدمين (Users)' : 'Users'}</span>
                  <span className="text-xl font-black text-slate-900">{dbCounts.users}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">{isRtl ? 'المستأجرين (Tenants)' : 'Tenants'}</span>
                  <span className="text-xl font-black text-slate-900">{dbCounts.tenants}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">{isRtl ? 'الملاك (Owners)' : 'Owners'}</span>
                  <span className="text-xl font-black text-slate-900">{dbCounts.owners}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">{isRtl ? 'مزودي النظافة (Cleaners)' : 'Cleaners'}</span>
                  <span className="text-xl font-black text-slate-900">{dbCounts.cleaners}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">{isRtl ? 'رموز OTP النشطة' : 'OTP Records'}</span>
                  <span className="text-xl font-black text-slate-900">{dbCounts.verifications}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">{isRtl ? 'العقارات المسجلة' : 'Properties'}</span>
                  <span className="text-xl font-black text-slate-900">{dbCounts.properties}</span>
                </div>
              </div>

              {/* Warning box */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-amber-950">
                  <ShieldAlert size={18} className="text-amber-700 shrink-0" />
                  <span>{isRtl ? 'تنبيه أمني وإرشادات عملية التصفير:' : 'Safety Notice & Purge Instructions:'}</span>
                </div>
                <ul className="text-xs font-semibold text-amber-900 list-disc list-inside space-y-1">
                  <li>{isRtl ? 'سيتم مسح وتفريغ جميع سجلات الإيميلات والحسابات من جداول users و tenants و owners و cleaners.' : 'All user records will be deleted across users, tenants, owners, and cleaners collections.'}</li>
                  <li>{isRtl ? 'حساب الأدمن الرئيسي (hadi185018@gmail.com) لن يتم مسحه وسيظل مسجلاً بكامل صلاحياته.' : 'Super Admin account (hadi185018@gmail.com) will be preserved safely.'}</li>
                  <li>{isRtl ? 'بعد التصفير، يمكنك بدء عملية التسجيل والتحقق من الصفر بنظام OTP الجديد.' : 'After purging, you can start testing user registration from scratch with the new OTP flow.'}</li>
                </ul>
              </div>

              {/* Trigger Purge Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={purgeAlsoProperties}
                    onChange={(e) => setPurgeAlsoProperties(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <span>{isRtl ? 'مسح العقارات التجريبية المسجلة أيضاً' : 'Also delete test properties'}</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowPurgeConfirmModal(true)}
                  className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>{isRtl ? 'تفريغ وتصفير قاعدة البيانات الآن' : 'Execute Database Purge Now'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: OTP HUB & EMAIL TEMPLATE DESIGN */}
        {/* ========================================================================= */}
        {activeMainSection === 'otp_hub' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Mail size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      {isRtl ? 'تصميم وهوية رسالة رمز التحقق (Email OTP Template)' : 'Branded OTP Email Template'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {isRtl ? 'معاينة الرسالة الملكية الفاخرة المعتمدة باسم SMART HOSPITALITY' : 'Live luxury branded email for SMART HOSPITALITY'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySupabaseHtml}
                    className="px-3.5 py-2 bg-[#0B1B3D] hover:bg-[#152C5B] text-[#F1D28B] border border-[#F1D28B]/40 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    {copiedSupabaseHtml ? <Check size={14} className="text-emerald-400" /> : <Sparkles size={14} className="text-amber-400" />}
                    <span>{copiedSupabaseHtml ? (isRtl ? 'تم نسخ قالب Supabase!' : 'Supabase Template Copied!') : (isRtl ? 'نسخ قالب Supabase الرسمي (OTP Code)' : 'Copy Supabase OTP Template')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyHtmlTemplate}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedHtml ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedHtml ? (isRtl ? 'تم نسخ كود HTML' : 'Copied HTML!') : (isRtl ? 'نسخ كود HTML للقالب' : 'Copy HTML')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateNewOtpTest}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <RefreshCw size={14} />
                    <span>{isRtl ? 'توليد رمز تجريبي جديد' : 'Generate New Code'}</span>
                  </button>
                </div>
              </div>

              {/* Supabase Email Setup Guide Banner */}
              <div className="bg-gradient-to-r from-amber-50 via-blue-50/40 to-amber-50 border border-amber-300/80 p-5 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0B1B3D] text-[#F1D28B] flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      ⚡ OTP
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        {isRtl ? 'كيفية تفعيل إرسال الرمز المكون من 6 أرقام وقالب المنظومة في بريدك؟' : 'How to activate 6-digit OTP code & SMART HOSPITALITY design in Supabase'}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {isRtl ? 'تغيير قالب Supabase الافتراضي (الذي يرسل رابطاً) إلى قالب المنظومة الفاخر الذي يعرض الرمز الرقمي الواضح.' : 'Change Supabase default link template to the luxury branded 6-digit OTP card.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySupabaseHtml}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm shrink-0"
                  >
                    {copiedSupabaseHtml ? <Check size={15} /> : <Copy size={15} />}
                    <span>{copiedSupabaseHtml ? (isRtl ? 'تم النسخ بنجاح!' : 'Copied!') : (isRtl ? 'نسخ كود القالب لـ Supabase' : 'Copy Template for Supabase')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/70 text-[11px] text-slate-700 font-medium">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                    <strong className="text-[#0B1B3D] block mb-1">1. التوجه لـ Supabase:</strong>
                    افتح مشروعك في Supabase Dashboard واضغط على قائمة <span className="font-bold text-blue-700">Authentication</span> ثم <span className="font-bold text-blue-700">Email Templates</span>.
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                    <strong className="text-[#0B1B3D] block mb-1">2. اختيار القالب:</strong>
                    اختر <span className="font-bold text-blue-700">Confirm signup</span> (أو <span className="font-bold text-blue-700">Magic Link</span>) وقم بمسح الكود الافتراضي.
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                    <strong className="text-[#0B1B3D] block mb-1">3. اللصق والحفظ:</strong>
                    الصق الكود المنسوخ (يحتوي على <code className="font-mono bg-slate-100 px-1 rounded text-amber-700">{'{{ .Token }}'}</code>) واضغط <span className="font-bold text-emerald-700">Save Changes</span>.
                  </div>
                </div>
              </div>

              {/* Testing Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">{isRtl ? 'اسم المستلم في الرسالة:' : 'Recipient Name:'}</label>
                  <input
                    type="text"
                    value={otpTestName}
                    onChange={(e) => setOtpTestName(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">{isRtl ? 'البريد الإلكتروني للوجهة:' : 'Destination Email:'}</label>
                  <input
                    type="email"
                    value={otpTestEmail}
                    onChange={(e) => setOtpTestEmail(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono"
                    dir="ltr"
                    placeholder="example@yahoo.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">{isRtl ? 'رمز التحقق (OTP):' : 'OTP Code:'}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={otpTestCode}
                      onChange={(e) => setOtpTestCode(e.target.value.slice(0, 6))}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-[#0B1B3D] tracking-widest text-center font-mono"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={handleCopyOtpCode}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:text-slate-900 cursor-pointer"
                      title="نسخ الرمز"
                    >
                      {copiedCode ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Bar with Real Dispatch Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-blue-50/70 border border-blue-200 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-950">
                      {isRtl ? `إرسال رسالة OTP تجريبية إلى (${otpTestEmail})` : `Send live OTP test email to (${otpTestEmail})`}
                    </p>
                    <p className="text-[11px] text-blue-700 font-medium">
                      {isRtl ? 'يتم توليد الرمز وحفظه مشفراً في Supabase وإرسال الرسالة فوراً عبر خادم البريد' : 'Generates OTP, stores hash in Supabase, and dispatches email'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendRealTestEmail}
                  disabled={isSendingTestEmail}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#0B1B3D] hover:bg-[#152C5B] text-[#F1D28B] hover:text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-60 shrink-0"
                >
                  {isSendingTestEmail ? (
                    <>
                      <RefreshCw size={14} className="animate-spin text-amber-300" />
                      <span>{isRtl ? 'جارِ الإرسال...' : 'Sending Email...'}</span>
                    </>
                  ) : (
                    <>
                      <Mail size={15} className="text-amber-300" />
                      <span>{isRtl ? `إرسال الرمز الآن إلى ${otpTestEmail}` : `Send Test OTP to ${otpTestEmail}`}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Real Email Send Notification Banner */}
              {sendTestEmailResult && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-start gap-3 border ${
                  sendTestEmailResult.success 
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                    : 'bg-red-50 text-red-900 border-red-300'
                }`}>
                  {sendTestEmailResult.success ? (
                    <Check size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p>{sendTestEmailResult.message}</p>
                    {sendTestEmailResult.provider && (
                      <p className="text-[11px] font-normal opacity-80 mt-1">
                        الناقل: {sendTestEmailResult.provider} • البريد المستهدف: {otpTestEmail}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Live Rendered HTML iframe */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-slate-100 p-2">
                <iframe
                  title="Branded Email Preview"
                  srcDoc={getOTPEmailHTML(otpTestName, otpTestCode)}
                  className="w-full h-[580px] bg-white rounded-xl border-0"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: CO-ADMINS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeMainSection === 'admins' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Users size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {isRtl ? 'إدارة المشرفين وصلاحيات لوحة التحكم' : 'Co-Admins Access Control'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isRtl ? 'تعيين وترقية حسابات المشرفين الإضافيين لمنحهم صلاحيات الإدارة والمراجعة' : 'Grant admin permissions to additional team members'}
                  </p>
                </div>
              </div>

              {/* How-to Guide */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 text-indigo-950 space-y-2">
                <h4 className="text-xs sm:text-sm font-black flex items-center gap-2">
                  <ShieldCheck size={16} className="text-indigo-700" />
                  <span>{isRtl ? 'كيفية إضافة مدير جديد معك في المنصة:' : 'How to add a new co-admin:'}</span>
                </h4>
                <ol className="text-xs font-semibold text-indigo-900 list-decimal list-inside space-y-1.5">
                  <li>{isRtl ? 'اطلب من الشخص التسجيل بحساب جديد في صفحة التسجيل (SignUp) بالبريد الإلكتروني وتأكيد رمز OTP.' : 'Ask the new member to register an account in the SignUp page and verify their OTP.'}</li>
                  <li>{isRtl ? 'أدخل بريده الإلكتروني في الحقل أدناه واضغط "ترقية الحساب إلى مدير (Admin)".' : 'Enter their registered email address below and click "Promote to Admin".'}</li>
                  <li>{isRtl ? 'سيتم فوراً تحويل حسابه إلى رتبة مدير مع كامل صلاحيات اعتماد العقارات وتصفير البيانات.' : 'Their role will immediately become Admin with full review & management permissions.'}</li>
                </ol>
              </div>

              {/* Promote Form */}
              <form onSubmit={handlePromoteAdmin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRtl ? 'البريد الإلكتروني للشخص المراد ترقيته إلى أدمن:' : 'Email address to promote to Admin:'}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="admin2@example.com"
                      className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      dir="ltr"
                    />
                    <button
                      type="submit"
                      disabled={isAddingAdmin || !newAdminEmail}
                      className="px-6 py-3 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isAddingAdmin ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" />
                          <span>{isRtl ? 'جارِ الترقية...' : 'Promoting...'}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={15} />
                          <span>{isRtl ? 'ترقية الحساب إلى مدير (Admin)' : 'Promote to Admin'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Status Message */}
                {adminAddStatus && (
                  <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    adminAddStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}>
                    {adminAddStatus.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <AlertCircle size={16} className="text-rose-600 shrink-0" />}
                    <span>{adminAddStatus.message}</span>
                  </div>
                )}
              </form>

              {/* Registered Platform Accounts Table */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-indigo-700" />
                    <h3 className="text-sm font-black text-slate-800">
                      {isRtl ? 'الحسابات المسجلة في المنصة وإدارتها المباشرة' : 'Registered Accounts & Direct Role Assignment'}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                      {platformUsers.length}
                    </span>
                  </div>
                  <button
                    onClick={fetchPlatformUsers}
                    disabled={isLoadingUsers}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1.5 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw size={13} className={isLoadingUsers ? 'animate-spin' : ''} />
                    <span>{isRtl ? 'تحديث القائمة' : 'Refresh'}</span>
                  </button>
                </div>

                {isLoadingUsers ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                    <RefreshCw size={20} className="animate-spin text-indigo-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">{isRtl ? 'جارِ تحميل الحسابات المسجلة...' : 'Loading accounts...'}</p>
                  </div>
                ) : platformUsers.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 font-medium">
                    {isRtl ? 'لا توجد حسابات مسجلة حالياً' : 'No registered accounts found'}
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                          <tr>
                            <th className="p-3">{isRtl ? 'المستخدم' : 'User'}</th>
                            <th className="p-3">{isRtl ? 'البريد الإلكتروني' : 'Email'}</th>
                            <th className="p-3">{isRtl ? 'الرتبة الحالية' : 'Current Role'}</th>
                            <th className="p-3 text-center">{isRtl ? 'الإجراء' : 'Action'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                          {platformUsers.map((u) => {
                            const isAdminUser = u.role === 'admin';
                            const isCurrentUser = currentUser?.email && u.email?.toLowerCase() === currentUser.email.toLowerCase();
                            const isModifying = modifyingUserId === u.id;

                            return (
                              <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="p-3 font-bold flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                    isAdminUser ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <span>{u.full_name || (isRtl ? 'مستخدم مسجل' : 'Registered User')}</span>
                                    {isCurrentUser && (
                                      <span className="ms-1.5 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                                        {isRtl ? 'أنت' : 'You'}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-[11px] text-slate-600" dir="ltr">
                                  {u.email}
                                </td>
                                <td className="p-3">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ${
                                    isAdminUser 
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                      : u.role === 'owner'
                                      ? 'bg-emerald-100 text-emerald-900'
                                      : u.role === 'cleaner'
                                      ? 'bg-cyan-100 text-cyan-900'
                                      : 'bg-blue-100 text-blue-900'
                                  }`}>
                                    {isAdminUser && <ShieldCheck size={12} className="text-amber-700" />}
                                    <span>
                                      {isAdminUser 
                                        ? (isRtl ? 'مدير (Admin)' : 'Admin')
                                        : u.role === 'owner' 
                                        ? (isRtl ? 'مالك عقار' : 'Owner')
                                        : u.role === 'cleaner' 
                                        ? (isRtl ? 'مزود نظافة' : 'Cleaner')
                                        : (isRtl ? 'نزيل' : 'Tenant')}
                                    </span>
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  {isCurrentUser ? (
                                    <span className="text-[11px] text-slate-400 font-bold">
                                      {isRtl ? 'حسابك الحالي' : 'Active Account'}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleToggleUserAdminRole(u)}
                                      disabled={isModifying}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                        isAdminUser
                                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                      }`}
                                    >
                                      {isModifying ? (
                                        <RefreshCw size={12} className="animate-spin" />
                                      ) : isAdminUser ? (
                                        <>
                                          <AlertCircle size={12} />
                                          <span>{isRtl ? 'إلغاء صفة المدير' : 'Revoke Admin'}</span>
                                        </>
                                      ) : (
                                        <>
                                          <ShieldCheck size={12} />
                                          <span>{isRtl ? 'ترقية إلى مدير' : 'Make Admin'}</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: PROPERTIES APPROVAL PIPELINE (ORIGINAL) */}
        {/* ========================================================================= */}
        {activeMainSection === 'properties' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Stats Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* Pending Card */}
              <div 
                onClick={() => setSelectedTab('pending')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedTab === 'pending'
                    ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/20 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-amber-800">
                    {isRtl ? 'بانتظار المراجعة' : 'Pending Review'}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                    <Clock size={16} className={counts.pending > 0 ? 'animate-pulse' : ''} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#0B1B3D]">{counts.pending}</span>
                  <span className="text-[11px] font-bold text-amber-700">
                    {isRtl ? 'طلب جديد' : 'new requests'}
                  </span>
                </div>
              </div>

              {/* Active Card */}
              <div 
                onClick={() => setSelectedTab('active')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedTab === 'active'
                    ? 'bg-emerald-500/10 border-emerald-400 ring-2 ring-emerald-400/20 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-emerald-800">
                    {isRtl ? 'معتمد ونشط' : 'Approved & Active'}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#0B1B3D]">{counts.active}</span>
                  <span className="text-[11px] font-bold text-emerald-700">
                    {isRtl ? 'عقار جاهز' : 'ready properties'}
                  </span>
                </div>
              </div>

              {/* Deletion Requests Card */}
              <div 
                onClick={() => setSelectedTab('deletion_requests')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedTab === 'deletion_requests'
                    ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/30 shadow-sm'
                    : counts.deletionRequests > 0
                    ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400'
                    : 'bg-white border-slate-200 hover:border-rose-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-rose-900">
                    {isRtl ? 'طلبات الحذف' : 'Deletion Requests'}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    counts.deletionRequests > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-rose-100 text-rose-700'
                  }`}>
                    <Trash2 size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-rose-950">{counts.deletionRequests}</span>
                  <span className="text-[11px] font-bold text-rose-700">
                    {isRtl ? 'طلب من المالك' : 'from owners'}
                  </span>
                </div>
              </div>

              {/* Rejected Card */}
              <div 
                onClick={() => setSelectedTab('rejected')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedTab === 'rejected'
                    ? 'bg-red-500/10 border-red-400 ring-2 ring-red-400/20 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-red-800">
                    {isRtl ? 'مرفوض / مستبعد' : 'Rejected'}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700">
                    <XCircle size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#0B1B3D]">{counts.rejected}</span>
                  <span className="text-[11px] font-bold text-red-700">
                    {isRtl ? 'طلب مرفوض' : 'rejected'}
                  </span>
                </div>
              </div>

              {/* All Card */}
              <div 
                onClick={() => setSelectedTab('all')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedTab === 'all'
                    ? 'bg-slate-200 border-slate-400 ring-2 ring-slate-400/20 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-700">
                    {isRtl ? 'إجمالي العقارات' : 'Total Properties'}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                    <Building2 size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#0B1B3D]">{counts.all}</span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {isRtl ? 'عقار بالنظام' : 'in database'}
                  </span>
                </div>
              </div>
            </div>

            {/* Urgent Deletion Requests Banner */}
            {counts.deletionRequests > 0 && (
              <div 
                onClick={() => setSelectedTab('deletion_requests')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer ${
                  selectedTab === 'deletion_requests'
                    ? 'bg-rose-100/90 border-rose-400 ring-2 ring-rose-400/30 shadow-xs'
                    : 'bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 border-rose-300 hover:border-rose-400 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                    <Trash2 size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-rose-950 text-sm sm:text-base">
                        {isRtl
                          ? `⚠️ تنبيه هام: يوجد (${counts.deletionRequests}) طلب حذف عقار بانتظار قرار الإدارة`
                          : `⚠️ Alert: (${counts.deletionRequests}) Property Deletion Request(s) Awaiting Admin Decision`}
                      </h4>
                      <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {isRtl ? 'إجراء عاجل' : 'Action Needed'}
                      </span>
                    </div>
                    <p className="text-xs text-rose-800 font-medium mt-0.5">
                      {isRtl
                        ? 'قام المالك بتقديم طلب لحذف وإلغاء إدراج العقار نهائياً. يمكنك مراجعة سبب الحذف والموافقة على الشطب أو رفض الطلب.'
                        : 'Owner has requested to permanently delete their property. Review reason to approve deletion or reject request.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTab('deletion_requests');
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
                >
                  <Trash2 size={14} />
                  <span>{isRtl ? 'عرض طلبات الحذف والبت فيها' : 'Review Deletion Requests'}</span>
                </button>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                <button
                  onClick={() => setSelectedTab('pending')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    selectedTab === 'pending'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock size={13} />
                  <span>{isRtl ? 'قيد المراجعة' : 'Pending'}</span>
                  <span className="bg-slate-950/20 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                    {counts.pending}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedTab('active')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    selectedTab === 'active'
                      ? 'bg-[#0B1B3D] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 size={13} />
                  <span>{isRtl ? 'المعتمدة' : 'Approved'}</span>
                  <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px] font-black">
                    {counts.active}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedTab('deletion_requests')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    selectedTab === 'deletion_requests'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Trash2 size={13} />
                  <span>{isRtl ? 'طلبات الحذف' : 'Deletion Requests'}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    counts.deletionRequests > 0 ? 'bg-white text-rose-700 animate-pulse' : 'bg-white/20 text-white'
                  }`}>
                    {counts.deletionRequests}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedTab('rejected')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    selectedTab === 'rejected'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <XCircle size={13} />
                  <span>{isRtl ? 'المرفوضة' : 'Rejected'}</span>
                  <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px] font-black">
                    {counts.rejected}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedTab('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    selectedTab === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{isRtl ? 'الكل' : 'All'}</span>
                  <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px] font-black">
                    {counts.all}
                  </span>
                </button>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isRtl ? 'بحث باسم العقار، المدينة، الهاتف...' : 'Search by name, city, phone...'}
                  className="w-full ps-9 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0B1B3D]/30 focus:border-[#0B1B3D]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* City Filter Pills Bar */}
            {citiesList.length > 0 && (
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-[#0B1B3D]">
                    <MapPin size={15} className="text-amber-500" />
                    <span>{isRtl ? 'فرز وتصفية العقارات حسب المدينة:' : 'Filter Properties by City:'}</span>
                  </div>
                  {selectedCity !== 'all' && (
                    <button
                      onClick={() => setSelectedCity('all')}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    >
                      {isRtl ? 'إلغاء فلتر المدينة' : 'Show All Cities'}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                  <button
                    onClick={() => setSelectedCity('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      selectedCity === 'all'
                        ? 'bg-[#0B1B3D] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{isRtl ? 'جميع المدن' : 'All Cities'}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedCity === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {properties.length}
                    </span>
                  </button>

                  {citiesList.map((cityName) => {
                    const stats = cityStats[cityName];
                    const isSelected = selectedCity === cityName;
                    const countInTab = stats?.inCurrentTab || 0;

                    return (
                      <button
                        key={cityName}
                        onClick={() => setSelectedCity(cityName)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-400/30'
                            : countInTab > 0
                            ? 'bg-slate-100 hover:bg-amber-50 hover:border-amber-200 border border-transparent text-slate-800'
                            : 'bg-slate-50 text-slate-400 opacity-60'
                        }`}
                      >
                        <MapPin size={12} className={isSelected ? 'text-slate-950' : 'text-slate-400'} />
                        <span>{cityName}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {countInTab}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* View Mode & Sort Controls Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              {/* Active Filter Summary */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 w-full sm:w-auto">
                <SlidersHorizontal size={14} className="text-slate-400" />
                <span>{isRtl ? 'عرض النتائج:' : 'Showing:'}</span>
                <span className="font-black text-[#0B1B3D]">
                  {filteredProperties.length} {isRtl ? 'عقار' : 'properties'}
                </span>
                {selectedCity !== 'all' && (
                  <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md text-[11px] font-bold border border-amber-300">
                    📍 {selectedCity}
                  </span>
                )}
              </div>

              {/* Sort Dropdown and View Mode Toggles */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-bold">
                  <ArrowUpDown size={13} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500 text-[11px] hidden sm:inline">{isRtl ? 'الترتيب:' : 'Sort:'}</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent border-0 font-black text-slate-800 text-xs focus:outline-hidden cursor-pointer"
                  >
                    <option value="newest">{isRtl ? 'الأحدث أولاً' : 'Newest'}</option>
                    <option value="oldest">{isRtl ? 'الأقدم أولاً' : 'Oldest'}</option>
                    <option value="city">{isRtl ? 'حسب المدينة (أ - ي)' : 'City (A - Z)'}</option>
                    <option value="rooms_desc">{isRtl ? 'عدد الغرف (الأكثر)' : 'Rooms (High to Low)'}</option>
                    <option value="rooms_asc">{isRtl ? 'عدد الغرف (الأقل)' : 'Rooms (Low to High)'}</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('grouped_by_city')}
                    title={isRtl ? 'تجميع وتصنيف حسب المدينة' : 'Group by City'}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewMode === 'grouped_by_city'
                        ? 'bg-white text-[#0B1B3D] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers size={13} />
                    <span className="hidden sm:inline">{isRtl ? 'تصنيف بالمدن' : 'Grouped'}</span>
                  </button>

                  <button
                    onClick={() => setViewMode('grid')}
                    title={isRtl ? 'عرض شبكي مباشر' : 'Flat Grid View'}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-white text-[#0B1B3D] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid size={13} />
                    <span className="hidden sm:inline">{isRtl ? 'شبكة' : 'Grid'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-3 border-[#0B1B3D] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-slate-700">
                  {isRtl ? 'جاري تحميل قائمة العقارات للتحقق والمراجعة...' : 'Loading properties for review...'}
                </p>
              </div>
            ) : filteredProperties.length === 0 ? (
              /* Empty State */
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Building2 size={28} />
                </div>
                <h3 className="text-base font-black text-slate-800">
                  {isRtl ? 'لا توجد عقارات مطابقة في هذا القسم حالياً' : 'No properties found in this section'}
                </h3>
                <p className="text-xs text-slate-500 font-medium max-w-sm">
                  {selectedTab === 'pending'
                    ? isRtl
                      ? 'رائع! لا توجد أي طلبات عقارات معلقة بانتظار المراجعة حالياً.'
                      : 'All caught up! No pending property review requests.'
                    : selectedTab === 'deletion_requests'
                    ? isRtl
                      ? 'ممتاز! لا توجد أي طلبات حذف عقارات معلقة من الملاك حالياً.'
                      : 'No property deletion requests pending review.'
                    : isRtl
                    ? 'جرب تغيير شروط البحث أو التبديل لمدينة أخرى أو تبويب آخر.'
                    : 'Try adjusting your search criteria or switching cities/tabs.'}
                </p>
                {(selectedCity !== 'all' || searchQuery.trim()) && (
                  <button
                    onClick={() => {
                      setSelectedCity('all');
                      setSearchQuery('');
                    }}
                    className="mt-2 px-4 py-2 bg-[#0B1B3D] text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    {isRtl ? 'إعادة ضبط الفلاتر وعرض الكل' : 'Reset Filters & Show All'}
                  </button>
                )}
              </div>
            ) : viewMode === 'grouped_by_city' && selectedCity === 'all' && Object.keys(propertiesGroupedByCity).length > 0 ? (
              /* Categorized by City Sections */
              <div className="space-y-6">
                {(Object.entries(propertiesGroupedByCity) as [string, Property[]][]).map(([cityName, cityProps]) => {
                  const isCollapsed = collapsedCities[cityName];
                  const pendingInCity = cityProps.filter(p => p.status === 'pending_approval').length;
                  const activeInCity = cityProps.filter(p => p.status === 'active').length;
                  const deletionInCity = cityProps.filter(p => p.status === 'deletion_requested').length;

                  return (
                    <div key={cityName} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                      {/* City Header Banner */}
                      <div 
                        onClick={() => toggleCityCollapse(cityName)}
                        className="p-4 bg-gradient-to-r from-slate-50 to-white hover:bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-800 shrink-0 font-black">
                            <MapPin size={20} className="text-amber-700" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-black text-[#0B1B3D]">{cityName}</h3>
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-xs font-black">
                                {cityProps.length} {isRtl ? 'عقار' : 'properties'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] font-bold text-slate-500">
                              {pendingInCity > 0 && (
                                <span className="text-amber-700 flex items-center gap-1">
                                  <Clock size={11} />
                                  <span>{pendingInCity} {isRtl ? 'بانتظار المراجعة' : 'pending'}</span>
                                </span>
                              )}
                              {activeInCity > 0 && (
                                <span className="text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 size={11} />
                                  <span>{activeInCity} {isRtl ? 'معتمد' : 'active'}</span>
                                </span>
                              )}
                              {deletionInCity > 0 && (
                                <span className="text-rose-700 flex items-center gap-1">
                                  <Trash2 size={11} />
                                  <span>{deletionInCity} {isRtl ? 'طلب حذف' : 'deletion'}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                            {isCollapsed ? (isRtl ? 'عرض العقارات' : 'Expand') : (isRtl ? 'طي القسم' : 'Collapse')}
                          </span>
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                          </div>
                        </div>
                      </div>

                      {/* City Properties Grid */}
                      {!isCollapsed && (
                        <div className="p-4 sm:p-5 bg-slate-50/40">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {cityProps.map(renderPropertyCard)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Flat Properties Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProperties.map(renderPropertyCard)}
              </div>
            )}
          </div>
        )}
      </main>
      {/* Reject Reason Modal */}
      {rejectingProperty && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 min-h-screen">
          <div className="fixed inset-0" onClick={() => setRejectingProperty(null)} />
          <div 
            className="relative z-10 bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 my-auto transition-all"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle size={22} />
                <h3 className="text-base font-black text-[#0B1B3D]">
                  {isRtl ? 'رفض طلب العقار' : 'Reject Property Request'}
                </h3>
              </div>
              <button
                onClick={() => setRejectingProperty(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-700">
                {isRtl
                  ? `أنت على وشك رفض طلب عقار "${rejectingProperty.name}". يرجى تحديد سبب الرفض ليظهر للمالك:`
                  : `You are rejecting "${rejectingProperty.name}". Please specify reason:`}
              </p>

              {/* Quick Reason Suggestions */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500">
                  {isRtl ? 'أسباب شائعة جاهزة:' : 'Common reasons:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'صور العقار غير واضحة أو غير كافية',
                    'بيانات العنوان والموقع غير دقيقة',
                    'مطلوب توثيق إضافي أو سجل تجاري ساري',
                    'تعارض في مواصفات الغرف أو العقد',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectionReason(preset)}
                      className="text-[11px] font-bold py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea for custom reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'نص سبب الرفض والملاحظات للمالك:' : 'Rejection explanation & notes:'}
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={isRtl ? 'اكتب ملاحظات توجيهية للمالك ليقوم بتعديلها...' : 'Write feedback notes for the owner...'}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessingAction}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <XCircle size={15} />
                <span>{isRtl ? 'تأكيد الرفض وإشعار المالك' : 'Confirm Rejection'}</span>
              </button>
              <button
                type="button"
                onClick={() => setRejectingProperty(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Deletion Confirmation Modal for Admin */}
      {propertyToDeletePermanently && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 min-h-screen">
          <div className="fixed inset-0" onClick={() => !isProcessingAction && setPropertyToDeletePermanently(null)} />
          <div 
            className="relative z-10 bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={26} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isRtl ? 'تأكيد الموافقة على حذف العقار نهائياً' : 'Approve & Permanently Delete Property'}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {isRtl
                  ? `هل أنت متأكد من رغبتك في اعتماد طلب الحذف لعقار "${propertyToDeletePermanently.name}"؟ سيتم حذف بيانات العقار وسجلاته بالكامل وبشكل نهائي من قاعدة البيانات.`
                  : `Are you sure you want to approve deletion for "${propertyToDeletePermanently.name}"? This will permanently delete the property record from the database.`}
              </p>
            </div>

            {propertyToDeletePermanently.deletionReason && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-start text-slate-700 leading-relaxed">
                <span className="text-rose-900 font-black block mb-1">
                  {isRtl ? 'سبب الحذف الموضح من المالك:' : 'Reason from Owner:'}
                </span>
                <p className="bg-white p-2 rounded-lg border border-slate-200 font-medium">
                  {propertyToDeletePermanently.deletionReason}
                </p>
              </div>
            )}

            <div className="flex gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={() => setPropertyToDeletePermanently(null)}
                disabled={isProcessingAction}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {isRtl ? 'تراجع' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                disabled={isProcessingAction}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessingAction ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span>{isRtl ? 'تأكيد الحذف النهائي' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Purge Safety Confirmation Modal */}
      {showPurgeConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 min-h-screen">
          <div className="fixed inset-0" onClick={() => !isPurging && setShowPurgeConfirmModal(false)} />
          <div className="relative z-10 bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-rose-100 space-y-5 my-auto">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {isRtl ? 'تأكيد تصفير وتفريغ قاعدة البيانات' : 'Confirm Database Purge'}
                </h3>
                <p className="text-xs text-rose-600 font-bold">
                  {isRtl ? 'إجراء حساس لا يمكن التراجع عنه' : 'Irreversible Action'}
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-rose-50/70 p-4 rounded-2xl border border-rose-200 text-xs text-rose-950 font-medium">
              <p>
                {isRtl 
                  ? 'سيتم حذف جميع سجلات المستخدمين والمستأجرين والملاك من Firestore للبدء بحسابات نظيفة ومحققة برمز OTP.'
                  : 'All user, tenant, and owner records in Firestore will be deleted.'}
              </p>
              <div className="p-2.5 bg-white rounded-xl border border-rose-200 font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>{isRtl ? 'حسابك الإداري محفوظ:' : 'Admin Preserved:'} <span className="font-mono text-xs">hadi185018@gmail.com</span></span>
              </div>
              {purgeAlsoProperties && (
                <p className="text-rose-700 font-bold">
                  ⚠️ {isRtl ? 'سيتم أيضاً حذف العقارات المسجلة التجريبية.' : 'Test properties will also be deleted.'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                {isRtl ? 'اكتب كلمة (تأكيد) للمتابعة:' : 'Type (confirm) to proceed:'}
              </label>
              <input
                type="text"
                value={purgeConfirmText}
                onChange={(e) => setPurgeConfirmText(e.target.value)}
                placeholder={isRtl ? 'تأكيد' : 'confirm'}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-center font-black text-sm tracking-wider focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleExecutePurge}
                disabled={isPurging || (purgeConfirmText !== 'تأكيد' && purgeConfirmText.toLowerCase() !== 'confirm')}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {isPurging ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>{isRtl ? 'جارِ تفريغ البيانات...' : 'Purging...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>{isRtl ? 'تأكيد المسح والتصفير' : 'Confirm Purge'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isPurging}
                onClick={() => setShowPurgeConfirmModal(false)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Lightbox Modal */}
      {galleryModalImages && galleryModalImages.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 min-h-screen">
          <div className="fixed inset-0" onClick={() => setGalleryModalImages(null)} />
          <div className="relative z-10 bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-4 sm:p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between text-white">
              <span className="text-xs font-bold text-slate-400">
                {isRtl ? `صورة ${activeImageIndex + 1} من ${galleryModalImages.length}` : `Image ${activeImageIndex + 1} of ${galleryModalImages.length}`}
              </span>
              <button
                onClick={() => setGalleryModalImages(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Preview Image */}
            <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
              <img 
                src={galleryModalImages[activeImageIndex]} 
                alt="Property gallery" 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Thumbnails list */}
            {galleryModalImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto p-1">
                {galleryModalImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeImageIndex === idx ? 'border-amber-400 scale-105' : 'border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
