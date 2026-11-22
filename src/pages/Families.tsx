import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BadgeCheck, Download, Eye, Home, KeyRound, MessageSquare, ShieldAlert, Users, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/common/PageHeader';
import { KpiStrip } from '../components/common/KpiStrip';
import { DataTable, type Column } from '../components/common/DataTable/DataTable';
import { Segmented } from '../components/common/Segmented';
import { PersonCell } from '../components/common/PersonCell';
import { Button } from '../components/ui/Button';
import { StudentsNav } from '../components/students/StudentsNav';
import { FamilySheet } from '../components/families/FamilySheet';
import { useAdmin } from '../contexts/AdminContext';
import { useApp } from '../contexts/AppContext';
import type { Family } from '../types/family';
import { childrenOf } from '../utils/family';
import { invoiceBalance } from '../utils/fees';
import { sectionLabel } from '../utils/timetable';
import { downloadCsv, formatBDT } from '../utils/format';
import { cn } from '../utils/cn';

type Filter = 'all' | 'dues' | 'unverified' | 'multi';

interface FamilyRow extends Family {
  kids: ReturnType<typeof childrenOf>;
  due: number;
  previous: number;
  concessions: number;
}

/** Students › Families — one record per household, combined dues and portal access. */
export function Families() {
  const { families, students, invoices, concessions, queueMessage, previousYearDueFor } = useAdmin();
  const { role, campusId } = useApp();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>('all');
  const [viewId, setViewId] = useState<string | null>(null);
  const canSeeFees = role !== 'coordinator';

  useEffect(() => {
    const id = params.get('id');
    if (id) {setViewId(id);params.delete('id');setParams(params, { replace: true });}
  }, [params, setParams]);

  const all = useMemo<FamilyRow[]>(() => families.map((f) => {
    const kids = childrenOf(f.id, students);
    const ids = kids.map((k) => k.id);
    return {
      ...f, kids,
      due: invoices.filter((i) => ids.includes(i.studentId)).reduce((t, i) => t + invoiceBalance(i), 0),
      previous: previousYearDueFor(ids),
      concessions: concessions.filter((c) => ids.includes(c.studentId) && c.status === 'approved').length
    };
  }).filter((f) => f.kids.length > 0 && (campusId === 'all' || f.kids.some((k) => k.campusId === campusId))), [families, students, invoices, concessions, previousYearDueFor, campusId]);

  const rows = all.filter((f) => filter === 'all' || (filter === 'dues' ? f.due > 0 : filter === 'unverified' ? !f.verified : f.kids.length > 1));
  const viewing = families.find((f) => f.id === viewId) ?? null;

  const columns: Column<FamilyRow>[] = [
  { id: 'guardian', header: 'Family', sortValue: (f) => f.guardianName, cell: (f) => <PersonCell name={f.guardianName} bn={f.guardianNameBn} sub={`${f.id} · ${f.relation}`} /> },
  { id: 'phone', header: 'Phone', cell: (f) => <span className="inline-flex items-center gap-1 whitespace-nowrap tabular">{f.phone}{f.verified ? <BadgeCheck className="size-3.5 text-success" aria-label="Verified" /> : <ShieldAlert className="size-3.5 text-warning" aria-label="Unverified" />}</span> },
  { id: 'children', header: 'Children', sortValue: (f) => f.kids.length, cell: (f) => <div className="flex min-w-[160px] flex-wrap gap-1">{f.kids.map((k) => <span key={k.id} className={cn('rounded-md border border-border px-1.5 py-0.5 text-[11.5px]', k.status !== 'active' && 'text-muted-foreground')} title={k.name}>{k.name.split(' ')[0]} · {sectionLabel(k.sectionId)}</span>)}</div> },
  ...(canSeeFees ? [{ id: 'due', header: 'Dues', align: 'right' as const, sortValue: (f: FamilyRow) => f.due, cell: (f: FamilyRow) => <span className="tabular">{f.due ? formatBDT(f.due) : <span className="text-subtle">—</span>}{f.previous > 0 && <span className="block text-[11px] text-warning">{formatBDT(f.previous)} prev. year</span>}</span> }] : []),
  { id: 'portal', header: 'Portal', cell: (f) => <span className={cn('text-[12px]', f.portalEnabled && f.verified ? 'text-success' : 'text-muted-foreground')}>{f.portalEnabled && f.verified ? 'Active' : !f.verified ? 'Needs verification' : 'Disabled'}</span> },
  { id: 'conc', header: 'Concessions', align: 'right', hideable: true, mobileHidden: true, cell: (f) => <span className="tabular">{f.concessions || '—'}</span> }];


  const smsFamilies = (list: FamilyRow[]) => {
    const target = list.filter((f) => f.smsOptIn);
    const kids = target.reduce((t, f) => t + f.kids.filter((k) => k.status === 'active').length, 0);
    queueMessage({ channel: 'SMS', audience: `${target.length} selected families`, recipients: target.length, template: 'Custom', body: 'School notice', credits: target.length });
    toast.success(`SMS queued to ${target.length} families`, { description: `${Math.max(0, kids - target.length)} duplicate texts avoided · ${list.length - target.length} skipped (no opt-in)` });
  };

  const exportRows = (list: FamilyRow[]) => downloadCsv('families.csv', list.map((f) => ({ ID: f.id, Guardian: f.guardianName, Relation: f.relation, Phone: f.phone, Verified: f.verified ? 'Yes' : 'No', Children: f.kids.map((k) => `${k.name} (${sectionLabel(k.sectionId)})`).join('; '), Dues: f.due })));

  return (
    <div className="space-y-4">
      <PageHeader title="Students" bn="শিক্ষার্থী" description="Families · one guardian record for all their children" actions={<Button size="sm" variant="outline" onClick={() => exportRows(rows)}><Download className="size-4" /> Export</Button>} />
      <StudentsNav />
      <KpiStrip
        items={[
        { label: 'Families', value: all.length, sub: `${students.filter((s) => s.status === 'active').length} active students`, icon: Home, tone: 'primary', onClick: () => setFilter('all') },
        { label: 'With 2+ children', value: all.filter((f) => f.kids.length > 1).length, sub: 'Sibling concession eligible', icon: Users, tone: 'info', onClick: () => setFilter('multi') },
        { label: 'Unverified phone', value: all.filter((f) => !f.verified).length, sub: 'No portal sign-in yet', icon: KeyRound, tone: 'warning', onClick: () => setFilter('unverified') },
        ...(canSeeFees ? [{ label: 'Families with dues', value: all.filter((f) => f.due > 0).length, sub: formatBDT(all.reduce((t, f) => t + f.due, 0)), icon: Wallet, tone: 'danger' as const, onClick: () => setFilter('dues') }] : [])]
        } />
      
      <DataTable
        ariaLabel="Families"
        rows={rows}
        columns={columns}
        getRowId={(f) => f.id}
        onRowClick={(f) => setViewId(f.id)}
        searchText={(f) => `${f.id} ${f.guardianName} ${f.phone} ${f.secondary?.phone ?? ''} ${f.kids.map((k) => `${k.name} ${k.studentNo}`).join(' ')}`}
        searchPlaceholder="Guardian, phone, child or ID…"
        toolbar={<Segmented ariaLabel="Filter" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, ...(canSeeFees ? [{ value: 'dues' as const, label: 'Has dues' }] : []), { value: 'unverified', label: 'Unverified' }, { value: 'multi', label: '2+ children' }]} />}
        rowActions={(f) => [
        { label: 'Open family', icon: Eye, onSelect: () => setViewId(f.id) },
        { label: 'SMS family', icon: MessageSquare, disabled: !f.smsOptIn, onSelect: () => smsFamilies([f]) }]
        }
        bulkActions={(ids, clear) =>
        <>
            <Button size="xs" variant="outline" onClick={() => {smsFamilies(all.filter((f) => ids.includes(f.id)));clear();}}><MessageSquare className="size-3.5" /> SMS families</Button>
            <Button size="xs" variant="outline" onClick={() => exportRows(all.filter((f) => ids.includes(f.id)))}><Download className="size-3.5" /> Export</Button>
          </>
        }
        emptyTitle="No families match"
        footerNote="Grouped from guardian phone numbers · fictional sample data" />
      
      <FamilySheet family={viewing} onOpenChange={(o) => !o && setViewId(null)} />
    </div>);

}