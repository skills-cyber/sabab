import React, { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Download, Printer } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { UnderlineTabs } from '../components/common/UnderlineTabs';
import { Panel } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { SubjectChip } from '../components/common/SubjectChip';
import { SelectField } from '../components/common/SelectField';
import { Button } from '../components/ui/Button';
import { useAcademic } from '../contexts/AcademicContext';
import { useAdmin } from '../contexts/AdminContext';
import { courses } from '../data/academic';
import { sections, teachers } from '../data/school';
import { computeCoverage } from '../utils/coverage';
import { invoiceBalance, invoiceTotal } from '../utils/fees';
import { markStats } from '../utils/grades';
import { sectionLabel } from '../utils/timetable';
import { downloadCsv, formatBDT, pct } from '../utils/format';
import { cn } from '../utils/cn';
import { IncomeStatement } from '../components/reports/IncomeStatement';
import { BalanceSheet } from '../components/reports/BalanceSheet';
import { useApp } from '../contexts/AppContext';

const TABS = ['academic', 'attendance', 'fees', 'assessment', 'income', 'balance'];
const FINANCE_TABS = ['income', 'balance'];
const MIRPUR = sections.filter((s) => s.campusId === 'mirpur');

function Bar({ value, tone }: {value: number;tone?: 'auto' | 'primary';}) {
  const cls = tone === 'primary' ? 'bg-primary' : value >= 95 ? 'bg-success' : value >= 85 ? 'bg-warning' : 'bg-danger';
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-full min-w-[80px] overflow-hidden rounded-full bg-muted"><span className={cn('block h-full rounded-full', cls)} style={{ width: `${Math.min(100, value)}%` }} /></span>
      <span className="w-10 shrink-0 text-right text-[12px] font-medium tabular">{value}%</span>
    </span>);

}

const th = 'h-9 px-4 text-xs font-medium text-muted-foreground';
const td = 'px-4 py-2';

