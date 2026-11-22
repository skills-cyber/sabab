import type { CalendarEvent, Course, Homework, MakeupRequest, PlanVersion, SyllabusTopic, Term, TodayPeriod } from '../types/academic';

export const terms: Term[] = [
{ id: 'T1', name: 'Term 1', start: '2026-01-01', end: '2026-06-30', workingDays: 98 },
{ id: 'T2', name: 'Term 2', start: '2026-07-01', end: '2026-12-31', workingDays: 104 }];


/** Dates are illustrative; religious holidays are configured per year, never hard-coded. */
export const calendarEvents: CalendarEvent[] = [
{ id: 'e01', title: 'Book festival & year opening', bn: 'বই উৎসব', type: 'event', start: '2026-01-01', end: '2026-01-01', campus: 'all' },
{ id: 'e02', title: 'Shab-e-Barat', bn: 'শবে বরাত', type: 'holiday', start: '2026-02-04', end: '2026-02-04', campus: 'all' },
{ id: 'e03', title: 'Ramadan routine (shortened periods)', bn: 'রমজান রুটিন', type: 'ramadan', start: '2026-02-18', end: '2026-03-16', campus: 'all', note: '35-min periods, ends 12:00' },
{ id: 'e04', title: 'International Mother Language Day', bn: 'আন্তর্জাতিক মাতৃভাষা দিবস', type: 'holiday', start: '2026-02-21', end: '2026-02-21', campus: 'all' },
{ id: 'e05', title: 'CT-1 window', type: 'ct', start: '2026-03-01', end: '2026-03-05', campus: 'all' },
{ id: 'e06', title: 'Eid-ul-Fitr & Independence Day vacation', bn: 'ঈদুল ফিতর ও স্বাধীনতা দিবস', type: 'holiday', start: '2026-03-17', end: '2026-03-28', campus: 'all' },
{ id: 'e07', title: 'Pohela Boishakh', bn: 'পহেলা বৈশাখ', type: 'holiday', start: '2026-04-14', end: '2026-04-14', campus: 'all' },
{ id: 'e08', title: 'May Day', type: 'holiday', start: '2026-05-01', end: '2026-05-01', campus: 'all' },
{ id: 'e09', title: 'Eid-ul-Adha vacation', bn: 'ঈদুল আযহা', type: 'holiday', start: '2026-05-24', end: '2026-06-02', campus: 'all' },
{ id: 'e10', title: 'Half-Yearly Examination', bn: 'অর্ধবার্ষিক পরীক্ষা', type: 'exam', start: '2026-06-14', end: '2026-06-25', campus: 'all' },
{ id: 'e11', title: 'Flood closure (waterlogging)', type: 'closure', start: '2026-07-07', end: '2026-07-12', campus: 'uttara', note: 'Recovered in plan v1.1' },
{ id: 'e12', title: 'CT-2 window', type: 'ct', start: '2026-08-09', end: '2026-08-13', campus: 'all' },
{ id: 'e13', title: 'Eid-e-Miladunnabi', type: 'holiday', start: '2026-08-26', end: '2026-08-26', campus: 'all' },
{ id: 'e14', title: 'Janmashtami', type: 'holiday', start: '2026-09-04', end: '2026-09-04', campus: 'all' },
{ id: 'e15', title: 'Annual Sports Day', bn: 'বার্ষিক ক্রীড়া', type: 'event', start: '2026-09-24', end: '2026-09-24', campus: 'all' },
{ id: 'e16', title: 'CT-3 window', type: 'ct', start: '2026-10-11', end: '2026-10-15', campus: 'all' },
{ id: 'e17', title: 'Durga Puja', bn: 'দুর্গাপূজা', type: 'holiday', start: '2026-10-19', end: '2026-10-21', campus: 'all' },
{ id: 'e18', title: 'Parent–teacher meeting', bn: 'অভিভাবক সমাবেশ', type: 'event', start: '2026-11-05', end: '2026-11-05', campus: 'all' },
{ id: 'e19', title: 'CT-4 window', type: 'ct', start: '2026-11-08', end: '2026-11-12', campus: 'all' },
{ id: 'e20', title: 'Science fair', type: 'event', start: '2026-11-10', end: '2026-11-10', campus: 'mirpur' },
{ id: 'e21', title: 'Revision week', type: 'event', start: '2026-11-16', end: '2026-11-20', campus: 'all' },
{ id: 'e22', title: 'Annual Examination', bn: 'বার্ষিক পরীক্ষা', type: 'exam', start: '2026-11-22', end: '2026-12-03', campus: 'all' },
{ id: 'e23', title: 'Victory Day', bn: 'বিজয় দিবস', type: 'holiday', start: '2026-12-16', end: '2026-12-16', campus: 'all' },
{ id: 'e24', title: 'Result publication', type: 'event', start: '2026-12-20', end: '2026-12-20', campus: 'all' },
{ id: 'e25', title: 'Winter vacation', bn: 'শীতকালীন ছুটি', type: 'holiday', start: '2026-12-21', end: '2026-12-31', campus: 'all' }];


