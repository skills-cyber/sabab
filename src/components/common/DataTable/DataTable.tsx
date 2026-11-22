import React from 'react';
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, ChevronsUpDown, Columns3, Rows2, Rows4, Search, SearchX, X } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Checkbox } from '../../ui/Checkbox';
import { Popover, MenuItem, MenuLabel } from '../Popover';
import { InlineEditCell } from '../InlineEditCell';
import { RowActions, type RowAction } from '../RowActions';
import { EmptyState } from '../EmptyState';
import { useDataTable, type SortState } from './useDataTable';
import { cn } from '../../../utils/cn';

export interface ColumnEdit<T> {
  value: (row: T) => string;
  onSave: (row: T, v: string) => string | void;
  type?: 'text' | 'number';
  lockedReason?: (row: T) => string | null;
}

export interface Column<T> {
  id: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
  headerClassName?: string;
  cell: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  hideable?: boolean;
  defaultHidden?: boolean;
  mobileHidden?: boolean;
  edit?: ColumnEdit<T>;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  getRowId: (r: T) => string;
  searchText?: (r: T) => string;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  toolbarRight?: React.ReactNode;
  rowActions?: (r: T) => RowAction[];
  bulkActions?: (ids: string[], clear: () => void) => React.ReactNode;
  onRowClick?: (r: T) => void;
  pageSize?: number;
  emptyTitle?: string;
  emptyHint?: React.ReactNode;
  emptyAction?: React.ReactNode;
  loading?: boolean;
  footerNote?: string;
  initialSort?: SortState;
  rowClassName?: (r: T) => string;
  className?: string;
  ariaLabel: string;
}

const iconBtn = 'inline-flex size-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-2';

/**
 * Sabab DataTable — the one table every module uses: instant search, sort, column visibility, density,
 * selection + bulk bar, pagination, inline edit (hover/focus), sticky ⋯ actions, loading / empty / no-match states.
 */
