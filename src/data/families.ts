import type { Family } from '../types/family';

/**
 * FICTIONAL SAMPLE DATA — extra household details layered on top of the families that are
 * grouped automatically from student guardian phone numbers (see utils/family.ts).
 */
export const familyDetails: Array<Pick<Family, 'phone'> & Partial<Family>> = [
{
  phone: '01713-555707', guardianNameBn: 'শহিদুল ইসলাম', nid: '1978261234501', address: 'House 14, Road 3, Section 10, Mirpur, Dhaka',
  secondary: { name: 'Farzana Islam', relation: 'Mother', phone: '01819-555708' }, portalEnabled: true, lastLogin: '02 Nov 2026 · 07:45'
},
{
  phone: '01914-300820', guardianNameBn: 'গোপাল সাহা', address: 'Kazipara, Mirpur, Dhaka',
  secondary: { name: 'Rita Saha', relation: 'Mother', phone: '01914-300821' }, portalEnabled: true, lastLogin: '28 Oct 2026 · 21:10'
},
{ phone: '01712-300801', portalEnabled: true, lastLogin: '01 Nov 2026 · 19:02' },
{ phone: '01819-300802', portalEnabled: true, lastLogin: '30 Oct 2026 · 08:15' },
{ phone: '01914-300808', portalEnabled: false }];


/** Phone number of the signed-in sample guardian (Parent portal). */
export const PORTAL_GUARDIAN_PHONE = '01713-555707';