-- SMART HOSPITALITY - Supabase Database Schema
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/dhxwzcqcpknhefcgcxsh/sql)

-- 1. Users Table (Core Auth Profile)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    "fullName" TEXT,
    phone TEXT,
    role TEXT DEFAULT 'tenant',
    "isEmailVerified" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
    id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    "fullName" TEXT,
    email TEXT,
    phone TEXT,
    city TEXT DEFAULT 'الرياض',
    "preferredLanguage" TEXT DEFAULT 'العربية',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Property Owners Table
CREATE TABLE IF NOT EXISTS public.owners (
    id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    "fullName" TEXT,
    email TEXT,
    phone TEXT,
    "ownerType" TEXT DEFAULT 'individual',
    "officeName" TEXT,
    "identityOrCr" TEXT,
    "ownerCity" TEXT DEFAULT 'الرياض',
    "ibanOrAccount" TEXT,
    "contactMethod" TEXT DEFAULT 'واتساب',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Cleaners Table
CREATE TABLE IF NOT EXISTS public.cleaners (
    id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    "fullName" TEXT,
    email TEXT,
    phone TEXT,
    "cleanerCity" TEXT DEFAULT 'الرياض',
    "coveredNeighborhoods" TEXT,
    "workHours" TEXT,
    "serviceType" TEXT,
    "experienceYears" TEXT,
    pricing TEXT,
    "idNumber" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
    id TEXT PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'hotel',
    "leaseType" TEXT DEFAULT 'daily',
    "contractDuration" TEXT DEFAULT '3_months',
    "agreedToContractTerms" BOOLEAN DEFAULT true,
    city TEXT DEFAULT 'الرياض',
    district TEXT,
    address TEXT,
    "roomsCount" INTEGER DEFAULT 10,
    "floorsCount" INTEGER DEFAULT 3,
    "smartLocksEnabled" BOOLEAN DEFAULT true,
    "contactPhone" TEXT,
    description TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Email Verifications / OTP Table
CREATE TABLE IF NOT EXISTS public.email_verifications (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    "otpHashing" TEXT,
    "expiresAt" TIMESTAMPTZ,
    attempts INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime for properties
ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;

-- Disable Row Level Security (RLS) or enable public access policies for anon key
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated and anon users
DROP POLICY IF EXISTS "Public access users" ON public.users;
CREATE POLICY "Public access users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access tenants" ON public.tenants;
CREATE POLICY "Public access tenants" ON public.tenants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access owners" ON public.owners;
CREATE POLICY "Public access owners" ON public.owners FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access cleaners" ON public.cleaners;
CREATE POLICY "Public access cleaners" ON public.cleaners FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access properties" ON public.properties;
CREATE POLICY "Public access properties" ON public.properties FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access email_verifications" ON public.email_verifications;
CREATE POLICY "Public access email_verifications" ON public.email_verifications FOR ALL USING (true) WITH CHECK (true);
