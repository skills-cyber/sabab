import React, { useMemo, useState } from 'react';
import { ArrowRightCircle, CheckCircle2, Phone, Plus, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { Segmented } from '../common/Segmented';
import { Field } from '../common/Field';
import { SelectField } from '../common/SelectField';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { campuses } from '../../data/school';
import type { Enquiry } from '../../types/admissions';
import type { AdmissionsStore } from './useAdmissions';
import type { ApplicationPrefill } from './NewApplicationDialog';
import { TODAY, formatDate, isValidBdPhone } from '../../utils/format';
import { cn } from '../../utils/cn';

type Filter = 'open' | 'due' | 'all';

interface Props {
  store: AdmissionsStore;
  campusId: string;
  canEdit: boolean;
  newOpen: boolean;
  setNewOpen: (o: boolean) => void;
  onConvert: (p: ApplicationPrefill) => void;
}

const blank = { name: '', phone: '', grade: '6', campusId: 'mirpur', source: 'Phone' as Enquiry['source'], followUp: '2026-11-04', note: '' };

/** Enquiry CRM: follow-up queue, overdue highlight, convert to application, mark lost. */
export function EnquiriesTab({ store, campusId, canEdit, newOpen, setNewOpen, onConvert }: Props) {
  const [filter, setFilter] = useState<Filter>('open');
  const [f, setF] = useState(blank);
  const [err, setErr] = useState<Record<string, string>>({});
  const scoped = useMemo(() => store.enquiries.filter((e) => campusId === 'all' || e.campusId === campusId), [store.enquiries, campusId]);
  const isOpen = (e: Enquiry) => e.status === 'new' || e.status === 'contacted';
  const rows = scoped.filter((e) => filter === 'all' || (filter === 'open' ? isOpen(e) : isOpen(e) && e.followUp <= TODAY));
  const due = scoped.filter((e) => isOpen(e) && e.followUp <= TODAY).length;

  const columns: Column<Enquiry>[] = [
  { id: 'name', header: 'Enquirer', sortValue: (e) => e.name, cell: (e) => <div><p className="font-medium">{e.name}</p><p className="text-[11px] text-muted-foreground tabular">{e.id} · {e.phone}</p></div> },
  { id: 'class', header: 'Interest', sortValue: (e) => e.grade, cell: (e) => <span className="whitespace-nowrap">Class {e.grade} <span className="text-muted-foreground">· {campuses.find((c) => c.id === e.campusId)?.short}</span></span> },
  { id: 'source', header: 'Source', mobileHidden: true, cell: (e) => e.source },
  {
    id: 'note', header: 'Note', mobileHidden: true, cell: (e) => <span className="line-clamp-1 max-w-[240px] text-[12px] text-muted-foreground">{e.note || '—'}</span>,
    edit: { value: (e) => e.note, lockedReason: (e) => !canEdit ? 'Office staff only.' : !isOpen(e) ? 'Closed enquiry.' : null, onSave: (e, v) => {if (v.length > 140) return 'Max 140 characters';store.updateEnquiry(e.id, { note: v });} }
  },
  { id: 'follow', header: 'Follow-up', sortValue: (e) => e.followUp, cell: (e) => <span className={cn('whitespace-nowrap tabular', isOpen(e) && e.followUp < TODAY && 'font-semibold text-danger', isOpen(e) && e.followUp === TODAY && 'font-semibold text-warning')}>{isOpen(e) ? e.followUp === TODAY ? 'Today' : formatDate(e.followUp, 'd MMM') : '—'}</span> },
  { id: 'status', header: 'Status', cell: (e) => <StatusBadge status={e.status} /> }];


  const save = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 3) e.name = 'Name is required.';
    if (!isValidBdPhone(f.phone)) e.phone = 'Enter a valid Bangladesh mobile.';
    setErr(e);
    if (Object.keys(e).length) return;
    const id = store.addEnquiry({ name: f.name.trim(), phone: f.phone.trim(), grade: Number(f.grade), campusId: f.campusId, source: f.source, on: TODAY, followUp: f.followUp, note: f.note.trim() });
    toast.success(`${id} logged`, { description: `Follow-up ${formatDate(f.followUp, 'd MMM')}` });
    setF(blank);
    setNewOpen(false);
  };

  return (
    <>
      <DataTable
        ariaLabel="Enquiries"
        rows={rows}
        columns={columns}
        getRowId={(e) => e.id}
        searchText={(e) => `${e.name} ${e.phone} ${e.id} ${e.note}`}
        searchPlaceholder="Name, phone or note…"
        initialSort={{ id: 'follow', dir: 'asc' }}
        toolbar={<Segmented ariaLabel="Enquiries" value={filter} onChange={setFilter} options={[{ value: 'open', label: 'Open' }, { value: 'due', label: 'Follow-up due', count: due }, { value: 'all', label: 'All' }]} />}
        rowActions={(e) => [
        { label: 'Convert to application', icon: ArrowRightCircle, disabled: !canEdit || !isOpen(e), onSelect: () => onConvert({ guardianName: e.name, guardianPhone: e.phone, grade: e.grade, campusId: e.campusId, source: e.source, enquiryId: e.id }) },
        { label: 'Mark contacted · +2 days', icon: Phone, disabled: !canEdit || !isOpen(e), onSelect: () => {store.updateEnquiry(e.id, { status: 'contacted', followUp: '2026-11-04' });toast.success('Follow-up moved to 4 Nov');} },
        { label: 'Mark as lost', icon: XCircle, destructive: true, separatorBefore: true, disabled: !canEdit || !isOpen(e), onSelect: () => {store.updateEnquiry(e.id, { status: 'lost' });toast.success(`${e.id} closed as lost`, { action: { label: 'Undo', onClick: () => store.updateEnquiry(e.id, { status: e.status }) } });} }]
        }
        rowClassName={(e) => isOpen(e) && e.followUp < TODAY ? 'bg-danger-bg/30' : ''}
        emptyTitle={filter === 'due' ? 'No follow-ups due' : 'No enquiries'}
        emptyHint={filter === 'due' ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3.5 text-success" /> All caught up.</span> : undefined}
        emptyAction={canEdit ? <Button size="sm" onClick={() => setNewOpen(true)}><Plus className="size-4" /> Log enquiry</Button> : undefined}
        footerNote="Fictional sample enquiries" />
      

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log enquiry</DialogTitle>
            <DialogDescription>Phone, walk-in or social media lead. Convert to an application when the family is ready.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" required error={err.name} htmlFor="eq-n" className="sm:col-span-2"><Input id="eq-n" data-autofocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Mobile" required error={err.phone} htmlFor="eq-p"><Input id="eq-p" inputMode="tel" className="tabular" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="01XXX-XXXXXX" /></Field>
            <Field label="Source" htmlFor="eq-s"><SelectField id="eq-s" value={f.source} onValueChange={(v) => setF({ ...f, source: v as Enquiry['source'] })} options={['Phone', 'Walk-in', 'Website', 'Facebook', 'Referral'].map((s) => ({ value: s, label: s }))} /></Field>
            <Field label="Class" htmlFor="eq-g"><SelectField id="eq-g" value={f.grade} onValueChange={(v) => setF({ ...f, grade: v })} options={Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `Class ${i + 1}` }))} /></Field>
            <Field label="Campus" htmlFor="eq-c"><SelectField id="eq-c" value={f.campusId} onValueChange={(v) => setF({ ...f, campusId: v })} options={campuses.map((c) => ({ value: c.id, label: c.short }))} /></Field>
            <Field label="Follow-up on" htmlFor="eq-f"><Input id="eq-f" type="date" min={TODAY} value={f.followUp} onChange={(e) => setF({ ...f, followUp: e.target.value })} /></Field>
            <Field label="Note" htmlFor="eq-note" className="sm:col-span-2"><Textarea id="eq-note" rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save enquiry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>);

}