export const syllabusTopics: SyllabusTopic[] = [
{ id: 'm8-01', syllabusId: 'G8-MATH', chapter: 1, chapterTitle: 'Patterns', title: '1.1 Number patterns', outcome: 'Identify and extend number sequences', plannedPeriods: 4, targetDate: '2026-01-15' },
{ id: 'm8-02', syllabusId: 'G8-MATH', chapter: 1, chapterTitle: 'Patterns', title: '1.2 Geometric patterns', outcome: 'Describe geometric patterns algebraically', plannedPeriods: 3, targetDate: '2026-01-25' },
{ id: 'm8-03', syllabusId: 'G8-MATH', chapter: 2, chapterTitle: 'Profit & Loss', title: '2.1 Cost, selling price & profit', outcome: 'Compute profit and loss percentages', plannedPeriods: 4, targetDate: '2026-02-08' },
{ id: 'm8-04', syllabusId: 'G8-MATH', chapter: 2, chapterTitle: 'Profit & Loss', title: '2.2 Simple & compound interest', outcome: 'Solve interest problems in real contexts', plannedPeriods: 5, targetDate: '2026-02-26' },
{ id: 'm8-05', syllabusId: 'G8-MATH', chapter: 3, chapterTitle: 'Measurement', title: '3.1 Units of length, area & volume', outcome: 'Convert between metric units', plannedPeriods: 4, targetDate: '2026-03-12' },
{ id: 'm8-06', syllabusId: 'G8-MATH', chapter: 3, chapterTitle: 'Measurement', title: '3.2 Area of quadrilaterals', outcome: 'Calculate areas of composite shapes', plannedPeriods: 4, targetDate: '2026-04-09' },
{ id: 'm8-07', syllabusId: 'G8-MATH', chapter: 4, chapterTitle: 'Algebraic Formulae', title: '4.1 Square formulae', outcome: 'Expand and apply (a±b)² identities', plannedPeriods: 5, targetDate: '2026-04-23' },
{ id: 'm8-08', syllabusId: 'G8-MATH', chapter: 4, chapterTitle: 'Algebraic Formulae', title: '4.2 Cube formulae & factorisation', outcome: 'Factorise using cube identities', plannedPeriods: 5, targetDate: '2026-05-14' },
{ id: 'm8-09', syllabusId: 'G8-MATH', chapter: 5, chapterTitle: 'Algebraic Fractions', title: '5.1 Simplifying fractions', outcome: 'Reduce algebraic fractions to lowest terms', plannedPeriods: 4, targetDate: '2026-05-21' },
{ id: 'm8-10', syllabusId: 'G8-MATH', chapter: 5, chapterTitle: 'Algebraic Fractions', title: '5.2 Operations on fractions', outcome: 'Add, subtract, multiply, divide fractions', plannedPeriods: 4, targetDate: '2026-06-11' },
{ id: 'm8-11', syllabusId: 'G8-MATH', chapter: 6, chapterTitle: 'Simple Equations', title: '6.1 Linear equations in one variable', outcome: 'Solve and verify linear equations', plannedPeriods: 4, targetDate: '2026-07-16' },
{ id: 'm8-12', syllabusId: 'G8-MATH', chapter: 6, chapterTitle: 'Simple Equations', title: '6.2 Word problems', outcome: 'Model word problems as equations', plannedPeriods: 4, targetDate: '2026-07-30' },
{ id: 'm8-13', syllabusId: 'G8-MATH', chapter: 7, chapterTitle: 'Sets', title: '7.1 Set notation & types', outcome: 'Use roster and set-builder notation', plannedPeriods: 3, targetDate: '2026-08-06' },
{ id: 'm8-14', syllabusId: 'G8-MATH', chapter: 7, chapterTitle: 'Sets', title: '7.2 Venn diagrams & operations', outcome: 'Represent union/intersection with Venn diagrams', plannedPeriods: 4, targetDate: '2026-08-20' },
{ id: 'm8-15', syllabusId: 'G8-MATH', chapter: 8, chapterTitle: 'Quadrilaterals', title: '8.1 Properties of parallelograms', outcome: 'Prove properties of parallelograms', plannedPeriods: 4, targetDate: '2026-09-03' },
{ id: 'm8-16', syllabusId: 'G8-MATH', chapter: 8, chapterTitle: 'Quadrilaterals', title: '8.2 Constructions', outcome: 'Construct quadrilaterals from given data', plannedPeriods: 4, targetDate: '2026-09-17' },
{ id: 'm8-17', syllabusId: 'G8-MATH', chapter: 9, chapterTitle: "Pythagoras' Theorem", title: '9.1 Statement & proof', outcome: 'State and prove the theorem', plannedPeriods: 3, targetDate: '2026-10-01' },
{ id: 'm8-18', syllabusId: 'G8-MATH', chapter: 9, chapterTitle: "Pythagoras' Theorem", title: '9.2 Converse', outcome: 'Test right angles using the converse', plannedPeriods: 3, targetDate: '2026-10-15' },
{ id: 'm8-19', syllabusId: 'G8-MATH', chapter: 9, chapterTitle: "Pythagoras' Theorem", title: '9.3 Applications', outcome: 'Solve distance and height problems', plannedPeriods: 3, targetDate: '2026-10-29' },
{ id: 'm8-20', syllabusId: 'G8-MATH', chapter: 10, chapterTitle: 'Circle', title: '10.1 Parts of a circle', outcome: 'Name and relate radius, chord, arc', plannedPeriods: 3, targetDate: '2026-11-05' },
{ id: 'm8-21', syllabusId: 'G8-MATH', chapter: 10, chapterTitle: 'Circle', title: '10.2 Chords & arcs', outcome: 'Prove chord-bisector theorem', plannedPeriods: 3, targetDate: '2026-11-12' },
{ id: 'm8-22', syllabusId: 'G8-MATH', chapter: 11, chapterTitle: 'Statistics', title: '11.1 Frequency tables & mean', outcome: 'Organise data and compute the mean', plannedPeriods: 3, targetDate: '2026-11-19' },
{ id: 'm7-01', syllabusId: 'G7-MATH', chapter: 1, chapterTitle: 'Rational Numbers', title: '1 Rational numbers', outcome: 'Operate on rational numbers', plannedPeriods: 10, targetDate: '2026-02-12' },
{ id: 'm7-02', syllabusId: 'G7-MATH', chapter: 2, chapterTitle: 'Proportion', title: '2 Ratio & proportion', outcome: 'Solve direct and inverse proportion', plannedPeriods: 10, targetDate: '2026-04-16' },
{ id: 'm7-03', syllabusId: 'G7-MATH', chapter: 3, chapterTitle: 'Algebraic Expressions', title: '3 Multiplying & dividing expressions', outcome: 'Multiply polynomials', plannedPeriods: 10, targetDate: '2026-05-21' },
{ id: 'm7-04', syllabusId: 'G7-MATH', chapter: 4, chapterTitle: 'Algebraic Formulae', title: '4 Algebraic formulae', outcome: 'Apply standard identities', plannedPeriods: 8, targetDate: '2026-07-09' },
{ id: 'm7-05', syllabusId: 'G7-MATH', chapter: 5, chapterTitle: 'Simple Equations', title: '5 Simple equations', outcome: 'Solve linear equations', plannedPeriods: 8, targetDate: '2026-08-13' },
{ id: 'm7-06', syllabusId: 'G7-MATH', chapter: 6, chapterTitle: 'Parallel Lines', title: '6 Parallel lines', outcome: 'Use angle properties of parallel lines', plannedPeriods: 8, targetDate: '2026-09-17' },
{ id: 'm7-07', syllabusId: 'G7-MATH', chapter: 7, chapterTitle: 'Triangles', title: '7 Triangles', outcome: 'Classify triangles and angle sums', plannedPeriods: 8, targetDate: '2026-10-22' },
{ id: 'm7-08', syllabusId: 'G7-MATH', chapter: 8, chapterTitle: 'Congruence', title: '8 Congruence of triangles', outcome: 'Prove congruence conditions', plannedPeriods: 8, targetDate: '2026-11-12' },
{ id: 'm7-09', syllabusId: 'G7-MATH', chapter: 9, chapterTitle: 'Information & Data', title: '9 Information & data', outcome: 'Draw bar and pie charts', plannedPeriods: 4, targetDate: '2026-11-19' },
{ id: 'h9-01', syllabusId: 'G9-HMATH', chapter: 1, chapterTitle: 'Sets & Functions', title: '1 Sets & functions', outcome: 'Define domain, range and inverse', plannedPeriods: 10, targetDate: '2026-02-19' },
{ id: 'h9-02', syllabusId: 'G9-HMATH', chapter: 2, chapterTitle: 'Algebraic Expressions', title: '2 Algebraic expressions', outcome: 'Factor theorem and remainder theorem', plannedPeriods: 10, targetDate: '2026-04-23' },
{ id: 'h9-03', syllabusId: 'G9-HMATH', chapter: 3, chapterTitle: 'Geometry', title: '3 Geometry', outcome: 'Apply Apollonius theorem', plannedPeriods: 8, targetDate: '2026-05-21' },
{ id: 'h9-04', syllabusId: 'G9-HMATH', chapter: 4, chapterTitle: 'Constructions', title: '4 Geometric constructions', outcome: 'Construct triangles and circles', plannedPeriods: 8, targetDate: '2026-07-23' },
{ id: 'h9-05', syllabusId: 'G9-HMATH', chapter: 5, chapterTitle: 'Equations', title: '5 Equations', outcome: 'Solve quadratic & simultaneous equations', plannedPeriods: 10, targetDate: '2026-08-27' },
{ id: 'h9-06', syllabusId: 'G9-HMATH', chapter: 6, chapterTitle: 'Inequalities', title: '6 Inequalities', outcome: 'Graph linear inequalities', plannedPeriods: 6, targetDate: '2026-09-24' },
{ id: 'h9-07', syllabusId: 'G9-HMATH', chapter: 7, chapterTitle: 'Infinite Series', title: '7.1 Sequences', outcome: 'Find nth term of sequences', plannedPeriods: 3, targetDate: '2026-10-28' },
{ id: 'h9-08', syllabusId: 'G9-HMATH', chapter: 7, chapterTitle: 'Infinite Series', title: '7.2 Infinite geometric series', outcome: 'Sum convergent geometric series', plannedPeriods: 4, targetDate: '2026-11-09' },
{ id: 'h9-09', syllabusId: 'G9-HMATH', chapter: 8, chapterTitle: 'Trigonometry', title: '8.1 Trigonometric ratios', outcome: 'Use radian measure and ratios', plannedPeriods: 4, targetDate: '2026-11-18' }];


