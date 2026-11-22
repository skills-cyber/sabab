import type { Student } from '../types/school';
import type { BusRoute, RiderAssignment } from '../types/transport';
import { riderAssignments, routes as seedRoutes, zoneFees } from '../data/transport';

/** One-way riders pay this share of the zone fee. */
export const ONE_WAY_SHARE = 0.6;

/** Monthly transport fee for a rider: full zone fee for both ways, 60% for one way. */
export function riderFee(a: Pick<RiderAssignment, 'routeId' | 'mode'>, routes: BusRoute[] = seedRoutes): number {
  const zone = routes.find((r) => r.id === a.routeId)?.zone ?? 'A';
  return a.mode === 'both' ? zoneFees[zone] : Math.round(zoneFees[zone] * ONE_WAY_SHARE);
}

export function riderBillingLabel(a: Pick<RiderAssignment, 'routeId' | 'mode'>, routes: BusRoute[] = seedRoutes): string {
  const r = routes.find((x) => x.id === a.routeId);
  const way = a.mode === 'both' ? 'both ways' : a.mode === 'morning' ? 'morning only' : 'afternoon only';
  return `Transport · ${r?.name ?? a.routeId} (Zone ${r?.zone ?? 'A'}, ${way})`;
}

/** Stamps each seeded rider's monthly fee on the student so monthly dues bill the right zone. */
export function withTransportFees(list: Student[]): Student[] {
  return list.map((s) => {
    const a = riderAssignments.find((r) => r.studentId === s.id);
    return a ? { ...s, transport: true, transportFee: riderFee(a), transportLabel: riderBillingLabel(a) } : s;
  });
}