import React from 'react';
import { DataTable, type Column } from '../common/DataTable/DataTable';
import { ToneChip } from '../common/StatusBadge';
import { Notice } from '../common/Notice';
import { useAdmin } from '../../contexts/AdminContext';
import { useApp } from '../../contexts/AppContext';
import type { FeeHead } from '../../types/finance';
import { formatBDT } from '../../utils/format';

const GRADES = ['4', '6', '7', '8', '9'];

export function StructureTab() {
  const { feeHeads, updateFeeAmount } = useAdmin();
  const { role } = useApp();
  const lock = role === 'accountant' || role === 'principal' || role === 'owner' ? null : 'Only finance leads can change the fee structure.';

  const columns: Column<FeeHead>[] = [
  { id: 'name', header: 'Fee head', cell: (h) => <div><p className="font-medium">{h.name} <span lang="bn" className="font-bn text-[11.5px] font-normal text-muted-foreground">{h.bn}</span></p><p className="text-[11px] text-muted-foreground">{h.id}</p></div> },
  { id: 'freq', header: 'Frequency', mobileHidden: true, cell: (h) => <span className="inline-flex gap-1"><ToneChip tone="neutral">{h.frequency}</ToneChip>{h.optional && <ToneChip tone="info">Optional</ToneChip>}</span> },
  ...GRADES.map<Column<FeeHead>>((g) => ({
    id: `g${g}`, header: `Class ${g}`, align: 'right',
    cell: (h) => <span className="tabular">{h.amounts[g] ? formatBDT(h.amounts[g]) : '—'}</span>,
    edit: {
      value: (h) => String(h.amounts[g] ?? 0), type: 'number',
      lockedReason: () => lock,
      onSave: (h, v) => {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 0 || n > 50000) return '0–50,000';
        updateFeeAmount(h.id, g, n);
      }
    }
  }))];


  return (
    <div className="space-y-3">
      <Notice kind="info">Structure for AY 2026 · Mirpur campus. Changes apply to <b>future</b> invoices only; issued invoices are never silently changed. Hover a cell to edit.</Notice>
      <DataTable ariaLabel="Fee structure" rows={feeHeads} columns={columns} getRowId={(h) => h.id} footerNote="Amounts in BDT" />
    </div>);

}