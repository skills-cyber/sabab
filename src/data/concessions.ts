import type { Concession } from '../types/concessions';

export const concessions: Concession[] = [
{
  id: 'CN-101', studentId: 'S8A10', type: 'merit', basis: 'percent', value: 50, from: '2026-01', to: '2026-12',
  reason: 'Top of Class 7 annual exam 2025', status: 'approved', requestedBy: 'Farzana Rahman',
  history: [{ at: '2 Jan 2026 · 10:10', actor: 'Farzana Rahman', action: 'Requested', tone: 'info' }, { at: '3 Jan 2026 · 09:00', actor: 'Dr. Nasreen Ahmed', action: 'Approved', tone: 'success' }]
},
{
  id: 'CN-102', studentId: 'S8A07', type: 'sibling', basis: 'percent', value: 10, from: '2026-01',
  reason: 'Younger sibling in 4-B (S4B01)', status: 'approved', requestedBy: 'Mizanur Rahman',
  history: [{ at: '3 Jan 2026 · 11:40', actor: 'Mizanur Rahman', action: 'Requested', tone: 'info' }, { at: '3 Jan 2026 · 11:40', actor: 'Mizanur Rahman', action: 'Auto-approved (under limit)', tone: 'success' }]
},
{
  id: 'CN-103', studentId: 'S4B01', type: 'hardship', basis: 'fixed', value: 2500, from: '2026-12', to: '2027-03',
  reason: 'Father lost job in October — guardian letter on file', status: 'pending', requestedBy: 'Mizanur Rahman',
  history: [{ at: '1 Nov 2026 · 15:20', actor: 'Mizanur Rahman', action: 'Requested', tone: 'info' }]
}];