export function DataTable<T>(props: DataTableProps<T>) {
  const {
    rows, columns, getRowId, searchText, searchPlaceholder = 'Search…', toolbar, toolbarRight, rowActions, bulkActions, onRowClick,
    pageSize = 10, emptyTitle = 'No records yet', emptyHint, emptyAction, loading, footerNote, initialSort, rowClassName, className, ariaLabel
  } = props;
  const t = useDataTable({ rows, columns, getRowId, searchText, pageSize, initialSort });
  const selectable = !!bulkActions;
  const hideable = columns.filter((c) => c.hideable);
  const alignCls = (a?: Column<T>['align']) => a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';
  const colCount = t.visibleColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);
  const from = t.filtered.length ? t.page * t.pageSize + 1 : 0;
  const to = Math.min(t.filtered.length, (t.page + 1) * t.pageSize);

  return (
    <div className={cn('min-w-0 rounded-xl border border-border bg-card shadow-card', className)}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-2 sm:p-2.5">
        {searchText &&
        <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
            <Input value={t.query} onChange={(e) => t.setQuery(e.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="h-9 bg-card pl-8 pr-8 text-[13px]" onKeyDown={(e) => e.key === 'Escape' && t.setQuery('')} />
            {t.query &&
          <button type="button" onClick={() => t.setQuery('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-subtle hover:text-foreground">
                <X className="size-3.5" />
              </button>
          }
          </div>
        }
        {toolbar}
        <div className="ml-auto flex items-center gap-1.5">
          {toolbarRight}
          <button type="button" className={cn(iconBtn, 'hidden sm:inline-flex')} onClick={() => t.setDense(!t.dense)} aria-label={t.dense ? 'Comfortable rows' : 'Compact rows'} title={t.dense ? 'Comfortable rows' : 'Compact rows'}>
            {t.dense ? <Rows2 className="size-4" /> : <Rows4 className="size-4" />}
          </button>
          {hideable.length > 0 &&
          <Popover triggerLabel="Choose columns" triggerClassName={iconBtn} align="end" width={220} className="p-1" trigger={<Columns3 className="size-4" />}>
              {() =>
            <>
                  <MenuLabel>Visible columns</MenuLabel>
                  {hideable.map((c) =>
              <MenuItem key={c.id} onClick={() => t.toggleColumn(c.id)}>
                      <Check className={cn(t.hidden.has(c.id) && 'opacity-0')} />
                      {c.header}
                    </MenuItem>
              )}
                </>
            }
            </Popover>
          }
        </div>
      </div>

      {selectable && t.selected.size > 0 &&
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-accent px-3 py-1.5 text-[13px] text-accent-foreground" role="status">
          <span className="font-medium tabular">{t.selected.size} selected</span>
          <span className="h-4 w-px bg-border" aria-hidden />
          {bulkActions?.([...t.selected], () => t.setSelected(new Set()))}
          <button type="button" className="ml-auto text-xs underline-offset-2 hover:underline" onClick={() => t.setSelected(new Set())}>Clear selection</button>
        </div>
      }

      <div className="max-h-[620px] overflow-auto scrollbar-thin">
        <table className="w-full border-collapse" aria-label={ariaLabel}>
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              {selectable &&
              <th scope="col" className="w-9 px-3">
                  <Checkbox checked={t.allOnPageSelected} onCheckedChange={t.togglePage} aria-label="Select all rows on this page" />
                </th>
              }
              {t.visibleColumns.map((c) => {
                const sorted = t.sort?.id === c.id ? t.sort.dir : null;
                return (
                  <th
                    key={c.id}
                    scope="col"
                    aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                    className={cn('h-9 whitespace-nowrap px-3 text-xs font-medium text-muted-foreground', alignCls(c.align), c.mobileHidden && 'hidden md:table-cell', c.headerClassName)}>
                    
                    {c.sortValue ?
                    <button type="button" onClick={() => t.toggleSort(c.id)} className={cn('inline-flex items-center gap-1 rounded hover:text-foreground', c.align === 'right' && 'flex-row-reverse')}>
                        {c.header}
                        {sorted === 'asc' ? <ArrowUp className="size-3" /> : sorted === 'desc' ? <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-40" />}
                      </button> :

                    c.header
                    }
                  </th>);

              })}
              {rowActions && <th scope="col" className="sticky right-0 w-12 bg-muted px-2"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {loading ?
            Array.from({ length: 6 }).map((_, i) =>
            <tr key={i} className="border-t border-border">
                  <td colSpan={colCount} className="px-3 py-2.5">
                    <div className="h-4 animate-pulse rounded bg-muted" style={{ width: `${60 + i * 13 % 35}%` }} />
                  </td>
                </tr>
            ) :
            t.pageRows.length === 0 ?
            <tr>
                <td colSpan={colCount}>
                  {t.query ?
                <EmptyState icon={SearchX} title={`No matches for “${t.query}”`} hint="Try a different name, ID or phone number." action={<button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => t.setQuery('')}>Clear search</button>} /> :

                <EmptyState title={emptyTitle} hint={emptyHint} action={emptyAction} />
                }
                </td>
              </tr> :

            t.pageRows.map((row) => {
              const id = getRowId(row);
              const isSel = t.selected.has(id);
              return (
                <tr
                  key={id}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={(e) => {
                    if (onRowClick && e.key === 'Enter' && e.target === e.currentTarget) onRowClick(row);
                  }}
                  className={cn('group border-t border-border text-[13px] text-foreground transition-colors hover:bg-muted/50 focus-visible:bg-muted/60', onRowClick && 'cursor-pointer', isSel && 'bg-accent/50', rowClassName?.(row))}>
                  
                    {selectable &&
                  <td className="px-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSel} onCheckedChange={() => t.toggleRow(id)} aria-label={`Select row ${id}`} />
                      </td>
                  }
                    {t.visibleColumns.map((c) =>
                  <td key={c.id} className={cn('px-3 align-middle', t.dense ? 'py-1.5' : 'py-3', alignCls(c.align), c.mobileHidden && 'hidden md:table-cell', c.className)}>
                        {c.edit ?
                    <InlineEditCell
                      display={c.cell(row)}
                      value={c.edit.value(row)}
                      onSave={(v) => c.edit!.onSave(row, v)}
                      type={c.edit.type}
                      label={c.header}
                      lockedReason={c.edit.lockedReason?.(row) ?? null}
                      align={c.align} /> :


                    c.cell(row)
                    }
                      </td>
                  )}
                    {rowActions &&
                  <td className="sticky right-0 border-l border-border bg-card px-1 text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActions actions={rowActions(row)} label={`Actions for ${id}`} />
                      </td>
                  }
                  </tr>);

            })
            }
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <span className="tabular">
          {from}–{to} of {t.filtered.length}
          {t.query && t.filtered.length !== rows.length ? ` · filtered from ${rows.length}` : ''}
          {footerNote ? ` · ${footerNote}` : ''}
        </span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5">
            Rows
            <select value={t.pageSize} onChange={(e) => t.setPageSize(Number(e.target.value))} className="h-7 rounded-md border border-border bg-card px-1.5 text-xs text-foreground">
              {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button type="button" disabled={t.page === 0} onClick={() => t.setPage(t.page - 1)} className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card disabled:opacity-40" aria-label="Previous page">
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="tabular">{t.page + 1} / {t.pageCount}</span>
          <button type="button" disabled={t.page >= t.pageCount - 1} onClick={() => t.setPage(t.page + 1)} className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card disabled:opacity-40" aria-label="Next page">
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>);

}