/** Delivered periods per topic for courses with topic-level tracking. */
export const initialProgress: Record<string, Record<string, number>> = {
  '8A-MATH': { 'm8-01': 4, 'm8-02': 3, 'm8-03': 4, 'm8-04': 5, 'm8-05': 4, 'm8-06': 4, 'm8-07': 5, 'm8-08': 5, 'm8-09': 4, 'm8-10': 4, 'm8-11': 4, 'm8-12': 4, 'm8-13': 3, 'm8-14': 4, 'm8-15': 4, 'm8-16': 4, 'm8-17': 3, 'm8-18': 3, 'm8-19': 3, 'm8-20': 3 },
  '8B-MATH': { 'm8-01': 4, 'm8-02': 3, 'm8-03': 4, 'm8-04': 5, 'm8-05': 4, 'm8-06': 4, 'm8-07': 5, 'm8-08': 5, 'm8-09': 4, 'm8-10': 4, 'm8-11': 4, 'm8-12': 4, 'm8-13': 3, 'm8-14': 4, 'm8-15': 4, 'm8-16': 3, 'm8-17': 3, 'm8-18': 2 },
  '7A-MATH': { 'm7-01': 10, 'm7-02': 10, 'm7-03': 10, 'm7-04': 8, 'm7-05': 8, 'm7-06': 8, 'm7-07': 8, 'm7-08': 3 },
  '9A-HMATH': { 'h9-01': 10, 'h9-02': 10, 'h9-03': 8, 'h9-04': 8, 'h9-05': 10, 'h9-06': 6, 'h9-07': 3, 'h9-08': 1 }
};

