import type { ImportRow, SetupDraft, SetupFee, SetupGrade, SetupSubject } from '../types/setup';

/** FICTIONAL templates for the School Setup wizard (versioned per board/year in production — not hard-coded policy). */
export const boardOptions = ['Dhaka Board', 'Rajshahi Board', 'Chattogram Board', 'Madrasah Board', 'Cambridge (English medium)'];

export const gradeTemplate: SetupGrade[] = [
{ grade: 1, label: 'Class 1', enabled: true, sections: ['A'], campusId: 'uttara' },
{ grade: 2, label: 'Class 2', enabled: true, sections: ['A'], campusId: 'uttara' },
{ grade: 3, label: 'Class 3', enabled: true, sections: ['A'], campusId: 'uttara' },
{ grade: 4, label: 'Class 4', enabled: true, sections: ['A', 'B'], campusId: 'uttara' },
{ grade: 5, label: 'Class 5', enabled: true, sections: ['A', 'B'], campusId: 'uttara' },
{ grade: 6, label: 'Class 6', enabled: true, sections: ['A', 'B'], campusId: 'mirpur' },
{ grade: 7, label: 'Class 7', enabled: true, sections: ['A', 'B'], campusId: 'mirpur' },
{ grade: 8, label: 'Class 8', enabled: true, sections: ['A', 'B'], campusId: 'mirpur' },
{ grade: 9, label: 'Class 9', enabled: true, sections: ['A', 'B'], campusId: 'mirpur' },
{ grade: 10, label: 'Class 10', enabled: true, sections: ['A'], campusId: 'mirpur' },
{ grade: 11, label: 'Class 11 (HSC)', enabled: false, sections: ['Sci'], campusId: 'mirpur' },
{ grade: 12, label: 'Class 12 (HSC)', enabled: false, sections: ['Sci'], campusId: 'mirpur' }];


