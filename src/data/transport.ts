import type { BusRoute, RiderAssignment, TransportStaff, Trip, Vehicle } from '../types/transport';

/** FICTIONAL transport sample — routes, fleet and riders for the Mirpur & Uttara campuses. */

export const zoneFees: Record<BusRoute['zone'], number> = { A: 1200, B: 1500, C: 1800 };

export const transportStaff: TransportStaff[] = [
{ id: 'DR1', name: 'Abul Kalam', role: 'Driver', phone: '01711-700001', licenseNo: 'DK-0045821', licenseUntil: '2027-08-30' },
{ id: 'DR2', name: 'Motiur Rahman', role: 'Driver', phone: '01811-700002', licenseNo: 'DK-0091244', licenseUntil: '2026-11-20' },
{ id: 'DR3', name: 'Jasim Uddin', role: 'Driver', phone: '01911-700003', licenseNo: 'DK-0078310', licenseUntil: '2028-02-14' },
{ id: 'DR4', name: 'Harun Mia', role: 'Driver', phone: '01611-700004', licenseNo: 'DK-0102277', licenseUntil: '2027-05-01' },
{ id: 'AT1', name: 'Rehana Begum', role: 'Attendant', phone: '01711-700011' },
{ id: 'AT2', name: 'Shefali Akter', role: 'Attendant', phone: '01811-700012' },
{ id: 'AT3', name: 'Morjina Khatun', role: 'Attendant', phone: '01911-700013' }];


export const vehicles: Vehicle[] = [
{ id: 'BUS-01', regNo: 'Dhaka Metro-JA 11-2201', model: 'Ashok Leyland Falcon · 40 seat', capacity: 40, fitnessUntil: '2027-03-15', taxTokenUntil: '2027-01-31', insuranceUntil: '2027-02-28', routePermitUntil: '2027-06-30', odometer: 84210, status: 'active', gps: true, maintenance: [{ on: '2026-10-05', work: 'Engine oil & filter', cost: 6800, odometer: 83100 }, { on: '2026-07-12', work: 'Brake pads (front)', cost: 9200, odometer: 79850 }] },
{ id: 'BUS-02', regNo: 'Dhaka Metro-JA 11-2202', model: 'Tata LP 712 · 36 seat', capacity: 36, fitnessUntil: '2026-11-18', taxTokenUntil: '2027-01-31', insuranceUntil: '2026-12-10', routePermitUntil: '2027-06-30', odometer: 112480, status: 'active', gps: true, maintenance: [{ on: '2026-09-22', work: 'AC servicing', cost: 12500, odometer: 111020 }] },
{ id: 'MB-03', regNo: 'Dhaka Metro-CHA 15-7731', model: 'Toyota Hiace · 14 seat', capacity: 14, fitnessUntil: '2027-05-01', taxTokenUntil: '2026-10-31', insuranceUntil: '2027-04-30', routePermitUntil: '2027-06-30', odometer: 56300, status: 'active', gps: false, maintenance: [] },
{ id: 'BUS-04', regNo: 'Dhaka Metro-JA 14-0915', model: 'Ashok Leyland Falcon · 40 seat', capacity: 40, fitnessUntil: '2027-09-10', taxTokenUntil: '2027-01-31', insuranceUntil: '2027-08-31', routePermitUntil: '2027-06-30', odometer: 23110, status: 'maintenance', gps: true, maintenance: [{ on: '2026-11-01', work: 'Gearbox repair — in workshop', cost: 0, odometer: 23110 }] }];


