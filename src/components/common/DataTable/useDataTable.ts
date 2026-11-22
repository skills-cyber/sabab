import { useEffect, useMemo, useState } from 'react';
import type { Column } from './DataTable';

export interface SortState {
  id: string;
  dir: 'asc' | 'desc';
}

interface Options<T> {
  rows: T[];
  columns: Column<T>[];
  getRowId: (r: T) => string;
  searchText?: (r: T) => string;
  pageSize: number;
  initialSort?: SortState;
}

export function useDataTable<T>({ rows, columns, getRowId, searchText, pageSize: initialPageSize, initialSort }: Options<T>) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sort, setSort] = useState<SortState | null>(initialSort ?? null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(columns.filter((c) => c.defaultHidden).map((c) => c.id)));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dense, setDense] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim().toLowerCase()), 120);
    return () => window.clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    let r = debounced && searchText ? rows.filter((x) => searchText(x).toLowerCase().includes(debounced)) : rows;
    if (sort) {
      const col = columns.find((c) => c.id === sort.id);
      if (col?.sortValue) {
        const sv = col.sortValue;
        r = [...r].sort((a, b) => {
          const va = sv(a);
          const vb = sv(b);
          const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return r;
  }, [rows, debounced, sort, columns, searchText]);

  useEffect(() => setPage(0), [debounced, pageSize, rows.length]);

  // Drop selections that no longer exist (e.g. after archive).
  useEffect(() => {
    setSelected((s) => {
      const ids = new Set(rows.map(getRowId));
      const next = new Set([...s].filter((id) => ids.has(id)));
      return next.size === s.size ? s : next;
    });
  }, [rows, getRowId]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const visibleColumns = columns.filter((c) => !hidden.has(c.id));
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(getRowId(r)));

  const toggleSort = (id: string) =>
  setSort((s) => !s || s.id !== id ? { id, dir: 'asc' } : s.dir === 'asc' ? { id, dir: 'desc' } : null);

  const toggleColumn = (id: string) =>
  setHidden((h) => {
    const n = new Set(h);
    if (n.has(id)) n.delete(id);else
    n.add(id);
    return n;
  });

  const toggleRow = (id: string) =>
  setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id);else
    n.add(id);
    return n;
  });

  const togglePage = () =>
  setSelected((s) => {
    const n = new Set(s);
    if (allOnPageSelected) pageRows.forEach((r) => n.delete(getRowId(r)));else
    pageRows.forEach((r) => n.add(getRowId(r)));
    return n;
  });

  return {
    query, setQuery, sort, toggleSort, page: safePage, setPage, pageSize, setPageSize, pageCount, filtered, pageRows,
    hidden, toggleColumn, visibleColumns, selected, setSelected, toggleRow, togglePage, allOnPageSelected, dense, setDense
  };
}