/** Period-level coverage summaries for courses without topic-level tracking in this sample. */
export const courses: Course[] = [
{ id: '8A-MATH', sectionId: '8A', subjectId: 'MATH', teacherId: 'T01', syllabusId: 'G8-MATH', plannedYear: 0, plannedToDate: 0, deliveredToDate: 0 },
{ id: '8A-BAN', sectionId: '8A', subjectId: 'BAN', teacherId: 'T02', plannedYear: 180, plannedToDate: 158, deliveredToDate: 152 },
{ id: '8A-ENG', sectionId: '8A', subjectId: 'ENG', teacherId: 'T03', plannedYear: 180, plannedToDate: 158, deliveredToDate: 155 },
{ id: '8A-SCI', sectionId: '8A', subjectId: 'SCI', teacherId: 'T04', plannedYear: 144, plannedToDate: 126, deliveredToDate: 121 },
{ id: '8A-BGS', sectionId: '8A', subjectId: 'BGS', teacherId: 'T07', plannedYear: 144, plannedToDate: 126, deliveredToDate: 108 },
{ id: '8A-ICT', sectionId: '8A', subjectId: 'ICT', teacherId: 'T06', plannedYear: 108, plannedToDate: 95, deliveredToDate: 95 },
{ id: '8A-REL', sectionId: '8A', subjectId: 'REL', teacherId: 'T08', plannedYear: 144, plannedToDate: 126, deliveredToDate: 124 },
{ id: '8B-MATH', sectionId: '8B', subjectId: 'MATH', teacherId: 'T01', syllabusId: 'G8-MATH', plannedYear: 0, plannedToDate: 0, deliveredToDate: 0 },
{ id: '8B-BAN', sectionId: '8B', subjectId: 'BAN', teacherId: 'T02', plannedYear: 180, plannedToDate: 158, deliveredToDate: 150 },
{ id: '8B-ENG', sectionId: '8B', subjectId: 'ENG', teacherId: 'T03', plannedYear: 180, plannedToDate: 158, deliveredToDate: 146 },
{ id: '8B-SCI', sectionId: '8B', subjectId: 'SCI', teacherId: 'T04', plannedYear: 144, plannedToDate: 126, deliveredToDate: 122 },
{ id: '8B-BGS', sectionId: '8B', subjectId: 'BGS', teacherId: 'T07', plannedYear: 144, plannedToDate: 126, deliveredToDate: 120 },
{ id: '8B-ICT', sectionId: '8B', subjectId: 'ICT', teacherId: 'T06', plannedYear: 108, plannedToDate: 95, deliveredToDate: 88 },
{ id: '8B-REL', sectionId: '8B', subjectId: 'REL', teacherId: 'T08', plannedYear: 144, plannedToDate: 126, deliveredToDate: 126 },
{ id: '7A-MATH', sectionId: '7A', subjectId: 'MATH', teacherId: 'T01', syllabusId: 'G7-MATH', plannedYear: 0, plannedToDate: 0, deliveredToDate: 0 },
{ id: '7A-BAN', sectionId: '7A', subjectId: 'BAN', teacherId: 'T02', plannedYear: 180, plannedToDate: 158, deliveredToDate: 156 },
{ id: '7A-ENG', sectionId: '7A', subjectId: 'ENG', teacherId: 'T03', plannedYear: 180, plannedToDate: 158, deliveredToDate: 157 },
{ id: '7A-SCI', sectionId: '7A', subjectId: 'SCI', teacherId: 'T05', plannedYear: 144, plannedToDate: 126, deliveredToDate: 119 },
{ id: '7A-BGS', sectionId: '7A', subjectId: 'BGS', teacherId: 'T07', plannedYear: 144, plannedToDate: 126, deliveredToDate: 126 },
{ id: '7A-ICT', sectionId: '7A', subjectId: 'ICT', teacherId: 'T06', plannedYear: 108, plannedToDate: 95, deliveredToDate: 92 },
{ id: '7A-REL', sectionId: '7A', subjectId: 'REL', teacherId: 'T08', plannedYear: 144, plannedToDate: 126, deliveredToDate: 121 },
{ id: '9A-HMATH', sectionId: '9A', subjectId: 'HMATH', teacherId: 'T01', syllabusId: 'G9-HMATH', plannedYear: 0, plannedToDate: 0, deliveredToDate: 0 },
{ id: '9A-PHY', sectionId: '9A', subjectId: 'PHY', teacherId: 'T12', plannedYear: 180, plannedToDate: 158, deliveredToDate: 134 },
{ id: '9A-CHEM', sectionId: '9A', subjectId: 'CHEM', teacherId: 'T05', plannedYear: 144, plannedToDate: 126, deliveredToDate: 120 },
{ id: '9A-BIO', sectionId: '9A', subjectId: 'BIO', teacherId: 'T05', plannedYear: 108, plannedToDate: 95, deliveredToDate: 90 },
{ id: '9A-BAN', sectionId: '9A', subjectId: 'BAN', teacherId: 'T02', plannedYear: 180, plannedToDate: 158, deliveredToDate: 154 },
{ id: '9A-ENG', sectionId: '9A', subjectId: 'ENG', teacherId: 'T03', plannedYear: 180, plannedToDate: 158, deliveredToDate: 156 },
{ id: '9A-ICT', sectionId: '9A', subjectId: 'ICT', teacherId: 'T06', plannedYear: 108, plannedToDate: 95, deliveredToDate: 86 },
{ id: '9A-MATH', sectionId: '9A', subjectId: 'MATH', teacherId: 'T09', plannedYear: 144, plannedToDate: 126, deliveredToDate: 123 }];


