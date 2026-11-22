export type TenantStatus = 'active' | 'trial' | 'grace' | 'suspended' | 'onboarding';

export interface Tenant {
  id: string;
  name: string;
  district: string;
  planId: string;
  status: TenantStatus;
  campuses: number;
  campusLimit: number;
  students: number;
  studentLimit: number;
  smsCredits: number;
  mrr: number;
  renewsOn: string;
  contact: string;
  contactPhone: string;
  features: Record<string, boolean>;
  createdOn: string;
  health: 'good' | 'warning' | 'critical';
}

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  campusLimit: number;
  studentLimit: number;
  smsIncluded: number;
  features: string[];
}

export interface FeatureFlag {
  id: string;
  label: string;
  description: string;
}

export interface SmsProvider {
  id: string;
  name: string;
  channel: 'SMS' | 'WhatsApp';
  status: 'active' | 'pending' | 'failed';
  balance: number;
  costPerSms: number;
  sent30d: number;
  failed30d: number;
}

export interface SupportTicket {
  id: string;
  tenantId: string;
  subject: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'open' | 'resolved' | 'closed';
  opened: string;
}