import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { Panel } from '../common/Panel';
import { StatusBadge, ToneChip } from '../common/StatusBadge';
import { Button } from '../ui/Button';
import { useAdmin } from '../../contexts/AdminContext';
import { supportTickets as seedTickets } from '../../data/saas';
import type { AuditEntry } from '../../types/finance';
import type { SupportTicket } from '../../types/saas';
import { formatDate } from '../../utils/format';

const sevTone = { info: 'neutral', warning: 'warning', critical: 'danger' } as const;

export function AuditTab() {
  const { audit, tenants } = useAdmin();
  const [tickets, setTickets] = useState<SupportTicket[]>(seedTickets);

  const columns: Column<AuditEntry>[] = [
  { id: 'at', header: 'When', cell: (a) => <span className="whitespace-nowrap text-[12px] text-muted-foreground tabular">{a.at}</span> },
  { id: 'actor', header: 'Actor', cell: (a) => a.actor },
  { id: 'module', header: 'Module', mobileHidden: true, cell: (a) => <ToneChip tone="neutral">{a.module}</ToneChip> },
  { id: 'action', header: 'Action', cell: (a) => <span className="font-medium">{a.action}<span className="block max-w-[320px] truncate text-[11px] font-normal text-muted-foreground">{a.target}</span></span> },
  { id: 'sev', header: 'Severity', cell: (a) => <ToneChip tone={sevTone[a.severity]}>{a.severity}</ToneChip> }];


  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <DataTable ariaLabel="Audit log" rows={audit} columns={columns} getRowId={(a) => a.id} searchText={(a) => `${a.actor} ${a.action} ${a.target} ${a.module}`} searchPlaceholder="Search audit trail…" footerNote="Append-only" />
      <Panel title="Support tickets" flush>
        <ul className="divide-y divide-border">
          {tickets.map((t) =>
          <li key={t.id} className="px-4 py-2.5 text-[13px]">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{t.subject}</p>
                <StatusBadge status={t.status} />
              </div>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">{t.id} · {tenants.find((x) => x.id === t.tenantId)?.name} · {t.priority} · {formatDate(t.opened, 'd MMM')}</p>
              {t.status === 'open' && <Button size="xs" variant="outline" className="mt-1.5" onClick={() => {setTickets((l) => l.map((x) => x.id === t.id ? { ...x, status: 'resolved' } : x));toast.success(`${t.id} resolved`);}}><CheckCircle2 className="size-3.5" /> Mark resolved</Button>}
            </li>
          )}
        </ul>
      </Panel>
    </div>);

}