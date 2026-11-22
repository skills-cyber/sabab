import React from 'react';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { campuses } from '../../data/school';
import type { AdmissionsStore } from './useAdmissions';
import { cn } from '../../utils/cn';

interface SeatRow {
  id: string;
  grade: number;
  campusId: string;
  seats: number;
  applied: number;
  offered: number;
  admitted: number;
  waitlisted: number;
}

/** Seat plan per class & campus — seats are inline-editable; usage bar shows offered + admitted. */
export function SeatsTab({ store, campusId, canDecide }: {store: AdmissionsStore;campusId: string;canDecide: boolean;}) {
  const rows: SeatRow[] = Object.entries(store.seatStats).
  map(([k, v]) => {
    const [g, c] = k.split('-');
    return { id: k, grade: Number(g), campusId: c, ...v };
  }).
  filter((r) => campusId === 'all' || r.campusId === campusId).
  sort((a, b) => a.grade - b.grade || a.campusId.localeCompare(b.campusId));

  const columns: Column<SeatRow>[] = [
  { id: 'class', header: 'Class', sortValue: (r) => r.grade, cell: (r) => <span className="font-medium">Class {r.grade} <span className="font-normal text-muted-foreground">· {campuses.find((c) => c.id === r.campusId)?.short}</span></span> },
  {
    id: 'seats', header: 'Seats', align: 'right', sortValue: (r) => r.seats, cell: (r) => <span className="tabular">{r.seats}</span>,
    edit: {
      value: (r) => String(r.seats), type: 'number',
      lockedReason: () => !canDecide ? 'Only the principal or owner can change seats.' : null,
      onSave: (r, v) => {const n = Number(v);if (!Number.isInteger(n) || n < 0 || n > 200) return '0–200';if (n < r.offered + r.admitted) return `At least ${r.offered + r.admitted} (already offered/admitted)`;store.setSeatCount(r.grade, r.campusId, n);}
    }
  },
  { id: 'applied', header: 'Applied', align: 'right', sortValue: (r) => r.applied, cell: (r) => <span className="tabular">{r.applied}</span> },
  { id: 'offered', header: 'Offered', align: 'right', cell: (r) => <span className="tabular">{r.offered}</span> },
  { id: 'admitted', header: 'Admitted', align: 'right', cell: (r) => <span className="tabular">{r.admitted}</span> },
  { id: 'wait', header: 'Waitlist', align: 'right', cell: (r) => <span className={cn('tabular', r.waitlisted > 0 && 'text-warning')}>{r.waitlisted}</span> },
  {
    id: 'fill', header: 'Filled', sortValue: (r) => r.seats ? (r.offered + r.admitted) / r.seats : 0, cell: (r) => {
      const used = r.offered + r.admitted;
      const p = r.seats ? Math.min(100, Math.round(used / r.seats * 100)) : 0;
      return (
        <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><span className={cn('block h-full rounded-full', p >= 100 ? 'bg-danger' : p >= 75 ? 'bg-warning' : 'bg-primary')} style={{ width: `${p}%` }} /></span>
            <span className="text-[12px] tabular text-muted-foreground">{r.seats ? `${Math.max(0, r.seats - used)} left` : 'No plan'}</span>
          </span>);

    }
  }];


  return <DataTable ariaLabel="Seat plan" rows={rows} columns={columns} getRowId={(r) => r.id} footerNote="Seats counted as offered + admitted. Waitlisted applicants are offered automatically from the merit list." />;
}