export const planVersions: PlanVersion[] = [
{
  id: 'pv-12', version: 'v1.2', title: 'Pre-annual exam revision', status: 'submitted', author: 'Mahbub Alam', createdOn: '2026-10-30',
  changeReason: '8-B Mathematics fell behind after the board training absence; add revision time before the Annual Examination.',
  changes: ['Add 2 makeup periods for 8-B Pythagoras (Ch 9)', 'Move 8-A Ch 11 Statistics target from 19 Nov to 15 Nov', 'Insert revision week 16–20 Nov for Classes 6–9', '9-A Physics recovery: 4 extra periods with Kamrul Hasan while Imran Hossain is on leave'],
  history: [
  { at: '30 Oct 2026 · 15:12', actor: 'Mahbub Alam', action: 'Created draft from v1.1', tone: 'default' },
  { at: '30 Oct 2026 · 16:40', actor: 'Mahbub Alam', action: 'Submitted for principal approval', tone: 'info' }]

},
{
  id: 'pv-11', version: 'v1.1', title: 'Mid-year revision — Eid & flood closure', status: 'published', author: 'Mahbub Alam', createdOn: '2026-06-28',
  changeReason: 'Recover 6 lost days from the Uttara flood closure and rebalance Term 2.',
  changes: ['Shift Ch 6 targets by one week', 'Add Saturday remedial classes for Class 9 Physics (Uttara)', 'CT-2 window moved to 9–13 Aug'],
  history: [
  { at: '28 Jun 2026 · 11:02', actor: 'Mahbub Alam', action: 'Submitted for approval', tone: 'info' },
  { at: '29 Jun 2026 · 09:15', actor: 'Dr. Nasrin Akter', action: 'Approved', note: 'Proceed. Inform guardians of Saturday classes.', tone: 'success' },
  { at: '29 Jun 2026 · 09:16', actor: 'System', action: 'Published & locked; v1.0 superseded', tone: 'success' }]

},
{
  id: 'pv-10', version: 'v1.0', title: 'Annual Academic Plan 2026', status: 'superseded', author: 'Mahbub Alam', createdOn: '2025-12-20',
  changeReason: 'Initial annual plan.',
  changes: ['2 terms, 202 working days', 'Topic map for Classes 4–10', 'CT calendar: 4 windows', 'Half-Yearly & Annual exam windows'],
  history: [
  { at: '20 Dec 2025 · 14:30', actor: 'Mahbub Alam', action: 'Submitted for approval', tone: 'info' },
  { at: '02 Jan 2026 · 10:00', actor: 'Dr. Nasrin Akter', action: 'Approved & published', tone: 'success' }]

}];


