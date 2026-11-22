import { useCallback, useMemo, useState } from 'react';
import { routes as seedRoutes, vehicles as seedVehicles, riderAssignments as seedRiders, trips as seedTrips, transportStaff } from '../../data/transport';
import { useAdmin } from '../../contexts/AdminContext';
import type { BusRoute, RiderAssignment, Stop, Trip, Vehicle } from '../../types/transport';
import { TODAY } from '../../utils/format';
import { riderBillingLabel, riderFee } from '../../utils/transportFees';

/** Days until an ISO date from TODAY (negative = past). */
export const daysUntil = (iso: string) => Math.round((new Date(iso).getTime() - new Date(TODAY).getTime()) / 86400000);

/** Compliance state for a document expiry date (30-day warning window). */
export const expiryState = (iso: string): 'expired' | 'expiring' | 'active' => {
  const d = daysUntil(iso);
  return d < 0 ? 'expired' : d <= 30 ? 'expiring' : 'active';
};

export const DOC_FIELDS: Array<{key: 'fitnessUntil' | 'taxTokenUntil' | 'insuranceUntil' | 'routePermitUntil';label: string;}> = [
{ key: 'fitnessUntil', label: 'Fitness' },
{ key: 'taxTokenUntil', label: 'Tax token' },
{ key: 'insuranceUntil', label: 'Insurance' },
{ key: 'routePermitUntil', label: 'Route permit' }];


const clock = () => new Date().toTimeString().slice(0, 5);

