import type { TimelineEntry } from './academic';

export type GuardianRelation = 'Father' | 'Mother' | 'Guardian';

export interface SecondaryContact {
  name: string;
  relation: string;
  phone: string;
}

/** One household: the primary guardian, an optional second contact and (derived) all linked children. */
export interface Family {
  id: string;
  guardianName: string;
  guardianNameBn?: string;
  relation: GuardianRelation;
  phone: string;
  verified: boolean;
  smsOptIn: boolean;
  nid?: string;
  address?: string;
  secondary?: SecondaryContact;
  portalEnabled: boolean;
  lastLogin?: string;
  history: TimelineEntry[];
}

export type FamilyDraft = Omit<Family, 'id' | 'history' | 'portalEnabled' | 'lastLogin' | 'verified'>;