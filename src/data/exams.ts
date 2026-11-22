import type { Assessment, Question } from '../types/academic';

export const questions: Question[] = [
{ id: 'q01', subjectId: 'MATH', syllabusId: 'G8-MATH', topicId: 'm8-15', type: 'MCQ', text: 'Which property is always true for a parallelogram?', marks: 1, difficulty: 'Easy', status: 'approved', usedIn: 3, version: 2, author: 'Farhana Rahman' },
{ id: 'q02', subjectId: 'MATH', syllabusId: 'G8-MATH', topicId: 'm8-15', type: 'Short', text: 'Prove that the diagonals of a parallelogram bisect each other.', marks: 4, difficulty: 'Medium', status: 'approved', usedIn: 2, version: 1, author: 'Farhana Rahman' },
{ id: 'q03', subjectId: 'MATH', syllabusId: 'G8-MATH', topicId: 'm8-16', type: 'CQ', text: 'Construct a parallelogram ABCD given AB = 5 cm, BC = 4 cm and ∠B = 60°. Write the steps.', marks: 10, difficulty: 'Medium', status: 'approved', usedIn: 1, version: 1, author: 'Tahmina Begum' },
{ id: 'q04', subjectId: 'MATH', syllabusId: 'G8-MATH', topicId: 'm8-17', type: 'MCQ', text: 'In a right triangle with legs 6 cm and 8 cm, the hypotenuse is:', marks: 1, difficulty: 'Easy', status: 'approved', usedIn: 4, version: 1, author: 'Farhana Rahman' },
{ id: 'q05', subjectId: 'MATH', syllabusId: 'G8-MATH', topicId: 'm8-18', type: 'Short', text: 'Is a triangle with sides 7, 24 and 25 right-angled? Justify.', marks: 3, difficulty: 'Easy', status: 'approved', usedIn: 1, version: 1, author: 'Farhana Rahman' },
{ id: 'q06', subjectId: 'MATH', syllabusId: 'G8-MATH', topicId: 'm8-19', type: 'CQ', text: 'A 13 m ladder leans against a wall with its foot 5 m away. (a) Draw (b) Find height (c) If the foot slides 2 m, how far does the top slip?', marks: 10, difficulty: 'Hard', status: 'approved', usedIn: 0, version: 1, author: 'Farhana Rahman' },
{ id: 'q07', subjectId: 'MATH', syllabusId: 'G8-MATH', topicId: 'm8-20', type: 'MCQ', text: 'The longest chord of a circle is called its:', marks: 1, difficulty: 'Easy', status: 'approved', usedIn: 0, version: 1, author: 'Farhana Rahman' },
{ id: 'q08', subjectId: 'MATH', syllabusId: 'G8-MATH', topicId: 'm8-21', type: 'Short', text: 'Prove that the perpendicular from the centre to a chord bisects the chord.', marks: 4, difficulty: 'Medium', status: 'needs-review', usedIn: 0, version: 1, author: 'Farhana Rahman' },
{ id: 'q09', subjectId: 'MATH', syllabusId: 'G8-MATH', topicId: 'm8-21', type: 'CQ', text: 'In circle O, chord AB = 16 cm and OM ⟂ AB with OM = 6 cm. (a) Draw (b) Find AM (c) Find radius.', marks: 10, difficulty: 'Medium', status: 'draft', usedIn: 0, version: 1, author: 'Farhana Rahman' },
{ id: 'q10', subjectId: 'MATH', syllabusId: 'G8-MATH', topicId: 'm8-22', type: 'MCQ', text: 'The mean of 4, 7, 9, 10 and 15 is:', marks: 1, difficulty: 'Easy', status: 'approved', usedIn: 2, version: 1, author: 'Tahmina Begum' },
{ id: 'q11', subjectId: 'MATH', syllabusId: 'G8-MATH', topicId: 'm8-07', type: 'CQ', text: 'If a + b = 7 and ab = 12: (a) find a² + b² (b) find (a − b)² (c) show a³ + b³ = 91.', marks: 10, difficulty: 'Medium', status: 'approved', usedIn: 3, version: 2, author: 'Farhana Rahman' },
{ id: 'q12', subjectId: 'MATH', syllabusId: 'G8-MATH', topicId: 'm8-04', type: 'CQ', text: 'Tk 5,000 at 8% compound interest for 2 years: (a) interest for year 1 (b) amount after 2 years (c) difference from simple interest.', marks: 10, difficulty: 'Medium', status: 'approved', usedIn: 2, version: 1, author: 'Tahmina Begum' },
{ id: 'q13', subjectId: 'MATH', syllabusId: 'G8-MATH', topicId: 'm8-14', type: 'MCQ', text: 'If A = {1,2,3} and B = {2,3,4}, then A ∩ B = ?', marks: 1, difficulty: 'Easy', status: 'approved', usedIn: 3, version: 1, author: 'Farhana Rahman' },
{ id: 'q14', subjectId: 'MATH', syllabusId: 'G8-MATH', topicId: 'm8-11', type: 'Short', text: 'Solve and verify: 3(x − 2) = 2x + 5', marks: 3, difficulty: 'Easy', status: 'approved', usedIn: 4, version: 1, author: 'Tahmina Begum' },
{ id: 'q15', subjectId: 'HMATH', syllabusId: 'G9-HMATH', topicId: 'h9-07', type: 'Short', text: 'Find the 10th term of 3, 7, 11, …', marks: 3, difficulty: 'Easy', status: 'approved', usedIn: 1, version: 1, author: 'Farhana Rahman' },
{ id: 'q16', subjectId: 'HMATH', syllabusId: 'G9-HMATH', topicId: 'h9-08', type: 'CQ', text: 'For the series 1 + 1/3 + 1/9 + …: (a) common ratio (b) sum to infinity (c) least n with Sn > 1.49', marks: 10, difficulty: 'Hard', status: 'approved', usedIn: 0, version: 1, author: 'Farhana Rahman' }];


