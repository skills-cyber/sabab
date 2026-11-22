import type { TimelineEntry } from './academic';

export type AdmissionStage = 'applied' | 'test-scheduled' | 'tested' | 'offered' | 'admitted' | 'waitlisted' | 'rejected' | 'withdrawn';

export type DocumentKey = 'birth-cert' | 'photo' | 'prev-result' | 'tc' | 'guardian-nid';

export interface AdmissionDoc {
  key: DocumentKey;
  label: string;
  required: boolean;
  status: 'missing' | 'received' | 'verified';
}

export interface Application {
  id: string;
  applicant: string;
  applicantBn: string;
  gender: 'M' | 'F';
  dob: string;
  grade: number;
  campusId: string;
  previousSchool: string;
  guardianName: string;
  guardianRelation: 'Father' | 'Mother' | 'Guardian';
  guardianPhone: string;
  source: 'Walk-in' | 'Website' | 'Phone' | 'Referral' | 'Facebook';
  appliedOn: string;
  stage: AdmissionStage;
  testSlotId?: string;
  score?: number;
  docs: AdmissionDoc[];
  formFeePaid: boolean;
  admissionFeePaid: boolean;
  siblingOf?: string;
  studentId?: string;
  note: string;
  history: TimelineEntry[];
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  grade: number;
  campusId: string;
  source: Application['source'];
  on: string;
  followUp: string;
  status: 'new' | 'contacted' | 'converted' | 'lost';
  note: string;
}

export interface TestSlot {
  id: string;
  grade: number;
  campusId: string;
  date: string;
  time: string;
  room: string;
  capacity: number;
  passMark: number;
}

export interface SeatPlan {
  grade: number;
  campusId: string;
  seats: number;
}