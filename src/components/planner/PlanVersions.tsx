import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, FilePlus2, GitCompare, Lock, Printer, Send } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { ApprovalTimeline } from '../common/ApprovalTimeline';
import { ApprovalDialog } from '../common/ApprovalDialog';
import { Field } from '../common/Field';
import { Notice } from '../common/Notice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/Sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { useAcademic } from '../../contexts/AcademicContext';
import { useApp } from '../../contexts/AppContext';
import type { PlanVersion } from '../../types/academic';
import { formatDate } from '../../utils/format';

export function PlanVersions() {
  const { plans, submitPlan, decidePlan, createPlanDraft } = useAcademic();
  const { canApprove, role } = useApp();
  const [params, setParams] = useSearchParams();
  const [viewId, setViewId] = useState<string | null>(null);
  const [decideId, setDecideId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({ title: '', reason: '', changes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const viewing = plans.find((p) => p.id === viewId);
  const deciding = plans.find((p) => p.id === decideId);
  const canAuthor = role === 'coordinator' || role === 'principal';
  const approver = role === 'principal' || role === 'owner';

  useEffect(() => {
    if (params.get('new') === '1') {
      setNewOpen(true);
      params.delete('new');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const columns: Column<PlanVersion>[] = [
  { id: 'version', header: 'Version', cell: (p) => <span className="font-semibold tabular">{p.version}</span>, sortValue: (p) => p.version },
  { id: 'title', header: 'Title', cell: (p) => <div className="min-w-[200px]"><p className="font-medium">{p.title}</p><p className="truncate text-[11px] text-muted-foreground">{p.changeReason}</p></div> },
  { id: 'status', header: 'Status', cell: (p) => <span className="inline-flex items-center gap-1"><StatusBadge status={p.status} />{(p.status === 'published' || p.status === 'superseded') && <Lock className="size-3 text-subtle" aria-label="Locked" />}</span> },
  { id: 'author', header: 'Author', mobileHidden: true, cell: (p) => p.author },
  { id: 'created', header: 'Created', mobileHidden: true, cell: (p) => formatDate(p.createdOn), sortValue: (p) => p.createdOn },
  { id: 'changes', header: 'Changes', align: 'right', cell: (p) => <span className="tabular">{p.changes.length}</span> }];


  const createDraft = () => {
    const e: Record<string, string> = {};
    if (form.title.trim().length < 4) e.title = 'Give the revision a short title.';
    if (form.reason.trim().length < 10) e.reason = 'Explain why (min 10 characters) — approvers see this first.';
    if (!form.changes.trim()) e.changes = 'List at least one change.';
    setErrors(e);
    if (Object.keys(e).length) return;
    createPlanDraft(form.title.trim(), form.reason.trim(), form.changes.split('\n').map((s) => s.trim()).filter(Boolean));
    setNewOpen(false);
    setForm({ title: '', reason: '', changes: '' });
    toast.success('Draft revision created', { description: 'Submit it for principal approval when ready.' });
  };

  return (
    <div className="space-y-3">
      <Notice kind="info">Published plans are <b>locked</b>. Every change goes through a versioned revision with a reason, principal approval and an audit trail; historic versions stay readable.</Notice>
      <DataTable
        ariaLabel="Plan versions"
        rows={plans}
        columns={columns}
        getRowId={(p) => p.id}
        onRowClick={(p) => setViewId(p.id)}
        searchText={(p) => `${p.version} ${p.title} ${p.author}`}
        searchPlaceholder="Search versions…"
        toolbarRight={canAuthor ? <Button size="sm" onClick={() => setNewOpen(true)}><FilePlus2 className="size-4" /> New revision</Button> : undefined}
        rowActions={(p) => [
        { label: 'View details', icon: Eye, onSelect: () => setViewId(p.id) },
        { label: 'Submit for approval', icon: Send, onSelect: () => {submitPlan(p.id);toast.success(`${p.version} submitted`);}, disabled: !(p.status === 'draft' || p.status === 'returned') || !canAuthor },
        { label: 'Approve / return', icon: GitCompare, onSelect: () => setDecideId(p.id), disabled: p.status !== 'submitted' || !approver },
        { label: 'Print / export PDF', icon: Printer, onSelect: () => window.print(), separatorBefore: true }]
        } />
      

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {viewing &&
          <>
              <SheetHeader>
                <SheetTitle>{viewing.version} · {viewing.title}</SheetTitle>
                <SheetDescription>{viewing.author} · created {formatDate(viewing.createdOn)}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                <StatusBadge status={viewing.status} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Reason</p>
                  <p className="text-[13px]">{viewing.changeReason}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Changes vs previous</p>
                  <ul className="mt-1 space-y-1 text-[13px]">{viewing.changes.map((c) => <li key={c} className="flex gap-2"><span className="text-primary">+</span>{c}</li>)}</ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">Approval trail</p>
                  <ApprovalTimeline entries={viewing.history} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(viewing.status === 'draft' || viewing.status === 'returned') && canAuthor && <Button size="sm" onClick={() => {submitPlan(viewing.id);toast.success('Submitted for approval');}}><Send className="size-4" /> Submit</Button>}
                  {viewing.status === 'submitted' && approver && <Button size="sm" onClick={() => {setDecideId(viewing.id);setViewId(null);}}>Review & decide</Button>}
                  {viewing.status === 'submitted' && !approver && <p className="text-xs text-muted-foreground">Awaiting principal decision.</p>}
                </div>
              </div>
            </>
          }
        </SheetContent>
      </Sheet>

      {deciding &&
      <ApprovalDialog
        open={!!deciding}
        onOpenChange={(o) => !o && setDecideId(null)}
        title={`Approve plan ${deciding.version}?`}
        description={deciding.title}
        history={deciding.history}
        approveLabel="Approve & publish"
        readOnly={!canApprove}
        onDecision={(ok, n) => {decidePlan(deciding.id, ok, n);toast.success(ok ? `${deciding.version} published — previous version superseded` : `${deciding.version} returned to author`);}}>
        
          <ul className="list-disc space-y-1 pl-5 text-[13px]">{deciding.changes.map((c) => <li key={c}>{c}</li>)}</ul>
        </ApprovalDialog>
      }

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New plan revision</DialogTitle>
            <DialogDescription>Starts as a draft copy of the published plan. Nothing changes until approved.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Title" required error={errors.title} htmlFor="pv-title"><Input id="pv-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Recover Science lab periods" /></Field>
            <Field label="Reason for revision" required error={errors.reason} htmlFor="pv-reason"><Textarea id="pv-reason" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
            <Field label="Changes (one per line)" required error={errors.changes} htmlFor="pv-changes"><Textarea id="pv-changes" rows={4} value={form.changes} onChange={(e) => setForm({ ...form, changes: e.target.value })} placeholder={'Move 8-A Science Ch 7 target to 19 Nov\nAdd 2 lab periods on Thursdays'} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={createDraft}>Create draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}