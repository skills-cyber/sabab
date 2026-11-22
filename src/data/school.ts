import type { Campus, Role, Room, Section, Subject, Teacher } from '../types/school';
import type { PeriodSlot } from '../types/academic';

/** FICTIONAL SAMPLE DATA — no real institution or student records. */
export const school = {
  name: 'Shapla Model School & College',
  bn: 'শাপলা মডেল স্কুল অ্যান্ড কলেজ',
  short: 'SMSC',
  eiin: 'EIIN 000000 (sample)',
  address: 'Section 10, Mirpur, Dhaka-1216',
  board: 'Dhaka Board (sample)',
  curriculum: 'National Curriculum · Bangla Version · 2026 v1'
};

export const roles: Role[] = [
{ id: 'principal', label: 'Principal', bn: 'অধ্যক্ষ', user: 'Dr. Nasrin Akter', title: 'Principal', home: '/overview', scope: 'Institution · both campuses' },
{ id: 'coordinator', label: 'Academic Coordinator', bn: 'একাডেমিক সমন্বয়ক', user: 'Mahbub Alam', title: 'Academic Coordinator', home: '/planner/calendar', scope: 'Mirpur campus · academics' },
{ id: 'teacher', label: 'Teacher', bn: 'শিক্ষক', user: 'Farhana Rahman', title: 'Senior Teacher · Mathematics', home: '/teaching', scope: '8-A (class teacher), 8-B, 7-A, 9-A' },
{ id: 'accountant', label: 'Accountant', bn: 'হিসাবরক্ষক', user: 'Mizanur Rahman', title: 'Accountant & Cashier', home: '/fees/collection', scope: 'Mirpur campus · finance' },
{ id: 'office', label: 'Office Staff', bn: 'অফিস স্টাফ', user: 'Shirin Sultana', title: 'Admission Officer', home: '/students', scope: 'Mirpur campus · records' },
{ id: 'owner', label: 'School Owner', bn: 'পরিচালনা পর্ষদ', user: 'Alhaj Rezaul Karim', title: 'Chairman, Governing Body', home: '/overview', scope: 'Institution · both campuses' },
{ id: 'parent', label: 'Guardian', bn: 'অভিভাবক', user: 'Shahidul Islam', title: 'Guardian of Ayaan & Nusrat', home: '/parent/overview', scope: '2 linked children' },
{ id: 'platform', label: 'Platform Admin', bn: 'প্ল্যাটফর্ম অ্যাডমিন', user: 'Tanvir Hasan', title: 'Sabab Platform Ops', home: '/platform/overview', scope: 'All tenants · no school records' }];


export const campuses: Campus[] = [
{ id: 'mirpur', name: 'Mirpur Campus', bn: 'মিরপুর ক্যাম্পাস', short: 'Mirpur', students: 1240 },
{ id: 'uttara', name: 'Uttara Campus', bn: 'উত্তরা ক্যাম্পাস', short: 'Uttara', students: 610 }];


export const academicYears = ['2026', '2025'];

