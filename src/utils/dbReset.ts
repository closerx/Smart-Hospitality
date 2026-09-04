import { supabase } from '../lib/supabase';

export interface PurgeResult {
  usersDeleted: number;
  tenantsDeleted: number;
  ownersDeleted: number;
  cleanersDeleted: number;
  verificationsDeleted: number;
  propertiesDeleted?: number;
  adminPreserved: boolean;
  timestamp: string;
}

/**
 * Safely clears all regular user accounts and registration data from Supabase database,
 * while preserving the super admin account (hadi185018@gmail.com).
 */
export async function clearAllDatabaseAccounts(clearProperties: boolean = false): Promise<PurgeResult> {
  const result: PurgeResult = {
    usersDeleted: 0,
    tenantsDeleted: 0,
    ownersDeleted: 0,
    cleanersDeleted: 0,
    verificationsDeleted: 0,
    propertiesDeleted: 0,
    adminPreserved: true,
    timestamp: new Date().toISOString()
  };

  const ADMIN_EMAIL = 'hadi185018@gmail.com';

  try {
    // 1. Purge /tenants table (excluding admin)
    try {
      const { data: tenants } = await supabase.from('tenants').select('id, email');
      if (tenants) {
        for (const t of tenants) {
          if ((t.email || '').toLowerCase().trim() === ADMIN_EMAIL) continue;
          await supabase.from('tenants').delete().eq('id', t.id);
          result.tenantsDeleted++;
        }
      }
    } catch (e) {
      console.warn('Purge tenants notice:', e);
    }

    // 2. Purge /owners table
    try {
      const { data: owners } = await supabase.from('owners').select('id, email');
      if (owners) {
        for (const o of owners) {
          if ((o.email || '').toLowerCase().trim() === ADMIN_EMAIL) continue;
          await supabase.from('owners').delete().eq('id', o.id);
          result.ownersDeleted++;
        }
      }
    } catch (e) {
      console.warn('Purge owners notice:', e);
    }

    // 3. Purge /cleaners table
    try {
      const { data: cleaners } = await supabase.from('cleaners').select('id, email');
      if (cleaners) {
        for (const c of cleaners) {
          if ((c.email || '').toLowerCase().trim() === ADMIN_EMAIL) continue;
          await supabase.from('cleaners').delete().eq('id', c.id);
          result.cleanersDeleted++;
        }
      }
    } catch (e) {
      console.warn('Purge cleaners notice:', e);
    }

    // 4. Purge /users table (excluding admin)
    try {
      const { data: users } = await supabase.from('users').select('id, email, role');
      if (users) {
        for (const u of users) {
          const email = (u.email || '').toLowerCase().trim();
          if (email === ADMIN_EMAIL || u.role === 'admin') continue;
          await supabase.from('users').delete().eq('id', u.id);
          result.usersDeleted++;
        }
      }
    } catch (e) {
      console.warn('Purge users notice:', e);
    }

    // 5. Purge /email_verifications
    try {
      const { data: verifs } = await supabase.from('email_verifications').select('id');
      if (verifs) {
        for (const v of verifs) {
          await supabase.from('email_verifications').delete().eq('id', v.id);
          result.verificationsDeleted++;
        }
      }
    } catch (e) {
      console.warn('Purge verifications notice:', e);
    }

    // 6. Optional: Purge properties if requested
    if (clearProperties) {
      try {
        const { data: props } = await supabase.from('properties').select('id');
        if (props) {
          for (const p of props) {
            await supabase.from('properties').delete().eq('id', p.id);
            result.propertiesDeleted = (result.propertiesDeleted || 0) + 1;
          }
        }
      } catch (e) {
        console.warn('Purge properties notice:', e);
      }
    }

    // Clear session and local storage OTP/cached items
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('otp_')) {
          sessionStorage.removeItem(key);
        }
      });
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('local_prop_') || key.startsWith('otp_')) {
          localStorage.removeItem(key);
        }
      });
    } catch {}

    return result;
  } catch (error) {
    console.error('Error during Supabase database account purge:', error);
    throw error;
  }
}