export const subjectTemplate: SetupSubject[] = [
{ id: 'BAN', name: 'Bangla', bn: 'বাংলা', fromGrade: 1, toGrade: 12, periodsPerWeek: 5, enabled: true },
{ id: 'ENG', name: 'English', bn: 'ইংরেজি', fromGrade: 1, toGrade: 12, periodsPerWeek: 5, enabled: true },
{ id: 'MATH', name: 'Mathematics', bn: 'গণিত', fromGrade: 1, toGrade: 10, periodsPerWeek: 6, enabled: true },
{ id: 'SCI', name: 'Science', bn: 'বিজ্ঞান', fromGrade: 3, toGrade: 8, periodsPerWeek: 4, enabled: true },
{ id: 'BGS', name: 'Bangladesh & Global Studies', bn: 'বাংলাদেশ ও বিশ্বপরিচয়', fromGrade: 3, toGrade: 10, periodsPerWeek: 3, enabled: true },
{ id: 'REL', name: 'Religion & Moral Education', bn: 'ধর্ম শিক্ষা', fromGrade: 1, toGrade: 10, periodsPerWeek: 2, enabled: true },
{ id: 'ICT', name: 'ICT', bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', fromGrade: 6, toGrade: 12, periodsPerWeek: 2, enabled: true },
{ id: 'PHY', name: 'Physics', bn: 'পদার্থবিজ্ঞান', fromGrade: 9, toGrade: 12, periodsPerWeek: 4, enabled: true },
{ id: 'CHEM', name: 'Chemistry', bn: 'রসায়ন', fromGrade: 9, toGrade: 12, periodsPerWeek: 4, enabled: true },
{ id: 'HMATH', name: 'Higher Mathematics', bn: 'উচ্চতর গণিত', fromGrade: 9, toGrade: 10, periodsPerWeek: 3, enabled: true },
{ id: 'ART', name: 'Arts & Crafts', bn: 'চারু ও কারুকলা', fromGrade: 1, toGrade: 8, periodsPerWeek: 1, enabled: false }];


export const feeTemplate: SetupFee[] = [
{ id: 'TUI', name: 'Tuition fee', bn: 'বেতন', frequency: 'Monthly', amount: 1200, enabled: true },
{ id: 'ADM', name: 'Admission / session fee', bn: 'ভর্তি ফি', frequency: 'Annual', amount: 5000, enabled: true },
{ id: 'EXM', name: 'Exam fee', bn: 'পরীক্ষা ফি', frequency: 'Per exam', amount: 600, enabled: true },
{ id: 'ICTL', name: 'ICT lab fee', bn: 'আইসিটি ল্যাব', frequency: 'Monthly', amount: 200, enabled: true },
{ id: 'TRN', name: 'Transport (optional)', bn: 'পরিবহন', frequency: 'Monthly', amount: 1500, enabled: false }];


/** Sample roster file — deliberately contains each validation case. */
export const sampleImportRows: ImportRow[] = [
{ row: 2, studentNo: '2027-0601', name: 'Arif Hossain', section: '6-A', dob: '2014-02-11', guardian: 'Kamal Hossain', phone: '01711-200601', issue: 'ok', decision: 'import' },
{ row: 3, studentNo: '2027-0602', name: 'Nusrat Jahan', section: '6-A', dob: '2014-05-02', guardian: 'Rina Begum', phone: '01811-200602', issue: 'ok', decision: 'import' },
{ row: 4, studentNo: '2027-0603', name: 'Tahmid Rahman', section: '6-A', dob: '2014-07-19', guardian: 'Sohel Rahman', phone: '', issue: 'missing-phone', decision: 'skip' },
{ row: 5, studentNo: '2027-0604', name: 'Jannatul Ferdous', section: '6-B', dob: '2014-01-23', guardian: 'Abdul Karim', phone: '01911-200604', issue: 'ok', decision: 'import' },
{ row: 6, studentNo: '2027-0605', name: 'Mahin Chowdhury', section: '6-B', dob: '2014-09-30', guardian: 'Faruk Chowdhury', phone: '0171-2006', issue: 'invalid-phone', decision: 'skip' },
{ row: 7, studentNo: '2027-0604', name: 'Lamia Akter', section: '6-B', dob: '2014-03-14', guardian: 'Nazma Akter', phone: '01611-200607', issue: 'duplicate-in-file', decision: 'skip' },
{ row: 8, studentNo: '2026-0807', name: 'Ayaan Islam', section: '8-A', dob: '2012-04-18', guardian: 'Shahidul Islam', phone: '01713-555707', issue: 'existing-student', decision: 'merge' },
{ row: 9, studentNo: '2027-0609', name: 'Sadia Islam', section: '6-C', dob: '2014-11-05', guardian: 'Monir Islam', phone: '01511-200609', issue: 'unknown-section', decision: 'skip' },
{ row: 10, studentNo: '2027-0701', name: 'Rafi Ahmed', section: '7-A', dob: '2013-06-08', guardian: 'Jahid Ahmed', phone: '01711-200701', issue: 'ok', decision: 'import' },
{ row: 11, studentNo: '2027-0702', name: 'Tasfia Haque', section: '7-A', dob: '2013-08-21', guardian: 'Enamul Haque', phone: '01811-200702', issue: 'ok', decision: 'import' },
{ row: 12, studentNo: '2027-0703', name: 'Imran Hasan', section: '7-B', dob: '2013-12-01', guardian: 'Shirin Hasan', phone: '01911-200703', issue: 'ok', decision: 'import' },
{ row: 13, studentNo: '2027-0704', name: 'Mim Sultana', section: '7-B', dob: '2013-10-17', guardian: 'Delwar Hossain', phone: '01611-200704', issue: 'ok', decision: 'import' }];


export const initialSetupDraft: SetupDraft = {
  step: 'institution',
  institution: {
    name: 'Shapla Model School & College',
    bn: 'শাপলা মডেল স্কুল অ্যান্ড কলেজ',
    eiin: '',
    type: 'school-college',
    board: 'Dhaka Board',
    phone: '02-9001234',
    email: 'office@shapla.sample',
    address: 'Section 10, Mirpur, Dhaka-1216'
  },
  campuses: [
  { id: 'mirpur', name: 'Mirpur Campus', short: 'Mirpur', address: 'Section 10, Mirpur, Dhaka' },
  { id: 'uttara', name: 'Uttara Campus', short: 'Uttara', address: 'Sector 7, Uttara, Dhaka' }],

  year: {
    label: '2027',
    start: '2027-01-01',
    end: '2027-12-15',
    weekend: 'Fri-Sat',
    terms: [
    { id: 't1', name: 'First term', start: '2027-01-01', end: '2027-04-30' },
    { id: 't2', name: 'Half-yearly', start: '2027-05-01', end: '2027-08-15' },
    { id: 't3', name: 'Annual', start: '2027-08-16', end: '2027-12-15' }]

  },
  grades: gradeTemplate,
  classTeachers: {},
  subjects: subjectTemplate,
  fees: feeTemplate,
  importRows: [],
  importState: 'idle',
  importedCount: 0,
  activated: false,
  savedAt: null
};