export const todayPeriods: TodayPeriod[] = [
{
  id: 'tp1', period: 1, sectionId: '8A', subjectId: 'MATH', courseId: '8A-MATH', roomId: 'R201', plannedTopicId: 'm8-20', objective: 'Students can name and relate radius, diameter, chord and arc.',
  status: 'submitted', outcome: 'completed', actualTopicId: 'm8-20', note: 'Used paper-plate activity. Most students identified chords correctly.', sync: 'synced', submittedAt: '08:44',
  attendance: { S8A01: 'P', S8A02: 'P', S8A03: 'P', S8A04: 'P', S8A05: 'L', S8A06: 'P', S8A07: 'P', S8A08: 'P', S8A09: 'P', S8A10: 'P', S8A11: 'P', S8A12: 'P', S8A13: 'A', S8A14: 'P', S8A15: 'P', S8A16: 'P', S8A17: 'P', S8A18: 'P', S8A19: 'P', S8A20: 'P' }
},
{ id: 'tp2', period: 2, sectionId: '8B', subjectId: 'MATH', courseId: '8B-MATH', roomId: 'R202', plannedTopicId: 'm8-18', objective: 'Use the converse of Pythagoras to test for right angles.', status: 'upcoming' },
{ id: 'tp4', period: 4, sectionId: '9A', subjectId: 'HMATH', courseId: '9A-HMATH', roomId: 'R301', plannedTopicId: 'h9-08', objective: 'Find the sum to infinity of a convergent geometric series.', status: 'upcoming' },
{ id: 'tp5', period: 5, sectionId: '7A', subjectId: 'MATH', courseId: '7A-MATH', roomId: 'R105', plannedTopicId: 'm7-08', objective: 'Prove SAS and ASA congruence conditions.', status: 'upcoming' }];


