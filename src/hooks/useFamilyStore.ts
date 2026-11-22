import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import type { Family, FamilyDraft } from '../types/family';
import type { TimelineEntry } from '../types/academic';
import type { Student } from '../types/school';
import { childrenOf, familyFromStudent, familyIdFor, guardianPatch, maxFamilyNo, normalizePhone, syncSiblings } from '../utils/family';

interface Deps {
  initial: Family[];
  students: Student[];
  setStudents: Dispatch<SetStateAction<Student[]>>;
  addAudit: (module: string, action: string, target: string, severity?: 'info' | 'warning' | 'critical') => void;
  actor: string;
  stamp: () => string;
}

/**
 * Families (households) — frontend contract for future /families APIs.
 * Children mirror the primary guardian's contact fields; sibling links are derived from membership.
 */
export function useFamilyStore({ initial, students, setStudents, addAudit, actor, stamp }: Deps) {
  const [families, setFamilies] = useState<Family[]>(initial);

  const entry = useCallback((action: string, tone?: TimelineEntry['tone'], note?: string): TimelineEntry => ({ at: stamp(), actor, action, tone, note }), [stamp, actor]);
  const log = useCallback((id: string, e: TimelineEntry) => setFamilies((l) => l.map((f) => f.id === id ? { ...f, history: [e, ...f.history] } : f)), []);
  const restudent = useCallback((fn: (list: Student[]) => Student[]) => setStudents((list) => syncSiblings(fn(list))), [setStudents]);

  const familyByPhone = useCallback((phone: string) => families.find((f) => normalizePhone(f.phone) === normalizePhone(phone)), [families]);

  /** Contact edits apply to every child. Changing the primary phone clears verification. */
  const updateFamily = useCallback((id: string, patch: Partial<FamilyDraft>, action = 'Contact details updated') => {
    const cur = families.find((f) => f.id === id);
    if (!cur) return;
    const phoneChanged = patch.phone !== undefined && normalizePhone(patch.phone) !== normalizePhone(cur.phone);
    const next: Family = { ...cur, ...patch, verified: phoneChanged ? false : cur.verified, history: [entry(phoneChanged ? `Primary phone changed ${cur.phone} → ${patch.phone} · re-verification needed` : action, phoneChanged ? 'warning' : 'info'), ...cur.history] };
    setFamilies((l) => l.map((f) => f.id === id ? next : f));
    restudent((list) => list.map((s) => s.familyId === id ? { ...s, ...guardianPatch(next) } : s));
    addAudit('Families', phoneChanged ? 'Guardian phone changed' : action, `${id} · ${next.guardianName}`, phoneChanged ? 'warning' : 'info');
  }, [families, entry, restudent, addAudit]);

  const verifyFamily = useCallback((id: string) => {
    setFamilies((l) => l.map((f) => f.id === id ? { ...f, verified: true, history: [entry('Phone verified by one-time code', 'success'), ...f.history] } : f));
    restudent((list) => list.map((s) => s.familyId === id ? { ...s, guardianVerified: true } : s));
    addAudit('Families', 'Guardian phone verified', id);
  }, [entry, restudent, addAudit]);

  const setPortal = useCallback((id: string, enabled: boolean) => {
    setFamilies((l) => l.map((f) => f.id === id ? { ...f, portalEnabled: enabled, history: [entry(enabled ? 'Portal access enabled' : 'Portal access disabled', enabled ? 'success' : 'warning'), ...f.history] } : f));
    addAudit('Families', enabled ? 'Portal access enabled' : 'Portal access disabled', id, enabled ? 'info' : 'warning');
  }, [entry, addAudit]);

  /** Moves a child into a family. An emptied old family is dissolved. */
  const linkChild = useCallback((familyId: string, studentId: string) => {
    const target = families.find((f) => f.id === familyId);
    const s = students.find((x) => x.id === studentId);
    if (!target || !s) return;
    const oldId = s.familyId;
    const emptied = oldId && oldId !== familyId && childrenOf(oldId, students).length === 1;
    restudent((list) => list.map((x) => x.id === studentId ? { ...x, familyId, ...guardianPatch(target) } : x));
    setFamilies((l) => l.filter((f) => !(emptied && f.id === oldId)));
    log(familyId, entry(`${s.name} linked${oldId ? ` (from ${oldId})` : ''}`, 'success'));
    if (oldId && !emptied) log(oldId, entry(`${s.name} moved to ${familyId}`, 'warning'));
    addAudit('Families', 'Child linked', `${s.name} → ${familyId}${emptied ? ` · ${oldId} dissolved` : ''}`);
    return emptied ? oldId : undefined;
  }, [families, students, restudent, log, entry, addAudit]);

  /** Splits a child into a new family that copies the current guardian (unverified until confirmed). */
  const unlinkChild = useCallback((studentId: string) => {
    const s = students.find((x) => x.id === studentId);
    if (!s) return '';
    const id = familyIdFor(maxFamilyNo(families) + 1);
    const fam = { ...familyFromStudent(s, id, `Split from ${s.familyId} for ${s.name}`, stamp(), actor), verified: false };
    setFamilies((l) => [fam, ...l]);
    restudent((list) => list.map((x) => x.id === studentId ? { ...x, familyId: id, guardianVerified: false } : x));
    if (s.familyId) log(s.familyId, entry(`${s.name} unlinked → ${id}`, 'warning'));
    addAudit('Families', 'Child unlinked', `${s.name} → new ${id}`, 'warning');
    return id;
  }, [students, families, stamp, actor, restudent, log, entry, addAudit]);

  const mergeFamilies = useCallback((keepId: string, dropId: string, reason: string) => {
    const keep = families.find((f) => f.id === keepId);
    const moving = childrenOf(dropId, students);
    if (!keep) return;
    restudent((list) => list.map((x) => x.familyId === dropId ? { ...x, familyId: keepId, ...guardianPatch(keep) } : x));
    setFamilies((l) => l.filter((f) => f.id !== dropId).map((f) => f.id === keepId ? { ...f, history: [entry(`Merged ${dropId} (${moving.map((m) => m.name).join(', ')})`, 'success', reason), ...f.history] } : f));
    addAudit('Families', 'Families merged', `${dropId} → ${keepId} · ${reason}`, 'warning');
  }, [families, students, restudent, entry, addAudit]);

  /** Used when a student is created: joins the family with the same phone, or starts a new one. */
  const resolveFamilyFor = useCallback((s: Student): {familyId: string;existing: boolean;patch: Partial<Student>;} => {
    const match = familyByPhone(s.guardianPhone);
    if (match) {
      log(match.id, entry(`${s.name} added to family`, 'success'));
      return { familyId: match.id, existing: true, patch: guardianPatch(match) };
    }
    const id = familyIdFor(maxFamilyNo(families) + 1);
    setFamilies((l) => [familyFromStudent(s, id, `Family created with ${s.name}`, stamp(), actor), ...l]);
    return { familyId: id, existing: false, patch: {} };
  }, [familyByPhone, families, log, entry, stamp, actor]);

  return { families, familyByPhone, updateFamily, verifyFamily, setPortal, linkChild, unlinkChild, mergeFamilies, resolveFamilyFor };
}

export type FamilyStore = ReturnType<typeof useFamilyStore>;