export const subjects: Subject[] = [
{ id: 'BAN', name: 'Bangla', bn: 'বাংলা', short: 'BAN', tone: 'rose' },
{ id: 'ENG', name: 'English', bn: 'ইংরেজি', short: 'ENG', tone: 'blue' },
{ id: 'MATH', name: 'Mathematics', bn: 'গণিত', short: 'MATH', tone: 'teal' },
{ id: 'SCI', name: 'Science', bn: 'বিজ্ঞান', short: 'SCI', tone: 'emerald' },
{ id: 'BGS', name: 'Bangladesh & Global Studies', bn: 'বাংলাদেশ ও বিশ্বপরিচয়', short: 'BGS', tone: 'amber' },
{ id: 'ICT', name: 'ICT', bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', short: 'ICT', tone: 'indigo' },
{ id: 'REL', name: 'Religion & Moral Education', bn: 'ধর্ম ও নৈতিক শিক্ষা', short: 'REL', tone: 'lime' },
{ id: 'PE', name: 'Physical Education', bn: 'শারীরিক শিক্ষা', short: 'PE', tone: 'orange' },
{ id: 'ART', name: 'Arts & Culture', bn: 'শিল্প ও সংস্কৃতি', short: 'ART', tone: 'fuchsia' },
{ id: 'HMATH', name: 'Higher Mathematics', bn: 'উচ্চতর গণিত', short: 'H.MATH', tone: 'cyan' },
{ id: 'PHY', name: 'Physics', bn: 'পদার্থবিজ্ঞান', short: 'PHY', tone: 'violet' },
{ id: 'CHEM', name: 'Chemistry', bn: 'রসায়ন', short: 'CHEM', tone: 'sky' },
{ id: 'BIO', name: 'Biology', bn: 'জীববিজ্ঞান', short: 'BIO', tone: 'slate' }];


export const teachers: Teacher[] = [
{ id: 'T01', name: 'Farhana Rahman', bn: 'ফারহানা রহমান', designation: 'Senior Teacher', subjects: ['MATH', 'HMATH'], campusId: 'mirpur', phone: '01711-000101', email: 'farhana@shapla.sample', maxPeriods: 24, status: 'active', joined: '2015-02-01', qualification: 'M.Sc. Mathematics, B.Ed.' },
{ id: 'T02', name: 'Md. Rafiqul Islam', bn: 'মো. রফিকুল ইসলাম', designation: 'Assistant Teacher', subjects: ['BAN'], campusId: 'mirpur', phone: '01711-000102', email: 'rafiq@shapla.sample', maxPeriods: 26, status: 'active', joined: '2017-01-10', qualification: 'M.A. Bangla' },
{ id: 'T03', name: 'Sabrina Chowdhury', bn: 'সাবরিনা চৌধুরী', designation: 'Senior Teacher', subjects: ['ENG'], campusId: 'mirpur', phone: '01711-000103', email: 'sabrina@shapla.sample', maxPeriods: 26, status: 'active', joined: '2016-03-15', qualification: 'M.A. English, CELTA' },
{ id: 'T04', name: 'Kamrul Hasan', bn: 'কামরুল হাসান', designation: 'Assistant Teacher', subjects: ['SCI', 'PHY'], campusId: 'mirpur', phone: '01711-000104', email: 'kamrul@shapla.sample', maxPeriods: 24, status: 'active', joined: '2019-07-01', qualification: 'M.Sc. Physics' },
{ id: 'T05', name: 'Nusrat Jahan', bn: 'নুসরাত জাহান', designation: 'Assistant Teacher', subjects: ['SCI', 'CHEM', 'BIO'], campusId: 'mirpur', phone: '01711-000105', email: 'nusratj@shapla.sample', maxPeriods: 26, status: 'active', joined: '2018-01-05', qualification: 'M.Sc. Chemistry' },
{ id: 'T06', name: 'Abdullah Al Mamun', bn: 'আবদুল্লাহ আল মামুন', designation: 'ICT Instructor', subjects: ['ICT'], campusId: 'mirpur', phone: '01711-000106', email: 'mamun@shapla.sample', maxPeriods: 24, status: 'active', joined: '2020-02-12', qualification: 'B.Sc. CSE' },
{ id: 'T07', name: 'Mahmudul Haque', bn: 'মাহমুদুল হক', designation: 'Assistant Teacher', subjects: ['BGS'], campusId: 'mirpur', phone: '01711-000107', email: 'mahmud@shapla.sample', maxPeriods: 26, status: 'active', joined: '2014-08-20', qualification: 'M.S.S. Political Science' },
{ id: 'T08', name: 'Maulana Abdur Rahim', bn: 'মাওলানা আব্দুর রহিম', designation: 'Assistant Teacher', subjects: ['REL'], campusId: 'mirpur', phone: '01711-000108', email: 'rahim@shapla.sample', maxPeriods: 26, status: 'active', joined: '2012-01-02', qualification: 'Kamil (Hadith)' },
{ id: 'T09', name: 'Tahmina Begum', bn: 'তাহমিনা বেগম', designation: 'Assistant Teacher', subjects: ['MATH'], campusId: 'mirpur', phone: '01711-000109', email: 'tahmina@shapla.sample', maxPeriods: 26, status: 'active', joined: '2018-06-01', qualification: 'M.Sc. Applied Mathematics' },
{ id: 'T10', name: 'Shafiqul Alam', bn: 'শফিকুল আলম', designation: 'Physical Instructor', subjects: ['PE'], campusId: 'mirpur', phone: '01711-000110', email: 'shafiq@shapla.sample', maxPeriods: 28, status: 'active', joined: '2013-04-11', qualification: 'B.P.Ed.' },
{ id: 'T11', name: 'Rumana Afroz', bn: 'রুমানা আফরোজ', designation: 'Assistant Teacher', subjects: ['ART', 'ENG', 'BAN'], campusId: 'mirpur', phone: '01711-000111', email: 'rumana@shapla.sample', maxPeriods: 26, status: 'active', joined: '2021-01-03', qualification: 'B.F.A., M.A.' },
{ id: 'T12', name: 'Imran Hossain', bn: 'ইমরান হোসেন', designation: 'Assistant Teacher', subjects: ['PHY'], campusId: 'mirpur', phone: '01711-000112', email: 'imran@shapla.sample', maxPeriods: 24, status: 'on-leave', joined: '2022-07-01', qualification: 'M.Sc. Physics' }];


export const sections: Section[] = [
{ id: '4B', label: '4-B', grade: 4, campusId: 'mirpur', classTeacherId: 'T11', room: 'R104' },
{ id: '6A', label: '6-A', grade: 6, campusId: 'mirpur', classTeacherId: 'T09', room: 'R103' },
{ id: '7A', label: '7-A', grade: 7, campusId: 'mirpur', classTeacherId: 'T09', room: 'R105' },
{ id: '8A', label: '8-A', grade: 8, campusId: 'mirpur', classTeacherId: 'T01', room: 'R201' },
{ id: '8B', label: '8-B', grade: 8, campusId: 'mirpur', classTeacherId: 'T03', room: 'R202' },
{ id: '9A', label: '9-A', grade: 9, campusId: 'mirpur', classTeacherId: 'T04', room: 'R301', stream: 'Science' },
{ id: '6U', label: '6-A (Uttara)', grade: 6, campusId: 'uttara', classTeacherId: 'T11', room: 'U-101' },
{ id: '8U', label: '8-A (Uttara)', grade: 8, campusId: 'uttara', classTeacherId: 'T11', room: 'U-201' }];


export const rooms: Room[] = [
{ id: 'R104', label: 'Room 104', capacity: 40, type: 'Classroom' },
{ id: 'R105', label: 'Room 105', capacity: 45, type: 'Classroom' },
{ id: 'R201', label: 'Room 201', capacity: 45, type: 'Classroom' },
{ id: 'R202', label: 'Room 202', capacity: 45, type: 'Classroom' },
{ id: 'R301', label: 'Room 301', capacity: 45, type: 'Classroom' },
{ id: 'LAB-ICT', label: 'ICT Lab', capacity: 40, type: 'Lab' },
{ id: 'LAB-SCI', label: 'Science Lab', capacity: 36, type: 'Lab' },
{ id: 'FIELD', label: 'Playground', capacity: 120, type: 'Field' },
{ id: 'HALL', label: 'Exam Hall', capacity: 240, type: 'Hall' }];


export const periodSlots: PeriodSlot[] = [
{ n: 1, start: '08:00', end: '08:40' },
{ n: 2, start: '08:40', end: '09:20' },
{ n: 3, start: '09:20', end: '10:00' },
{ n: 4, start: '10:20', end: '11:00' },
{ n: 5, start: '11:00', end: '11:40' },
{ n: 6, start: '11:40', end: '12:20' },
{ n: 7, start: '12:50', end: '13:30' },
{ n: 8, start: '13:40', end: '14:20' }];


export const schoolDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'] as const;