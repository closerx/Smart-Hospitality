import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { auth as firebaseAuth, signInWithGoogleFirebase, signOutFirebase, onAuthStateChanged, FirebaseUser } from '../lib/firebase';
import { AnyUserProfile, BaseUser, UserRole } from '../types/auth';

// User type wrapper to support both Supabase properties (.id) and Firebase backwards-compatible (.uid)
export interface AuthUser {
  id: string;
  uid: string; // compatibility alias
  email?: string;
  phone?: string;
  phoneNumber?: string; // compatibility alias
  displayName?: string;
  emailVerified: boolean;
  user_metadata?: Record<string, any>;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  rawUser: SupabaseUser | null;
  userProfile: AnyUserProfile | null;
  role: UserRole | null;
  isAdmin: boolean;
  loading: boolean;
  isEmailVerified: boolean;
  signInWithGoogle: (preferredRole?: UserRole) => Promise<{ user: AuthUser; profile: AnyUserProfile }>;
  logout: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  setDirectSession: (user: AuthUser, profile: AnyUserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = 'smart_hosp_authenticated_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [rawUser, setRawUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<AnyUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Transform Supabase User into compatible AuthUser
  const wrapUser = (sbUser: SupabaseUser | null): AuthUser | null => {
    if (!sbUser) return null;
    const meta = sbUser.user_metadata || {};
    const name = meta.full_name || meta.fullName || meta.name || (sbUser.email ? sbUser.email.split('@')[0] : 'User');
    return {
      id: sbUser.id,
      uid: sbUser.id,
      email: sbUser.email || '',
      phone: sbUser.phone || meta.phone || '',
      phoneNumber: sbUser.phone || meta.phone || '',
      displayName: name,
      emailVerified: true, // Mark verified after OTP verification flow
      user_metadata: meta,
    };
  };

  const setDirectSession = (user: AuthUser, profile: AnyUserProfile) => {
    setCurrentUser(user);
    setUserProfile(profile);
    try {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ user, profile, savedAt: Date.now() }));
    } catch {}
  };

  // Fetch role-specific user profile from Supabase database
  const fetchUserProfile = async (sbUser: SupabaseUser) => {
    try {
      // 1. Fetch from unified users table
      let baseData: BaseUser | null = null;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', sbUser.id)
          .maybeSingle();

        if (data && !error) {
          baseData = {
            id: data.id,
            email: data.email || sbUser.email || '',
            fullName: data.fullName || data.full_name || sbUser.user_metadata?.fullName || sbUser.user_metadata?.full_name || '',
            phone: data.phone || sbUser.phone || '',
            role: data.role || sbUser.user_metadata?.role || 'tenant',
            isEmailVerified: true,
            createdAt: data.createdAt || data.created_at || new Date().toISOString(),
            updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
          };
        }
      } catch (e) {
        console.warn('Supabase users profile fetch notice:', e);
      }

      // If user profile record not in table yet, use metadata fallback
      if (!baseData) {
        const meta = sbUser.user_metadata || {};
        const fallbackName = meta.fullName || meta.full_name || meta.name || (sbUser.email ? sbUser.email.split('@')[0] : 'User');
        const assignedRole = meta.role || 'tenant';
        
        baseData = {
          id: sbUser.id,
          email: sbUser.email || '',
          fullName: fallbackName,
          phone: meta.phone || sbUser.phone || '',
          role: assignedRole,
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Persist to Supabase users table in background if possible
        try {
          await supabase.from('users').upsert({
            id: sbUser.id,
            email: sbUser.email?.toLowerCase(),
            fullName: fallbackName,
            phone: meta.phone || '',
            role: assignedRole,
            isEmailVerified: true,
          }, { onConflict: 'id' });
        } catch {}
      }

      const role = baseData.role;

      // 2. Fetch specific profile from the role's separate table
      let specificData: Record<string, any> | null = null;
      try {
        if (role === 'tenant') {
          const { data } = await supabase.from('tenants').select('*').eq('id', sbUser.id).maybeSingle();
          if (data) specificData = data;
        } else if (role === 'owner') {
          const { data } = await supabase.from('owners').select('*').eq('id', sbUser.id).maybeSingle();
          if (data) specificData = data;
        } else if (role === 'cleaner') {
          const { data } = await supabase.from('cleaners').select('*').eq('id', sbUser.id).maybeSingle();
          if (data) specificData = data;
        }
      } catch (e) {
        console.warn('Role table fetch notice:', e);
      }

      const resolvedName = specificData?.fullName || specificData?.full_name || baseData.fullName || (sbUser.email ? sbUser.email.split('@')[0] : 'User');

      const finalProfile = {
        ...baseData,
        ...(specificData || {}),
        fullName: resolvedName,
        isEmailVerified: true
      } as AnyUserProfile;

      setUserProfile(finalProfile);
      
      const wrapped = wrapUser(sbUser);
      if (wrapped) {
        setDirectSession(wrapped, finalProfile);
      }
    } catch (err) {
      console.error('Error fetching user profile from Supabase:', err);
    }
  };

  // Listen to Supabase Auth State changes
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // First check stored local session for instant rendering
        try {
          const savedSession = localStorage.getItem(LOCAL_SESSION_KEY);
          if (savedSession) {
            const parsed = JSON.parse(savedSession);
            if (parsed?.user && parsed?.profile) {
              setCurrentUser(parsed.user);
              setUserProfile(parsed.profile);
            }
          }
        } catch {}

        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          setRawUser(session.user);
          setCurrentUser(wrapUser(session.user));
          await fetchUserProfile(session.user);
        } else {
          // If no supabase session and no valid local session
          const savedSession = localStorage.getItem(LOCAL_SESSION_KEY);
          if (!savedSession) {
            setRawUser(null);
            setCurrentUser(null);
            setUserProfile(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setRawUser(session.user);
        setCurrentUser(wrapUser(session.user));
        await fetchUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem(LOCAL_SESSION_KEY);
        setRawUser(null);
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Also listen to Firebase auth state if signed in via Firebase Google
    const unsubFirebase = onAuthStateChanged(firebaseAuth, async (fbUser: FirebaseUser | null) => {
      if (!mounted) return;
      if (fbUser && !currentUser && !localStorage.getItem(LOCAL_SESSION_KEY)) {
        try {
          const email = fbUser.email?.toLowerCase() || '';
          const name = fbUser.displayName || (email ? email.split('@')[0] : 'User');
          const authUser: AuthUser = {
            id: fbUser.uid,
            uid: fbUser.uid,
            email: email,
            phone: fbUser.phoneNumber || '',
            phoneNumber: fbUser.phoneNumber || '',
            displayName: name,
            emailVerified: true,
            user_metadata: {
              fullName: name,
              avatar_url: fbUser.photoURL,
              provider: 'firebase_google'
            }
          };
          const profile: AnyUserProfile = {
            id: fbUser.uid,
            email: email,
            fullName: name,
            phone: fbUser.phoneNumber || '',
            role: 'tenant',
            isEmailVerified: true,
            createdAt: new Date().toISOString(),
          } as AnyUserProfile;
          setCurrentUser(authUser);
          setUserProfile(profile);
          setDirectSession(authUser, profile);
        } catch (e) {
          console.warn('Firebase auth listener restore notice:', e);
        }
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
      unsubFirebase();
    };
  }, []);

  const signInWithGoogle = async (preferredRole: UserRole = 'tenant'): Promise<{ user: AuthUser; profile: AnyUserProfile }> => {
    // 1. Sign in with Google using Firebase Popup
    const fbUser = await signInWithGoogleFirebase();
    const email = fbUser.email?.toLowerCase() || '';
    const fullName = fbUser.displayName || (email ? email.split('@')[0] : 'User');
    const userId = fbUser.uid;

    // 2. Fetch existing profile from Supabase users table
    let baseData: BaseUser | null = null;
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .or(`id.eq.${userId},email.eq.${email}`)
        .maybeSingle();

      if (data) {
        baseData = {
          id: data.id,
          email: data.email || email,
          fullName: data.fullName || data.full_name || fullName,
          phone: data.phone || fbUser.phoneNumber || '',
          role: (data.role as UserRole) || preferredRole,
          isEmailVerified: true,
          createdAt: data.createdAt || data.created_at || new Date().toISOString(),
          updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn('Google user fetch from Supabase notice:', e);
    }

    // If new user, create record in Supabase users table
    if (!baseData) {
      baseData = {
        id: userId,
        email: email,
        fullName: fullName,
        phone: fbUser.phoneNumber || '',
        role: preferredRole,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await supabase.from('users').upsert({
          id: userId,
          email: email,
          fullName: fullName,
          phone: fbUser.phoneNumber || '',
          role: preferredRole,
          isEmailVerified: true,
        }, { onConflict: 'id' });
      } catch (e) {
        console.warn('Supabase upsert Google user notice:', e);
      }
    }

    const resolvedRole = baseData.role;
    let specificData: Record<string, any> | null = null;
    try {
      if (resolvedRole === 'tenant') {
        const { data } = await supabase.from('tenants').select('*').eq('id', baseData.id).maybeSingle();
        if (data) specificData = data;
        else {
          await supabase.from('tenants').upsert({
            id: baseData.id,
            fullName: baseData.fullName,
            email: baseData.email,
            phone: baseData.phone,
            city: 'الرياض',
          }, { onConflict: 'id' });
        }
      } else if (resolvedRole === 'owner') {
        const { data } = await supabase.from('owners').select('*').eq('id', baseData.id).maybeSingle();
        if (data) specificData = data;
      } else if (resolvedRole === 'cleaner') {
        const { data } = await supabase.from('cleaners').select('*').eq('id', baseData.id).maybeSingle();
        if (data) specificData = data;
      }
    } catch (e) {
      console.warn('Role table fetch/insert notice:', e);
    }

    const finalProfile: AnyUserProfile = {
      ...baseData,
      ...(specificData || {}),
      fullName: specificData?.fullName || baseData.fullName,
      isEmailVerified: true
    } as AnyUserProfile;

    const authUser: AuthUser = {
      id: baseData.id,
      uid: baseData.id,
      email: baseData.email,
      phone: baseData.phone,
      phoneNumber: baseData.phone,
      displayName: baseData.fullName,
      emailVerified: true,
      user_metadata: {
        fullName: baseData.fullName,
        role: baseData.role,
        avatar_url: fbUser.photoURL,
        provider: 'firebase_google',
      }
    };

    setCurrentUser(authUser);
    setUserProfile(finalProfile);
    setDirectSession(authUser, finalProfile);

    return { user: authUser, profile: finalProfile };
  };

  const logout = async () => {
    try {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      await Promise.allSettled([
        supabase.auth.signOut(),
        signOutFirebase(),
      ]);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setRawUser(null);
      setCurrentUser(null);
      setUserProfile(null);
    }
  };

  const resendVerificationEmail = async () => {
    if (rawUser?.email) {
      await supabase.auth.resend({
        type: 'signup',
        email: rawUser.email
      });
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/login`
    });
    if (error) throw error;
  };

  const refreshUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setRawUser(user);
        setCurrentUser(wrapUser(user));
        await fetchUserProfile(user);
      }
    } catch (e) {
      console.warn('Error refreshing Supabase user:', e);
    }
  };

  const isEmailVerified = currentUser ? currentUser.emailVerified : false;
  const role = userProfile ? userProfile.role : null;
  const isAdmin = Boolean(userProfile?.role === 'admin');

  return (
    <AuthContext.Provider value={{
      currentUser,
      rawUser,
      userProfile,
      role,
      isAdmin,
      loading,
      isEmailVerified,
      signInWithGoogle,
      logout,
      resendVerificationEmail,
      resetPassword,
      refreshUser,
      setDirectSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
