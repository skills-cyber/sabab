import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Combine, KeyRound, Link2, MessageSquare, Pencil, Phone, ShieldAlert, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { UnderlineTabs } from '../common/UnderlineTabs';
import { StatusBadge } from '../common/StatusBadge';
import { ApprovalTimeline } from '../common/ApprovalTimeline';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Notice } from '../common/Notice';
import { Avatar } from '../common/PersonCell';
import { FamilyContactDialog } from './FamilyContactDialog';
import { VerifyPhoneDialog } from './VerifyPhoneDialog';
import { LinkChildDialog } from './LinkChildDialog';
import { MergeFamilyDialog } from './MergeFamilyDialog';
import { FamilyFeesPanel } from './FamilyFeesPanel';
import { useAdmin } from '../../contexts/AdminContext';
import { useApp } from '../../contexts/AppContext';
import type { Family } from '../../types/family';
import type { Student } from '../../types/school';
import { childrenOf } from '../../utils/family';
import { sectionLabel } from '../../utils/timetable';

const Row = ({ k, v }: {k: string;v: React.ReactNode;}) =>
<div className="flex justify-between gap-3 border-b border-border py-1.5 text-[13px] last:border-0"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>;


/** Household panel: contacts + children, combined fee statement, portal access and history. */
export function FamilySheet({ family, onOpenChange }: {family: Family | null;onOpenChange: (o: boolean) => void;}) {
  const { students, familyStore, queueMessage } = useAdmin();
  const { role } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [dialog, setDialog] = useState<'edit' | 'verify' | 'link' | 'merge' | null>(null);
  const [unlink, setUnlink] = useState<Student | null>(null);
  const canEdit = role === 'office' || role === 'principal' || role === 'owner';
  const canSeeFees = role !== 'teacher' && role !== 'coordinator';
  const f = family;
  const kids = f ? childrenOf(f.id, students) : [];

  return (
    <Sheet open={!!f} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {f &&
        <>
            <SheetHeader className="border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar name={f.guardianName} size="md" />
                <div className="min-w-0">
                  <SheetTitle className="truncate">{f.guardianName} {f.guardianNameBn && <span lang="bn" className="font-bn text-sm font-normal text-muted-foreground">{f.guardianNameBn}</span>}</SheetTitle>
                  <SheetDescription>{f.id} · {f.relation} · <span className="tabular">{f.phone}</span></SheetDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {f.verified ? <StatusBadge status="approved" label="Phone verified" /> : <StatusBadge status="needs-review" label="Unverified" />}
                <StatusBadge status={f.portalEnabled && f.verified ? 'published' : 'draft'} label={f.portalEnabled && f.verified ? 'Portal active' : 'No portal access'} />
                {kids.length > 1 && <StatusBadge status="info" label={`${kids.length} children`} />}
              </div>
            </SheetHeader>
            <div className="px-4 pt-2">
              <UnderlineTabs layoutId="fam-tabs" value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, ...(canSeeFees ? [{ id: 'fees', label: 'Fees' }] : []), { id: 'portal', label: 'Portal access' }, { id: 'history', label: 'History', count: f.history.length }]} />
            </div>
            <div className="space-y-4 p-4">
              {tab === 'overview' &&
            <>
                  <section aria-label="Children" className="space-y-2">
                    <div className="flex items-center justify-between"><h3 className="text-[12px] font-semibold uppercase tracking-wide text-subtle">Children</h3>{canEdit && <Button size="xs" variant="outline" onClick={() => setDialog('link')}><Link2 className="size-3.5" /> Link child</Button>}</div>
                    <ul className="grid gap-2">
                      {kids.map((k) =>
                  <li key={k.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                          <Avatar name={k.name} size="sm" />
                          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => navigate(`/students?id=${k.id}`)}>
                            <p className="truncate text-[13px] font-medium hover:text-primary">{k.name}</p>
                            <p className="text-[11px] text-muted-foreground">{sectionLabel(k.sectionId)} · Roll {k.roll || '—'} · {k.studentNo}</p>
                          </button>
                          <StatusBadge status={k.status} />
                          {canEdit && kids.length > 1 && <Button size="xs" variant="ghost" aria-label={`Unlink ${k.name}`} onClick={() => setUnlink(k)}><Unlink className="size-3.5" /></Button>}
                        </li>
                  )}
                    </ul>
                  </section>
                  <section aria-label="Contacts">
                    <div className="mb-1 flex items-center justify-between"><h3 className="text-[12px] font-semibold uppercase tracking-wide text-subtle">Contacts</h3>{canEdit && <Button size="xs" variant="outline" onClick={() => setDialog('edit')}><Pencil className="size-3.5" /> Edit</Button>}</div>
                    <dl>
                      <Row k="Primary" v={<>{f.guardianName} · {f.relation}</>} />
                      <Row k="Mobile" v={<span className="inline-flex items-center gap-1 tabular">{f.phone}{f.verified ? <BadgeCheck className="size-3.5 text-success" aria-label="Verified" /> : <ShieldAlert className="size-3.5 text-warning" aria-label="Unverified" />}</span>} />
                      <Row k="SMS opt-in" v={f.smsOptIn ? 'Yes' : 'No'} />
                      <Row k="NID" v={f.nid ? <span className="tabular">{f.nid}</span> : '—'} />
                      <Row k="Address" v={f.address ?? '—'} />
                      <Row k="Second contact" v={f.secondary ? <>{f.secondary.name} · {f.secondary.relation} · <span className="tabular">{f.secondary.phone}</span></> : '—'} />
                    </dl>
                  </section>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={!f.smsOptIn} onClick={() => {queueMessage({ channel: 'SMS', audience: `Family ${f.id}`, recipients: 1, template: 'Custom', body: 'Message from school office', credits: 1 });toast.success('SMS queued', { description: `One text for ${kids.length} child${kids.length > 1 ? 'ren' : ''}` });}}><MessageSquare className="size-4" /> SMS family</Button>
                    <a href={`tel:${f.phone.replace(/-/g, '')}`} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] hover:bg-muted"><Phone className="size-4" /> Call</a>
                    {canEdit && <Button size="sm" variant="outline" onClick={() => setDialog('merge')}><Combine className="size-4" /> Merge family</Button>}
                  </div>
                </>
            }
              {tab === 'fees' && canSeeFees && <FamilyFeesPanel family={f} kids={kids} />}
              {tab === 'portal' &&
            <div className="space-y-3">
                  {!f.verified && <Notice kind="warning" action={canEdit ? <Button size="xs" onClick={() => setDialog('verify')}><KeyRound className="size-3.5" /> Verify phone</Button> : undefined}>The primary phone isn’t verified, so the guardian can’t sign in yet.</Notice>}
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div><p className="text-[13px] font-medium">Guardian portal access</p><p className="text-[12px] text-muted-foreground">Sees all {kids.length} linked child{kids.length > 1 ? 'ren' : ''}: results, attendance, homework and fees</p></div>
                    <Switch checked={f.portalEnabled} disabled={!canEdit} aria-label="Portal access" onCheckedChange={(v) => {familyStore.setPortal(f.id, v);toast.success(v ? 'Portal access enabled' : 'Portal access disabled');}} />
                  </div>
                  <dl>
                    <Row k="Login" v={<span className="tabular">{f.phone}</span>} />
                    <Row k="Last login" v={f.lastLogin ?? 'Never'} />
                    <Row k="Status" v={f.portalEnabled && f.verified ? 'Can sign in' : !f.verified ? 'Waiting for verification' : 'Disabled by school'} />
                  </dl>
                </div>
            }
              {tab === 'history' && <ApprovalTimeline entries={f.history} />}
            </div>
            <FamilyContactDialog family={f} open={dialog === 'edit'} onOpenChange={(o) => setDialog(o ? 'edit' : null)} />
            <VerifyPhoneDialog family={f} open={dialog === 'verify'} onOpenChange={(o) => setDialog(o ? 'verify' : null)} />
            <LinkChildDialog family={f} open={dialog === 'link'} onOpenChange={(o) => setDialog(o ? 'link' : null)} />
            <MergeFamilyDialog family={f} open={dialog === 'merge'} onOpenChange={(o) => setDialog(o ? 'merge' : null)} />
            <ConfirmDialog
            open={!!unlink}
            onOpenChange={(o) => !o && setUnlink(null)}
            title={`Unlink ${unlink?.name}?`}
            description="The child gets a new family with a copy of the current guardian details, marked unverified. Siblings and family concessions update."
            confirmLabel="Unlink"
            destructive
            onConfirm={() => {if (unlink) {const id = familyStore.unlinkChild(unlink.id);toast.success(`${unlink.name} moved to ${id}`, { description: 'Edit the new family’s contacts next.' });}}} />
          
          </>
        }
      </SheetContent>
    </Sheet>);

}