export const makeupRequests: MakeupRequest[] = [
{
  id: 'MK-104', courseId: '8B-MATH', sectionId: '8B', subjectId: 'MATH', teacherId: 'T01', originalDate: '2026-11-01', originalPeriod: 3,
  reason: 'Teacher at board-assigned script evaluation workshop', topicId: 'm8-18', status: 'proposed',
  proposal: { date: '2026-11-04', day: 'Wed', period: 8, roomId: 'R202', teacherId: 'T01' },
  history: [
  { at: '01 Nov 2026 · 09:25', actor: 'System', action: 'Class marked missed — syllabus gap of 1 period on 9.2 Converse', tone: 'danger' },
  { at: '01 Nov 2026 · 14:10', actor: 'Farhana Rahman', action: 'Proposed makeup · Wed 4 Nov, Extra period (13:40), Room 202', tone: 'info' }]

},
{
  id: 'MK-103', courseId: '9A-PHY', sectionId: '9A', subjectId: 'PHY', teacherId: 'T12', originalDate: '2026-10-29', originalPeriod: 3,
  reason: 'Teacher on medical leave (Imran Hossain)', topicId: '', status: 'gap-open',
  history: [{ at: '29 Oct 2026 · 09:30', actor: 'System', action: 'Class cancelled — no substitute assigned', tone: 'danger' }]
},
{
  id: 'MK-102', courseId: '7A-MATH', sectionId: '7A', subjectId: 'MATH', teacherId: 'T01', originalDate: '2026-10-27', originalPeriod: 7,
  reason: 'Inter-house debate final (school event)', topicId: 'm7-08', status: 'approved',
  proposal: { date: '2026-11-03', day: 'Tue', period: 8, roomId: 'R105', teacherId: 'T01' },
  history: [
  { at: '27 Oct 2026 · 12:40', actor: 'Farhana Rahman', action: 'Marked cancelled · school event', tone: 'warning' },
  { at: '27 Oct 2026 · 15:02', actor: 'Farhana Rahman', action: 'Proposed makeup · Tue 3 Nov, Extra period', tone: 'info' },
  { at: '28 Oct 2026 · 08:10', actor: 'Dr. Nasrin Akter', action: 'Approved · guardians notified by SMS', tone: 'success' }]

},
{
  id: 'MK-101', courseId: '8A-SCI', sectionId: '8A', subjectId: 'SCI', teacherId: 'T04', originalDate: '2026-10-22', originalPeriod: 5,
  reason: 'Power outage — lab session not possible', topicId: '', status: 'completed',
  proposal: { date: '2026-10-25', day: 'Sun', period: 8, roomId: 'R201', teacherId: 'T04' },
  history: [
  { at: '22 Oct 2026 · 11:05', actor: 'Kamrul Hasan', action: 'Marked missed', tone: 'danger' },
  { at: '22 Oct 2026 · 16:20', actor: 'Dr. Nasrin Akter', action: 'Approved makeup', tone: 'success' },
  { at: '25 Oct 2026 · 14:25', actor: 'Kamrul Hasan', action: 'Makeup delivered · gap resolved', tone: 'success' }]

}];