export const assessments: Assessment[] = [
{
  id: 'AS-301', title: 'CT-3 Mathematics', type: 'CT', subjectId: 'MATH', sectionIds: ['8A'], teacherId: 'T01', moderatorId: 'T09', date: '2026-10-13', startTime: '08:00', durationMin: 40, totalMarks: 20, weight: 10, roomId: 'R201',
  topicIds: ['m8-15', 'm8-16', 'm8-17'], questionIds: ['q01', 'q02', 'q04', 'q03'], stage: 'published',
  history: [
  { at: '02 Oct 2026', actor: 'Farhana Rahman', action: 'Created · scope Ch 8–9.1', tone: 'default' },
  { at: '05 Oct 2026', actor: 'Tahmina Begum', action: 'Paper moderated & approved', tone: 'success' },
  { at: '13 Oct 2026', actor: 'Farhana Rahman', action: 'Marks entered (20/20)', tone: 'info' },
  { at: '16 Oct 2026', actor: 'Mahbub Alam', action: 'Verified', tone: 'success' },
  { at: '17 Oct 2026', actor: 'Dr. Nasrin Akter', action: 'Published to guardians & students', tone: 'success' }]

},
{
  id: 'AS-402', title: 'CT-4 Mathematics', type: 'CT', subjectId: 'MATH', sectionIds: ['8A', '8B'], teacherId: 'T01', moderatorId: 'T09', date: '2026-11-10', startTime: '08:00', durationMin: 40, totalMarks: 20, weight: 10, roomId: 'R201',
  topicIds: ['m8-20'], questionIds: [], stage: 'draft',
  history: [{ at: '30 Oct 2026', actor: 'Farhana Rahman', action: 'Created draft', tone: 'default' }]
},
{
  id: 'AS-501', title: 'Annual Exam — Mathematics', type: 'Annual', subjectId: 'MATH', sectionIds: ['8A', '8B'], teacherId: 'T01', moderatorId: 'T09', date: '2026-11-24', startTime: '10:00', durationMin: 180, totalMarks: 100, weight: 50, roomId: 'HALL',
  topicIds: ['m8-04', 'm8-07', 'm8-11', 'm8-14', 'm8-15', 'm8-17', 'm8-18', 'm8-19', 'm8-20', 'm8-21', 'm8-22'], questionIds: ['q11', 'q12', 'q14', 'q13', 'q06', 'q05', 'q07', 'q08', 'q10'], stage: 'moderation',
  history: [
  { at: '20 Oct 2026', actor: 'Farhana Rahman', action: 'Blueprint created · 70 CQ / 30 MCQ', tone: 'default' },
  { at: '31 Oct 2026', actor: 'Farhana Rahman', action: 'Paper submitted for moderation', tone: 'info' }]

},
{
  id: 'AS-303', title: 'CT-3 Science', type: 'CT', subjectId: 'SCI', sectionIds: ['8A'], teacherId: 'T04', moderatorId: 'T05', date: '2026-10-14', startTime: '08:00', durationMin: 40, totalMarks: 20, weight: 10, roomId: 'R201',
  topicIds: [], questionIds: [], stage: 'marking',
  history: [
  { at: '06 Oct 2026', actor: 'Nusrat Jahan', action: 'Paper approved', tone: 'success' },
  { at: '14 Oct 2026', actor: 'Kamrul Hasan', action: 'Exam held · marking started', tone: 'info' }]

},
{
  id: 'AS-304', title: 'CT-3 English', type: 'CT', subjectId: 'ENG', sectionIds: ['8B'], teacherId: 'T03', moderatorId: 'T11', date: '2026-10-15', startTime: '08:00', durationMin: 40, totalMarks: 20, weight: 10, roomId: 'R202',
  topicIds: [], questionIds: [], stage: 'verification',
  history: [
  { at: '15 Oct 2026', actor: 'Sabrina Chowdhury', action: 'Exam held', tone: 'info' },
  { at: '28 Oct 2026', actor: 'Sabrina Chowdhury', action: 'Marks submitted for verification', tone: 'info' }]

},
{
  id: 'AS-201', title: 'Half-Yearly — Mathematics', type: 'Half-Yearly', subjectId: 'MATH', sectionIds: ['8A'], teacherId: 'T01', moderatorId: 'T09', date: '2026-06-16', startTime: '10:00', durationMin: 180, totalMarks: 100, weight: 40, roomId: 'HALL',
  topicIds: ['m8-01', 'm8-02', 'm8-03', 'm8-04', 'm8-05', 'm8-06', 'm8-07', 'm8-08', 'm8-09', 'm8-10'], questionIds: ['q11', 'q12'], stage: 'published',
  history: [{ at: '05 Jul 2026', actor: 'Dr. Nasrin Akter', action: 'Published', tone: 'success' }]
},
{
  id: 'AS-305', title: 'CT-2 Higher Mathematics', type: 'CT', subjectId: 'HMATH', sectionIds: ['9A'], teacherId: 'T01', moderatorId: 'T09', date: '2026-11-05', startTime: '10:20', durationMin: 40, totalMarks: 20, weight: 10, roomId: 'R301',
  topicIds: ['h9-07', 'h9-08'], questionIds: ['q15', 'q16'], stage: 'scheduled',
  history: [
  { at: '25 Oct 2026', actor: 'Farhana Rahman', action: 'Created', tone: 'default' },
  { at: '28 Oct 2026', actor: 'Tahmina Begum', action: 'Moderated & approved', tone: 'success' },
  { at: '28 Oct 2026', actor: 'Mahbub Alam', action: 'Scheduled · Thu 5 Nov, P4, Room 301', tone: 'info' }]

},
{
  id: 'AS-306', title: 'CT-3 Bangla', type: 'CT', subjectId: 'BAN', sectionIds: ['4B'], teacherId: 'T11', moderatorId: 'T02', date: '2026-10-12', startTime: '08:00', durationMin: 40, totalMarks: 20, weight: 10, roomId: 'R104',
  topicIds: [], questionIds: [], stage: 'published',
  history: [{ at: '20 Oct 2026', actor: 'Dr. Nasrin Akter', action: 'Published', tone: 'success' }]
}];