export const routes: BusRoute[] = [
{
  id: 'R1', name: 'Kazipara – Shewrapara', campusId: 'mirpur', zone: 'A', vehicleId: 'BUS-01', driverId: 'DR1', attendantId: 'AT1', status: 'active',
  stops: [
  { id: 'R1-1', name: 'Kazipara bus stand', pickup: '06:55', drop: '14:35' },
  { id: 'R1-2', name: 'Shewrapara metro', pickup: '07:05', drop: '14:25' },
  { id: 'R1-3', name: 'Taltola', pickup: '07:15', drop: '14:15' },
  { id: 'R1-4', name: 'Mirpur 10 roundabout', pickup: '07:30', drop: '14:05' }]

},
{
  id: 'R2', name: 'Pallabi – Rupnagar', campusId: 'mirpur', zone: 'B', vehicleId: 'BUS-02', driverId: 'DR2', attendantId: 'AT2', status: 'active',
  stops: [
  { id: 'R2-1', name: 'Pallabi Ext. 11', pickup: '06:50', drop: '14:40' },
  { id: 'R2-2', name: 'Rupnagar R/A', pickup: '07:05', drop: '14:25' },
  { id: 'R2-3', name: 'Section 12 Block D', pickup: '07:15', drop: '14:15' }]

},
{
  id: 'R3', name: 'Mohammadpur – Shyamoli', campusId: 'mirpur', zone: 'C', vehicleId: 'MB-03', driverId: 'DR3', attendantId: null, status: 'active',
  stops: [
  { id: 'R3-1', name: 'Mohammadpur Town Hall', pickup: '06:40', drop: '14:50' },
  { id: 'R3-2', name: 'Shyamoli Square', pickup: '06:55', drop: '14:35' },
  { id: 'R3-3', name: 'Technical crossing', pickup: '07:10', drop: '14:20' }]

},
{
  id: 'U1', name: 'Uttara Sector 4 – 11', campusId: 'uttara', zone: 'A', vehicleId: 'BUS-04', driverId: 'DR4', attendantId: 'AT3', status: 'active',
  stops: [
  { id: 'U1-1', name: 'Sector 4 park', pickup: '07:00', drop: '14:30' },
  { id: 'U1-2', name: 'Sector 11 market', pickup: '07:15', drop: '14:15' }]

}];


export const riderAssignments: RiderAssignment[] = [
{ studentId: 'S8A02', routeId: 'R1', stopId: 'R1-1', since: '2026-01-05', mode: 'both' },
{ studentId: 'S8A05', routeId: 'R1', stopId: 'R1-2', since: '2026-01-05', mode: 'both' },
{ studentId: 'S8A07', routeId: 'R2', stopId: 'R2-1', since: '2026-01-05', mode: 'both' },
{ studentId: 'S4B01', routeId: 'R2', stopId: 'R2-1', since: '2026-01-05', mode: 'both' },
{ studentId: 'S8A12', routeId: 'R1', stopId: 'R1-3', since: '2026-02-01', mode: 'morning' },
{ studentId: 'S8A16', routeId: 'R3', stopId: 'R3-2', since: '2026-01-05', mode: 'both' },
{ studentId: 'S8B02', routeId: 'R2', stopId: 'R2-2', since: '2026-03-10', mode: 'both' },
{ studentId: 'S7A02', routeId: 'R3', stopId: 'R3-1', since: '2026-01-05', mode: 'both' },
{ studentId: 'S9A02', routeId: 'R1', stopId: 'R1-4', since: '2026-01-05', mode: 'afternoon' },
{ studentId: 'S9A06', routeId: 'R2', stopId: 'R2-3', since: '2026-01-05', mode: 'both' },
{ studentId: 'SU601', routeId: 'U1', stopId: 'U1-1', since: '2026-01-05', mode: 'both' }];


/** Today's (Mon 2 Nov 2026) trips — morning already run, afternoon pending. */
export const trips: Trip[] = [
{ id: 'T-R1-AM', routeId: 'R1', leg: 'morning', state: 'arrived', delayMin: 0, departedAt: '06:52', arrivedAt: '07:41', boarded: ['S8A02', 'S8A05', 'S8A12'] },
{ id: 'T-R2-AM', routeId: 'R2', leg: 'morning', state: 'arrived', delayMin: 12, departedAt: '06:58', arrivedAt: '07:52', boarded: ['S8A07', 'S4B01', 'S8B02', 'S9A06'], note: 'Traffic at Rupnagar' },
{ id: 'T-R3-AM', routeId: 'R3', leg: 'morning', state: 'arrived', delayMin: 0, departedAt: '06:40', arrivedAt: '07:35', boarded: ['S7A02'] },
{ id: 'T-U1-AM', routeId: 'U1', leg: 'morning', state: 'cancelled', delayMin: 0, boarded: [], note: 'BUS-04 in workshop — guardians informed' },
{ id: 'T-R1-PM', routeId: 'R1', leg: 'afternoon', state: 'scheduled', delayMin: 0, boarded: [] },
{ id: 'T-R2-PM', routeId: 'R2', leg: 'afternoon', state: 'scheduled', delayMin: 0, boarded: [] },
{ id: 'T-R3-PM', routeId: 'R3', leg: 'afternoon', state: 'scheduled', delayMin: 0, boarded: [] },
{ id: 'T-U1-PM', routeId: 'U1', leg: 'afternoon', state: 'scheduled', delayMin: 0, boarded: [] }];