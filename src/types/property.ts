export type PropertyType = 'hotel' | 'building' | 'apartments' | 'villa' | 'resort' | 'compound';
export type PropertyStatus = 'active' | 'inactive' | 'maintenance' | 'pending_approval' | 'rejected' | 'deletion_requested';
export type LeaseType = 'daily' | 'monthly_annual';
export type ContractDuration = '3_months' | '6_months' | '1_year';

export interface Property {
  id: string;
  ownerId: string;
  name: string;
  type: PropertyType;
  leaseType?: LeaseType;
  contractDuration?: ContractDuration;
  agreedToContractTerms?: boolean;
  city: string;
  district: string;
  address: string;
  roomsCount: number;
  floorsCount?: number;
  smartLocksEnabled: boolean;
  contactPhone?: string;
  description?: string;
  amenities?: string[];
  coverImage?: string;
  images?: string[];
  status: PropertyStatus;
  occupancyRate: number; // 0 - 100
  monthlyRevenue?: number;
  rejectionReason?: string;
  reviewerNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  deletionReason?: string;
  deletionRequestedAt?: string;
  deletionRequestedBy?: string;
  previousStatus?: PropertyStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface PropertyFormData {
  name: string;
  type: PropertyType;
  leaseType: LeaseType;
  contractDuration: ContractDuration;
  agreedToContractTerms: boolean;
  city: string;
  district: string;
  address: string;
  roomsCount: number | '';
  floorsCount: number | '';
  smartLocksEnabled: boolean;
  contactPhone: string;
  description: string;
  amenities: string[];
  coverImage?: string;
  images: string[];
  status: PropertyStatus;
  occupancyRate?: number;
}