export const homework: Homework[] = [
{ id: 'hw1', sectionId: '8A', subjectId: 'ENG', title: "Paragraph: 'A rainy day in Dhaka' (150 words)", assignedOn: '2026-11-01', due: '2026-11-04', teacherId: 'T03', submissions: 12 },
{ id: 'hw2', sectionId: '8A', subjectId: 'SCI', title: 'Worksheet 7 — food chains & webs', assignedOn: '2026-10-29', due: '2026-11-03', teacherId: 'T04', submissions: 17 },
{ id: 'hw3', sectionId: '8A', subjectId: 'MATH', title: 'Exercise 10.1 — Q1 to Q8', assignedOn: '2026-11-02', due: '2026-11-04', teacherId: 'T01', submissions: 0 },
{ id: 'hw4', sectionId: '4B', subjectId: 'BAN', title: 'হাতের লেখা — পৃষ্ঠা ২৪', assignedOn: '2026-11-01', due: '2026-11-03', teacherId: 'T11', submissions: 2 },
{ id: 'hw5', sectionId: '4B', subjectId: 'MATH', title: 'Multiplication tables 12–15 practice', assignedOn: '2026-10-30', due: '2026-11-05', teacherId: 'T09', submissions: 1 },
{ id: 'hw6', sectionId: '9A', subjectId: 'CHEM', title: 'Balance 10 chemical equations', assignedOn: '2026-11-01', due: '2026-11-05', teacherId: 'T05', submissions: 3 }];