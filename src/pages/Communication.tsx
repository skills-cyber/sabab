import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Coins, MessageSquare, Send, Smartphone, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/common/PageHeader';
import { KpiStrip } from '../components/common/KpiStrip';
import { DataTable, type Column } from '../components/common/DataTable/DataTable';
import { StatusBadge, ToneChip } from '../components/common/StatusBadge';
import { Segmented } from '../components/common/Segmented';
import { SelectField } from '../components/common/SelectField';
import { Field } from '../components/common/Field';
import { Notice } from '../components/common/Notice';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { useAdmin } from '../contexts/AdminContext';
import { messageTemplates } from '../data/communication';
import { sections } from '../data/school';
import type { Message } from '../types/finance';
import { sectionLabel } from '../utils/timetable';

type Channel = 'SMS' | 'App';
const SMS_BALANCE = 3420;

export function Communication() {
  const { messages, students, queueMessage } = useAdmin();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [audience, setAudience] = useState('8A');
  const [channel, setChannel] = useState<Channel>('SMS');
  const [templateId, setTemplateId] = useState('custom');
  const [body, setBody] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (params.get('new') === '1') {
      setOpen(true);
      params.delete('new');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const recipients = useMemo(() => students.filter((s) => s.status === 'active' && (audience === 'all' ? s.campusId === 'mirpur' : s.sectionId === audience)), [students, audience]);
  // One text per family, not per child.
  const optedInChildren = recipients.filter((s) => s.smsOptIn);
  const optedIn = new Set(optedInChildren.map((s) => s.familyId ?? s.id)).size;
  const duplicatesAvoided = optedInChildren.length - optedIn;
  const isBangla = /[\u0980-\u09FF]/.test(body);
  const segments = Math.max(1, Math.ceil(body.length / (isBangla ? 70 : 160)));
  const credits = channel === 'SMS' ? optedIn * segments : 0;
  const used = messages.reduce((s, m) => s + m.credits, 0);

  const send = () => {
    if (body.trim().length < 5) return setErr('Write the message (min 5 characters).');
    if (credits > SMS_BALANCE - used) return setErr('Not enough SMS credits — buy a package from the platform.');
    queueMessage({ channel, audience: `${audience === 'all' ? 'All guardians · Mirpur' : `${sectionLabel(audience)} guardians`}`, recipients: channel === 'SMS' ? optedIn : recipients.length, template: messageTemplates.find((t) => t.id === templateId)?.name ?? 'Custom', body: body.trim(), credits });
    toast.success('Message queued', { description: channel === 'SMS' ? `${optedIn} recipients · ${credits} credits` : `${recipients.length} guardians via portal` });
    setOpen(false);
    setBody('');
  };

  const columns: Column<Message>[] = [
  { id: 'id', header: 'Message', cell: (m) => <div className="min-w-[240px] max-w-[420px]"><p className="line-clamp-1">{m.body}</p><p className="text-[11px] text-muted-foreground">{m.id} · {m.template} · {m.sentBy}</p></div> },
  { id: 'audience', header: 'Audience', mobileHidden: true, cell: (m) => <span className="text-[12.5px]">{m.audience}</span> },
  { id: 'channel', header: 'Channel', cell: (m) => <ToneChip tone={m.channel === 'SMS' ? 'info' : m.channel === 'App' ? 'primary' : 'success'}>{m.channel}</ToneChip> },
  { id: 'delivery', header: 'Delivered', align: 'right', cell: (m) => <span className="tabular">{m.delivered}/{m.recipients}{m.failed > 0 && <span className="block text-[11px] text-danger">{m.failed} failed</span>}</span> },
  { id: 'credits', header: 'Credits', align: 'right', mobileHidden: true, cell: (m) => <span className="tabular text-muted-foreground">{m.credits || '—'}</span> },
  { id: 'sent', header: 'Sent', mobileHidden: true, cell: (m) => <span className="whitespace-nowrap text-[12px] text-muted-foreground">{m.sentAt}</span> },
  { id: 'status', header: 'Status', cell: (m) => <StatusBadge status={m.status} /> }];


  const viewing = messages.find((m) => m.id === viewId);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Communication"
        bn="যোগাযোগ"
        description="Guardian SMS and portal notices · consent-aware · delivery tracked"
        actions={<Button size="sm" onClick={() => setOpen(true)}><Send className="size-4" /> New message</Button>} />
      
      <KpiStrip
        items={[
        { label: 'SMS credits left', value: (SMS_BALANCE - used).toLocaleString('en-IN'), sub: 'School wallet', icon: Coins, tone: 'primary' },
        { label: 'Messages (30d)', value: messages.length, sub: 'All channels', icon: MessageSquare, tone: 'info' },
        { label: 'Delivery rate', value: `${Math.round(messages.reduce((s, m) => s + m.delivered, 0) / Math.max(1, messages.reduce((s, m) => s + m.recipients, 0)) * 100)}%`, sub: 'Delivered ÷ recipients', icon: Smartphone, tone: 'success' },
        { label: 'Failed', value: messages.filter((m) => m.status === 'failed').length, sub: 'WhatsApp not yet approved', icon: XCircle, tone: 'danger' }]
        } />
      
      <DataTable
        ariaLabel="Message log"
        rows={messages}
        columns={columns}
        getRowId={(m) => m.id}
        onRowClick={(m) => setViewId(m.id)}
        searchText={(m) => `${m.id} ${m.body} ${m.audience} ${m.template}`}
        searchPlaceholder="Search messages…"
        rowActions={(m) => [{ label: 'View details', icon: MessageSquare, onSelect: () => setViewId(m.id) }, { label: 'Resend failed', icon: Send, disabled: !m.failed || m.channel === 'WhatsApp', onSelect: () => {queueMessage({ channel: m.channel, audience: `${m.audience} · retry`, recipients: m.failed, template: m.template, body: m.body, credits: m.channel === 'SMS' ? m.failed : 0 });toast.success(`Retry queued for ${m.failed}`);} }]}
        footerNote="Live provider delivery reports require backend integration" />
      

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New message</DialogTitle>
            <DialogDescription>SMS goes only to guardians who opted in. Portal notices reach all verified guardians.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Audience" htmlFor="cm-aud">
              <SelectField id="cm-aud" value={audience} onValueChange={setAudience} options={[{ value: 'all', label: 'All guardians · Mirpur' }, ...sections.filter((s) => s.campusId === 'mirpur').map((s) => ({ value: s.id, label: `${s.label} guardians` }))]} />
            </Field>
            <Field label="Channel">
              <Segmented ariaLabel="Channel" value={channel} onChange={setChannel} options={[{ value: 'SMS', label: 'SMS' }, { value: 'App', label: 'Portal notice' }]} />
            </Field>
            <Field label="Template" htmlFor="cm-tpl" className="sm:col-span-2">
              <SelectField id="cm-tpl" value={templateId} onValueChange={(v) => {setTemplateId(v);const t = messageTemplates.find((x) => x.id === v);if (t) setBody(t.body);}} options={[{ value: 'custom', label: 'Custom message' }, ...messageTemplates.map((t) => ({ value: t.id, label: `${t.name} · ${t.bn}` }))]} />
            </Field>
            <Field label="Message" required error={err} htmlFor="cm-body" className="sm:col-span-2" hint={`${body.length} chars · ${segments} segment(s) ${isBangla ? '(Bangla: 70/segment)' : '(160/segment)'}`}>
              <Textarea id="cm-body" rows={4} value={body} onChange={(e) => {setBody(e.target.value);setErr(null);}} placeholder="বাংলা বা English" />
            </Field>
          </div>
          <Notice kind="info">{channel === 'SMS' ? <>Recipients: <b>{optedIn}</b> families ({optedInChildren.length} of {recipients.length} students opted in) · Cost: <b>{credits} credits</b>{duplicatesAvoided > 0 && <> · {duplicatesAvoided} duplicate texts avoided</>}</> : <>Recipients: <b>{recipients.length}</b> guardians in the portal · no SMS cost</>}</Notice>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={send}><Send className="size-4" /> Queue message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewId(null)}>
        <DialogContent className="sm:max-w-md">
          {viewing &&
          <>
              <DialogHeader>
                <DialogTitle>{viewing.id} · {viewing.template}</DialogTitle>
                <DialogDescription>{viewing.audience} · {viewing.sentAt}</DialogDescription>
              </DialogHeader>
              <p className="rounded-lg bg-muted p-3 text-[13px]">{viewing.body}</p>
              <dl className="grid grid-cols-3 gap-2 text-center text-[13px]">
                <div className="rounded-md border border-border p-2"><dt className="text-[11px] text-muted-foreground">Recipients</dt><dd className="font-semibold tabular">{viewing.recipients}</dd></div>
                <div className="rounded-md border border-border p-2"><dt className="text-[11px] text-muted-foreground">Delivered</dt><dd className="font-semibold text-success tabular">{viewing.delivered}</dd></div>
                <div className="rounded-md border border-border p-2"><dt className="text-[11px] text-muted-foreground">Failed</dt><dd className="font-semibold text-danger tabular">{viewing.failed}</dd></div>
              </dl>
              <StatusBadge status={viewing.status} />
            </>
          }
        </DialogContent>
      </Dialog>
    </div>);

}