import type { FeeHead } from '../types/finance';

/** Amounts keyed by grade. Configurable per academic year (sample values). */
export const feeHeads: FeeHead[] = [
{ id: 'TUI', name: 'Tuition fee', bn: 'বেতন', frequency: 'Monthly', optional: false, amounts: { '4': 1800, '6': 2000, '7': 2200, '8': 2400, '9': 2800 } },
{ id: 'ICT', name: 'ICT lab fee', bn: 'আইসিটি ল্যাব ফি', frequency: 'Monthly', optional: false, amounts: { '4': 0, '6': 300, '7': 300, '8': 300, '9': 400 } },
{ id: 'TRN', name: 'Transport', bn: 'পরিবহন', frequency: 'Monthly', optional: true, amounts: { '4': 1500, '6': 1500, '7': 1500, '8': 1500, '9': 1500 } },
{ id: 'EXM', name: 'Annual exam fee', bn: 'বার্ষিক পরীক্ষা ফি', frequency: 'Per exam', optional: false, amounts: { '4': 600, '6': 800, '7': 800, '8': 900, '9': 1000 } },
{ id: 'SES', name: 'Session fee', bn: 'সেশন ফি', frequency: 'Annual', optional: false, amounts: { '4': 4000, '6': 5000, '7': 5000, '8': 5500, '9': 6000 } },
{ id: 'LATE', name: 'Late payment fine', bn: 'বিলম্ব জরিমানা', frequency: 'Per occurrence', optional: false, amounts: { '4': 100, '6': 100, '7': 100, '8': 100, '9': 100 } }];


export const paymentMethods = [
{ id: 'Cash', label: 'Cash', bn: 'নগদ', needsRef: false },
{ id: 'Bank', label: 'Bank deposit', bn: 'ব্যাংক', needsRef: true },
{ id: 'bKash', label: 'bKash', bn: 'বিকাশ', needsRef: true },
{ id: 'Nagad', label: 'Nagad', bn: 'নগদ (MFS)', needsRef: true }] as
const;