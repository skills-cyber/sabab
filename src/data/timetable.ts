import type { Day } from '../types/academic';

/** Weekly routine per section — period 1..7 subject codes (FICTIONAL SAMPLE). */
export const routineGrid: Array<{sectionId: string;day: Day;subjects: string[];}> = [
{ sectionId: '8A', day: 'Sun', subjects: ['BAN', 'MATH', 'ENG', 'SCI', 'BGS', 'REL', 'PE'] },
{ sectionId: '8A', day: 'Mon', subjects: ['MATH', 'ENG', 'BAN', 'SCI', 'ICT', 'ART', 'REL'] },
{ sectionId: '8A', day: 'Tue', subjects: ['ENG', 'BAN', 'MATH', 'BGS', 'SCI', 'ICT', 'PE'] },
{ sectionId: '8A', day: 'Wed', subjects: ['MATH', 'BAN', 'ENG', 'REL', 'SCI', 'BGS', 'ART'] },
{ sectionId: '8A', day: 'Thu', subjects: ['BAN', 'ENG', 'MATH', 'ICT', 'REL', 'SCI', 'BGS'] },
{ sectionId: '8B', day: 'Sun', subjects: ['PE', 'BAN', 'MATH', 'ENG', 'SCI', 'BGS', 'REL'] },
{ sectionId: '8B', day: 'Mon', subjects: ['REL', 'MATH', 'ENG', 'BAN', 'SCI', 'ICT', 'ART'] },
{ sectionId: '8B', day: 'Tue', subjects: ['PE', 'ENG', 'BAN', 'MATH', 'BGS', 'SCI', 'ICT'] },
{ sectionId: '8B', day: 'Wed', subjects: ['ART', 'MATH', 'BAN', 'ENG', 'REL', 'SCI', 'BGS'] },
{ sectionId: '8B', day: 'Thu', subjects: ['BGS', 'BAN', 'ENG', 'MATH', 'ICT', 'REL', 'SCI'] },
{ sectionId: '7A', day: 'Sun', subjects: ['SCI', 'BGS', 'REL', 'PE', 'BAN', 'MATH', 'ENG'] },
{ sectionId: '7A', day: 'Mon', subjects: ['SCI', 'ICT', 'ART', 'REL', 'MATH', 'ENG', 'BAN'] },
{ sectionId: '7A', day: 'Tue', subjects: ['BGS', 'SCI', 'ICT', 'PE', 'ENG', 'BAN', 'MATH'] },
{ sectionId: '7A', day: 'Wed', subjects: ['REL', 'SCI', 'BGS', 'ART', 'MATH', 'BAN', 'ENG'] },
{ sectionId: '7A', day: 'Thu', subjects: ['ICT', 'REL', 'SCI', 'BGS', 'BAN', 'ENG', 'MATH'] },
{ sectionId: '9A', day: 'Sun', subjects: ['HMATH', 'PHY', 'CHEM', 'BAN', 'ENG', 'ICT', 'MATH'] },
{ sectionId: '9A', day: 'Mon', subjects: ['PHY', 'BAN', 'CHEM', 'HMATH', 'ENG', 'MATH', 'BIO'] },
{ sectionId: '9A', day: 'Tue', subjects: ['HMATH', 'PHY', 'CHEM', 'BAN', 'MATH', 'ENG', 'ICT'] },
{ sectionId: '9A', day: 'Wed', subjects: ['PHY', 'ICT', 'HMATH', 'BIO', 'BAN', 'ENG', 'REL'] },
{ sectionId: '9A', day: 'Thu', subjects: ['HMATH', 'CHEM', 'PHY', 'ENG', 'MATH', 'BAN', 'BIO'] }];


/** Teacher allocation per section & subject. */
export const teacherAllocation: Record<string, Record<string, string>> = {
  '8A': { BAN: 'T02', ENG: 'T03', MATH: 'T01', SCI: 'T04', BGS: 'T07', ICT: 'T06', REL: 'T08', PE: 'T10', ART: 'T11' },
  '8B': { BAN: 'T02', ENG: 'T03', MATH: 'T01', SCI: 'T04', BGS: 'T07', ICT: 'T06', REL: 'T08', PE: 'T10', ART: 'T11' },
  '7A': { BAN: 'T02', ENG: 'T03', MATH: 'T01', SCI: 'T05', BGS: 'T07', ICT: 'T06', REL: 'T08', PE: 'T10', ART: 'T11' },
  '9A': { BAN: 'T02', ENG: 'T03', HMATH: 'T01', PHY: 'T12', CHEM: 'T05', BIO: 'T05', ICT: 'T06', REL: 'T08', MATH: 'T09' }
};

/** Required weekly periods per subject (curriculum rule) used for frequency checks. */
export const weeklyRequirement: Record<string, Record<string, number>> = {
  '8A': { BAN: 5, ENG: 5, MATH: 5, SCI: 4, BGS: 4, REL: 4, ICT: 3, PE: 2, ART: 2 },
  '8B': { BAN: 5, ENG: 5, MATH: 5, SCI: 4, BGS: 4, REL: 4, ICT: 3, PE: 2, ART: 2 },
  '7A': { BAN: 5, ENG: 5, MATH: 5, SCI: 4, BGS: 4, REL: 4, ICT: 3, PE: 2, ART: 2 },
  '9A': { BAN: 5, ENG: 5, HMATH: 5, PHY: 5, CHEM: 4, BIO: 3, ICT: 3, MATH: 4, REL: 2 }
};