export const initialMarks: Record<string, Record<string, number | null>> = {
  'AS-301': { S8A01: 19, S8A02: 16, S8A03: 12, S8A04: 20, S8A05: 11, S8A06: 17, S8A07: 17, S8A08: 14, S8A09: 13, S8A10: 19, S8A11: 9, S8A12: 16, S8A13: 10, S8A14: 18, S8A15: 15, S8A16: 17, S8A17: 13, S8A18: 18, S8A19: 16, S8A20: 19 },
  'AS-201': { S8A01: 92, S8A02: 81, S8A03: 64, S8A04: 96, S8A05: 58, S8A06: 84, S8A07: 78, S8A08: 70, S8A09: 66, S8A10: 94, S8A11: 47, S8A12: 80, S8A13: 55, S8A14: 88, S8A15: 73, S8A16: 85, S8A17: 69, S8A18: 90, S8A19: 79, S8A20: 93 },
  'AS-303': { S8A01: 18, S8A02: 15, S8A03: 11, S8A04: 19, S8A05: 12, S8A06: 16, S8A07: 15, S8A08: 13, S8A09: 14, S8A10: 18, S8A11: null, S8A12: null, S8A13: null, S8A14: null, S8A15: null, S8A16: null, S8A17: null, S8A18: null, S8A19: null, S8A20: null },
  'AS-304': { S8B01: 16, S8B02: 18, S8B03: 12, S8B04: 17, S8B05: 14, S8B06: 15 },
  'AS-306': { S4B01: 18, S4B02: 15, S4B03: 19 }
};