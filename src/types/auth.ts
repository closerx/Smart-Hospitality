export type UserRole = 'tenant' | 'owner' | 'cleaner' | 'admin';

export interface BaseUser {
  id: string; // auth uid
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TenantProfile extends BaseUser {
  role: 'tenant';
  city: string;
  preferredLanguage?: string;
}

export interface OwnerProfile extends BaseUser {
  role: 'owner';
  ownerType: 'individual' | 'office';
  officeName?: string;
  identityOrCr: string; // 10 digits
  ownerCity: string;
  ibanOrAccount: string;
  contactMethod?: string;
}

export interface CleanerProfile extends BaseUser {
  role: 'cleaner';
  cleanerCity: string;
  coveredNeighborhoods: string;
  workHours: string;
  serviceType: string;
  experienceYears?: string;
  pricing: string;
  idNumber: string; // 10 digits
}

export interface AdminProfile extends BaseUser {
  role: 'admin';
  permissions?: string[];
}

export type AnyUserProfile = TenantProfile | OwnerProfile | CleanerProfile | AdminProfile;
