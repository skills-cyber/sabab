export type SetupStepId = 'institution' | 'campuses' | 'classes' | 'subjects' | 'import' | 'review';

export interface SetupInstitution {
  name: string;
  bn: string;
  eiin: string;
  type: 'school' | 'school-college' | 'madrasa' | 'english-medium';
  board: string;
  phone: string;
  email: string;
  address: string;
}

export interface SetupCampus {
  id: string;
  name: string;
  short: string;
  address: string;
}

export interface SetupTerm {
  id: string;
  name: string;
  start: string;
  end: string;
}

export interface SetupYear {
  label: string;
  start: string;
  end: string;
  weekend: 'Fri' | 'Fri-Sat' | 'Sat-Sun';
  terms: SetupTerm[];
}

export interface SetupGrade {
  grade: number;
  label: string;
  enabled: boolean;
  sections: string[];
  campusId: string;
}

export interface SetupSubject {
  id: string;
  name: string;
  bn: string;
  fromGrade: number;
  toGrade: number;
  periodsPerWeek: number;
  enabled: boolean;
}

export interface SetupFee {
  id: string;
  name: string;
  bn: string;
  frequency: 'Monthly' | 'Annual' | 'Per exam';
  amount: number;
  enabled: boolean;
}

export type ImportIssue = 'ok' | 'missing-phone' | 'invalid-phone' | 'duplicate-in-file' | 'existing-student' | 'unknown-section';

export interface ImportRow {
  row: number;
  studentNo: string;
  name: string;
  section: string;
  dob: string;
  guardian: string;
  phone: string;
  issue: ImportIssue;
  decision: 'import' | 'skip' | 'merge';
}

export interface SetupDraft {
  step: SetupStepId;
  institution: SetupInstitution;
  campuses: SetupCampus[];
  year: SetupYear;
  grades: SetupGrade[];
  classTeachers: Record<string, string>;
  subjects: SetupSubject[];
  fees: SetupFee[];
  importRows: ImportRow[];
  importState: 'idle' | 'validated' | 'imported';
  importedCount: number;
  activated: boolean;
  savedAt: string | null;
}