export function Reports() {
  const { tab } = useParams();
  const { topics, progress, assessments, marks } = useAcademic();
  const { students, invoices } = useAdmin();
  const [section, setSection] = useState('all');
  const { role } = useApp();
  const seesFinance = role === 'owner' || role === 'principal' || role === 'accountant';

  const coverage = useMemo(() => courses.map((c) => computeCoverage(c, topics, progress)), [topics, progress]);
  if (!TABS.includes(tab ?? '') || FINANCE_TABS.includes(tab ?? '') && !seesFinance) return <Navigate to="/reports/academic" replace />;

  const cov = coverage.filter((c) => section === 'all' || c.sectionId === section);
  const att = MIRPUR.map((s) => {
    const list = students.filter((x) => x.sectionId === s.id && x.status === 'active');
    const avg = list.length ? Math.round(list.reduce((t, x) => t + x.attendancePct, 0) / list.length) : 0;
    return { s, n: list.length, avg, low: list.filter((x) => x.attendancePct < 80).length };
  });
  const periods = [...new Set(invoices.map((i) => i.period))];
  const fee = periods.map((p) => {
    const inv = invoices.filter((i) => i.period === p);
    const billed = inv.reduce((t, i) => t + invoiceTotal(i), 0);
    const due = inv.reduce((t, i) => t + invoiceBalance(i), 0);
    return { p, n: inv.length, billed, collected: billed - due, due, rate: pct(billed - due, billed) };
  });
  const feeBySection = MIRPUR.map((s) => {
    const inv = invoices.filter((i) => students.find((x) => x.id === i.studentId)?.sectionId === s.id);
    return { s, due: inv.reduce((t, i) => t + invoiceBalance(i), 0), defaulters: new Set(inv.filter((i) => invoiceBalance(i) > 0).map((i) => i.studentId)).size };
  });
  const scored = assessments.filter((a) => marks[a.id] && Object.values(marks[a.id]).some((v) => typeof v === 'number'));

  const exportTab = () => {
    if (tab === 'academic') downloadCsv('coverage.csv', cov.map((c) => ({ Section: sectionLabel(c.sectionId), Subject: c.subjectId, Teacher: teachers.find((t) => t.id === c.teacherId)?.name ?? '', Planned: c.plannedToDate, Delivered: c.delivered, Coverage: c.pct, Gap: c.gap })));
    if (tab === 'attendance') downloadCsv('attendance.csv', att.map((a) => ({ Section: a.s.label, Students: a.n, Average: a.avg, Below80: a.low })));
    if (tab === 'fees') downloadCsv('fees.csv', fee.map((f) => ({ Period: f.p, Invoices: f.n, Billed: f.billed, Collected: f.collected, Due: f.due, Rate: f.rate })));
    if (tab === 'assessment') downloadCsv('assessments.csv', scored.map((a) => {const st = markStats(Object.values(marks[a.id]), a.totalMarks);return { Assessment: a.title, Total: a.totalMarks, Average: st.avg, Stage: a.stage };}));
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        bn="রিপোর্ট"
        description="Mirpur campus · AY 2026 · live from the same records used across Sabab"
        actions={<><Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="size-4" /> Print A4</Button>{!FINANCE_TABS.includes(tab ?? '') && <Button size="sm" variant="outline" onClick={exportTab}><Download className="size-4" /> Export CSV</Button>}</>} />
      
      <UnderlineTabs
        layoutId="rep-tabs"
        tabs={[
        { id: 'academic', label: 'Teaching coverage', to: '/reports/academic' },
        { id: 'attendance', label: 'Attendance', to: '/reports/attendance' },
        { id: 'fees', label: 'Fees & dues', to: '/reports/fees' },
        { id: 'assessment', label: 'Assessment', to: '/reports/assessment' },
        ...(seesFinance ? [
        { id: 'income', label: 'Income & expenditure', to: '/reports/income' },
        { id: 'balance', label: 'Balance sheet', to: '/reports/balance' }] :
        [])]
        } />
      
      {tab === 'income' && <IncomeStatement />}
      {tab === 'balance' && <BalanceSheet />}

      {tab === 'academic' &&
      <Panel title="Planned vs delivered periods" description="To date · gaps include missed classes not yet recovered" flush actions={<SelectField size="sm" className="w-36" ariaLabel="Section" value={section} onValueChange={setSection} options={[{ value: 'all', label: 'All sections' }, ...MIRPUR.map((s) => ({ value: s.id, label: s.label }))]} />}>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[680px] text-[13px]">
              <thead className="bg-muted"><tr><th className={cn(th, 'text-left')}>Class</th><th className={cn(th, 'text-left')}>Teacher</th><th className={cn(th, 'text-right')}>Planned</th><th className={cn(th, 'text-right')}>Delivered</th><th className={cn(th, 'w-56 text-left')}>Coverage</th><th className={cn(th, 'text-left')}>Status</th></tr></thead>
              <tbody>
                {cov.sort((a, b) => a.pct - b.pct).map((c) =>
              <tr key={c.courseId} className="border-t border-border">
                    <td className={td}><span className="inline-flex items-center gap-1.5"><b className="font-semibold">{sectionLabel(c.sectionId)}</b><SubjectChip id={c.subjectId} /></span></td>
                    <td className={cn(td, 'text-muted-foreground')}>{teachers.find((t) => t.id === c.teacherId)?.name}</td>
                    <td className={cn(td, 'text-right tabular')}>{c.plannedToDate}</td>
                    <td className={cn(td, 'text-right tabular')}>{c.delivered}{c.gap > 0 && <span className="ml-1 text-[11px] text-danger">−{c.gap}</span>}</td>
                    <td className={td}><Bar value={c.pct} /></td>
                    <td className={td}><StatusBadge status={c.status} /></td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </Panel>
      }

      {tab === 'attendance' &&
      <Panel title="Average attendance by section" description="Academic year to date · threshold 80%" flush>
          <table className="w-full text-[13px]">
            <thead className="bg-muted"><tr><th className={cn(th, 'text-left')}>Section</th><th className={cn(th, 'text-right')}>Students</th><th className={cn(th, 'w-1/2 text-left')}>Average</th><th className={cn(th, 'text-right')}>Below 80%</th></tr></thead>
            <tbody>
              {att.map((a) =>
            <tr key={a.s.id} className="border-t border-border">
                  <td className={cn(td, 'font-semibold')}>{a.s.label}</td>
                  <td className={cn(td, 'text-right tabular')}>{a.n}</td>
                  <td className={td}><Bar value={a.avg} /></td>
                  <td className={cn(td, 'text-right tabular', a.low > 0 && 'font-semibold text-danger')}>{a.low}</td>
                </tr>
            )}
            </tbody>
          </table>
        </Panel>
      }

      {tab === 'fees' &&
      <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Collection by billing period" flush>
            <table className="w-full text-[13px]">
              <thead className="bg-muted"><tr><th className={cn(th, 'text-left')}>Period</th><th className={cn(th, 'text-right')}>Billed</th><th className={cn(th, 'text-right')}>Due</th><th className={cn(th, 'w-40 text-left')}>Collected</th></tr></thead>
              <tbody>
                {fee.map((f) =>
              <tr key={f.p} className="border-t border-border">
                    <td className={cn(td, 'font-medium')}>{f.p}<span className="block text-[11px] font-normal text-muted-foreground">{f.n} invoices</span></td>
                    <td className={cn(td, 'text-right tabular')}>{formatBDT(f.billed)}</td>
                    <td className={cn(td, 'text-right tabular', f.due > 0 && 'text-warning')}>{formatBDT(f.due)}</td>
                    <td className={td}><Bar value={f.rate} tone="primary" /></td>
                  </tr>
              )}
              </tbody>
            </table>
          </Panel>
          <Panel title="Outstanding dues by section" flush>
            <table className="w-full text-[13px]">
              <thead className="bg-muted"><tr><th className={cn(th, 'text-left')}>Section</th><th className={cn(th, 'text-right')}>Students with dues</th><th className={cn(th, 'text-right')}>Outstanding</th></tr></thead>
              <tbody>
                {feeBySection.map((f) =>
              <tr key={f.s.id} className="border-t border-border">
                    <td className={cn(td, 'font-semibold')}>{f.s.label}</td>
                    <td className={cn(td, 'text-right tabular')}>{f.defaulters}</td>
                    <td className={cn(td, 'text-right font-medium tabular')}>{f.due ? formatBDT(f.due) : '—'}</td>
                  </tr>
              )}
              </tbody>
            </table>
          </Panel>
        </div>
      }

      {tab === 'assessment' &&
      <Panel title="Assessment performance" description="Includes unpublished drafts — visible to staff only" flush>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[620px] text-[13px]">
              <thead className="bg-muted"><tr><th className={cn(th, 'text-left')}>Assessment</th><th className={cn(th, 'text-right')}>Entered</th><th className={cn(th, 'text-right')}>Average</th><th className={cn(th, 'text-right')}>Highest</th><th className={cn(th, 'text-right')}>Pass rate</th><th className={cn(th, 'text-left')}>Stage</th></tr></thead>
              <tbody>
                {scored.map((a) => {
                const vals = Object.values(marks[a.id]);
                const st = markStats(vals, a.totalMarks);
                const nums = vals.filter((v): v is number => typeof v === 'number');
                const pass = nums.length ? pct(nums.filter((v) => v / a.totalMarks >= 0.33).length, nums.length) : 0;
                return (
                  <tr key={a.id} className="border-t border-border">
                      <td className={td}><span className="font-medium">{a.title}</span><span className="ml-1.5 inline-flex align-middle"><SubjectChip id={a.subjectId} /></span></td>
                      <td className={cn(td, 'text-right tabular')}>{nums.length}</td>
                      <td className={cn(td, 'text-right tabular')}>{st.avg}/{a.totalMarks}</td>
                      <td className={cn(td, 'text-right tabular')}>{nums.length ? Math.max(...nums) : '—'}</td>
                      <td className={cn(td, 'text-right tabular', pass < 85 && 'text-warning')}>{pass}%</td>
                      <td className={td}><StatusBadge status={a.stage} /></td>
                    </tr>);

              })}
              </tbody>
            </table>
          </div>
        </Panel>
      }
    </div>);

}