/** Local transport store — frontend contract for future /transport APIs. All writes are audited. */
export function useTransport() {
  const { students, updateStudent, addAudit, queueMessage } = useAdmin();
  const [routes, setRoutes] = useState<BusRoute[]>(seedRoutes);
  const [vehicles, setVehicles] = useState<Vehicle[]>(seedVehicles);
  const [riders, setRiders] = useState<RiderAssignment[]>(seedRiders);
  const [trips, setTrips] = useState<Trip[]>(seedTrips);
  const staff = transportStaff;

  const ridersOf = useCallback((routeId: string) => riders.filter((r) => r.routeId === routeId), [riders]);
  const vehicleOf = (routeId: string) => vehicles.find((v) => v.id === routes.find((r) => r.id === routeId)?.vehicleId);
  const loadOf = (routeId: string) => {
    const v = vehicleOf(routeId);
    const n = ridersOf(routeId).length;
    return { riders: n, capacity: v?.capacity ?? 0, pct: v ? Math.round(n / v.capacity * 100) : 0 };
  };

  const complianceAlerts = useMemo(() => {
    const list: Array<{id: string;label: string;state: 'expired' | 'expiring';date: string;}> = [];
    vehicles.filter((v) => v.status !== 'retired').forEach((v) => DOC_FIELDS.forEach((d) => {
      const s = expiryState(v[d.key]);
      if (s !== 'active') list.push({ id: `${v.id}-${d.key}`, label: `${v.id} ${d.label}`, state: s, date: v[d.key] });
    }));
    staff.forEach((s) => {
      if (s.licenseUntil) {
        const st = expiryState(s.licenseUntil);
        if (st !== 'active') list.push({ id: `${s.id}-lic`, label: `${s.name} driving licence`, state: st, date: s.licenseUntil });
      }
    });
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [vehicles, staff]);

  // ---- Riders ----
  const assignRider = (a: RiderAssignment) => {
    const prev = riders.find((r) => r.studentId === a.studentId);
    setRiders((l) => [...l.filter((r) => r.studentId !== a.studentId), a]);
    updateStudent(a.studentId, { transport: true, transportFee: riderFee(a, routes), transportLabel: riderBillingLabel(a, routes) });
    addAudit('Transport', prev ? 'Rider moved' : 'Rider assigned', `${a.studentId} → ${a.routeId}/${a.stopId}`);
  };
  const removeRider = (studentId: string, reason: string) => {
    setRiders((l) => l.filter((r) => r.studentId !== studentId));
    updateStudent(studentId, { transport: false, transportFee: undefined, transportLabel: undefined });
    addAudit('Transport', 'Rider removed', `${studentId} · ${reason}`, 'warning');
  };

  // ---- Routes ----
  const updateRoute = (id: string, patch: Partial<BusRoute>, action = 'Route updated') => {
    setRoutes((l) => l.map((r) => r.id === id ? { ...r, ...patch } : r));
    addAudit('Transport', action, id);
  };
  const addRoute = (r: Omit<BusRoute, 'id' | 'stops' | 'status'> & {stops: Omit<Stop, 'id'>[];}) => {
    const prefix = r.campusId === 'uttara' ? 'U' : 'R';
    let n = routes.filter((x) => x.campusId === r.campusId).length + 1;
    while (routes.some((x) => x.id === `${prefix}${n}`)) n++;
    const id = `${prefix}${n}`;
    const route: BusRoute = { ...r, id, status: 'active', stops: r.stops.map((s, i) => ({ ...s, id: `${id}-${i + 1}` })) };
    setRoutes((l) => [...l, route]);
    setTrips((l) => [...l, { id: `T-${id}-PM`, routeId: id, leg: 'afternoon', state: 'scheduled', delayMin: 0, boarded: [] }]);
    addAudit('Transport', 'Route created', `${id} ${r.name}`);
    return id;
  };
  const updateStop = (routeId: string, stopId: string, patch: Partial<Stop>) => {
    setRoutes((l) => l.map((r) => r.id === routeId ? { ...r, stops: r.stops.map((s) => s.id === stopId ? { ...s, ...patch } : s) } : r));
    addAudit('Transport', 'Stop updated', `${routeId}/${stopId}`);
  };
  const addStop = (routeId: string, s: Omit<Stop, 'id'>) => {
    setRoutes((l) => l.map((r) => r.id === routeId ? { ...r, stops: [...r.stops, { ...s, id: `${routeId}-${Date.now().toString().slice(-4)}` }].sort((a, b) => a.pickup.localeCompare(b.pickup)) } : r));
    addAudit('Transport', 'Stop added', `${routeId} · ${s.name}`);
  };
  const removeStop = (routeId: string, stopId: string) => {
    setRoutes((l) => l.map((r) => r.id === routeId ? { ...r, stops: r.stops.filter((s) => s.id !== stopId) } : r));
    addAudit('Transport', 'Stop removed', `${routeId}/${stopId}`, 'warning');
  };

  // ---- Fleet ----
  const updateVehicle = (id: string, patch: Partial<Vehicle>, action = 'Vehicle updated') => {
    setVehicles((l) => l.map((v) => v.id === id ? { ...v, ...patch } : v));
    addAudit('Transport', action, id);
  };
  const addVehicle = (v: Omit<Vehicle, 'maintenance'>) => {
    setVehicles((l) => [...l, { ...v, maintenance: [] }]);
    addAudit('Transport', 'Vehicle added', `${v.id} ${v.regNo}`);
  };
  const logMaintenance = (id: string, entry: Vehicle['maintenance'][number], toWorkshop: boolean) => {
    setVehicles((l) => l.map((v) => v.id === id ? { ...v, odometer: Math.max(v.odometer, entry.odometer), status: toWorkshop ? 'maintenance' : v.status, maintenance: [entry, ...v.maintenance] } : v));
    addAudit('Transport', 'Maintenance logged', `${id} · ${entry.work} · ৳${entry.cost}`);
  };

  // ---- Trips (today) ----
  const notifyRoute = (routeId: string, body: string, template: string) => {
    const ids = ridersOf(routeId).map((r) => r.studentId);
    const list = students.filter((s) => ids.includes(s.id) && s.smsOptIn);
    if (list.length) queueMessage({ channel: 'SMS', audience: `Route ${routeId} guardians`, recipients: list.length, template, body, credits: list.length });
    return list.length;
  };
  const patchTrip = (id: string, patch: Partial<Trip>) => setTrips((l) => l.map((t) => t.id === id ? { ...t, ...patch } : t));
  const depart = (id: string) => {
    patchTrip(id, { state: 'departed', departedAt: clock() });
    addAudit('Transport', 'Trip departed', id);
  };
  const arrive = (id: string) => {
    const t = trips.find((x) => x.id === id);
    patchTrip(id, { state: 'arrived', arrivedAt: clock() });
    addAudit('Transport', 'Trip completed', id);
    return t ? notifyRoute(t.routeId, t.leg === 'afternoon' ? 'Your child has been dropped at the stop.' : 'Bus reached school.', 'Trip completed') : 0;
  };
  const markDelay = (id: string, minutes: number, note: string) => {
    const t = trips.find((x) => x.id === id);
    patchTrip(id, { state: 'delayed', delayMin: minutes, note });
    addAudit('Transport', 'Trip delayed', `${id} · ${minutes} min · ${note}`, 'warning');
    return t ? notifyRoute(t.routeId, `Bus delayed by about ${minutes} min. ${note}`, 'Bus delay') : 0;
  };
  const cancelTrip = (id: string, reason: string) => {
    const t = trips.find((x) => x.id === id);
    patchTrip(id, { state: 'cancelled', note: reason });
    addAudit('Transport', 'Trip cancelled', `${id} · ${reason}`, 'warning');
    return t ? notifyRoute(t.routeId, `Today's bus is cancelled: ${reason}. Please arrange pickup.`, 'Bus cancelled') : 0;
  };
  const toggleBoard = (id: string, studentId: string) => setTrips((l) => l.map((t) => t.id === id ? { ...t, boarded: t.boarded.includes(studentId) ? t.boarded.filter((x) => x !== studentId) : [...t.boarded, studentId] } : t));
  const boardAll = (id: string, ids: string[]) => patchTrip(id, { boarded: ids });

  return {
    routes, vehicles, riders, trips, staff, students, complianceAlerts,
    ridersOf, vehicleOf, loadOf,
    assignRider, removeRider, updateRoute, addRoute, updateStop, addStop, removeStop,
    updateVehicle, addVehicle, logMaintenance,
    depart, arrive, markDelay, cancelTrip, toggleBoard, boardAll
  };
}

export type TransportStore = ReturnType<typeof useTransport>;