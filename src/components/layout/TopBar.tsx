import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BookOpen, Check, ChevronDown, Languages, LogOut, Menu, Moon, Plus, Search, Sun, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, MenuItem, MenuLabel } from '../common/Popover';
import { useApp } from '../../contexts/AppContext';
import { useAdmin } from '../../contexts/AdminContext';
import { campuses, roles, academicYears } from '../../data/school';
import { notifications } from '../../data/communication';
import { Avatar } from '../common/PersonCell';
import { quickActions } from '../../data/quickActions';
import { cn } from '../../utils/cn';
import { SababLogo } from './SababLogo';
import { CountBadge } from '../common/CountBadge';
import { TopNavStrip } from './TopNavStrip';

const iconBtn = 'relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 data-[state=open]:bg-muted data-[state=open]:text-foreground';
const pill = 'inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-[13px] text-foreground hover:border-primary/40 data-[state=open]:border-primary/50';

interface TopBarProps {
  onMenu: () => void;
  onSearch: () => void;
}

export function TopBar({ onMenu, onSearch }: TopBarProps) {
  const { role, roleInfo, setRole, campusId, setCampusId, year, setYear, dark, setDark, lang, setLang, online, setOnline } = useApp();
  const { currentYear } = useAdmin();
  const navigate = useNavigate();
  const [read, setRead] = useState<Set<string>>(new Set());
  const mine = notifications.filter((n) => n.roles.includes(role));
  const unread = mine.filter((n) => !read.has(n.id)).length;
  const schoolScoped = role !== 'platform' && role !== 'parent';
  const actions = quickActions[role] ?? [];

  const switchRole = (id: typeof role) => {
    setRole(id);
    const r = roles.find((x) => x.id === id);
    if (r) navigate(r.home);
    toast.info(`Viewing as ${r?.label}`, { description: `${r?.user} · ${r?.scope}` });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex min-h-14 flex-wrap items-center gap-2 px-3 py-2 sm:h-14 sm:flex-nowrap sm:gap-2.5 sm:px-4 sm:py-0 lg:px-6">
        <div className="flex shrink-0 items-center gap-1 lg:hidden">
          <button type="button" className={iconBtn} onClick={onMenu} aria-label="Open navigation menu" title="All modules">
            <Menu className="size-5" />
          </button>
          <button type="button" onClick={() => navigate(roleInfo.home)} className="rounded-lg focus-visible:outline-2" aria-label="Sabab home">
            <SababLogo collapsed />
          </button>
        </div>

        <button type="button" onClick={onSearch} className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-[13px] text-subtle hover:border-primary/40 sm:max-w-xs" aria-label="Search (Ctrl+K)">
          <Search className="size-4 shrink-0" />
          <span className="truncate">{role === 'platform' ? 'Search tenants…' : 'Search students, pages…'}</span>
          <kbd className="ml-auto hidden rounded border border-border px-1 text-[10px] sm:inline">Ctrl K</kbd>
        </button>

        {schoolScoped &&
        <div className="hidden items-center gap-1.5 md:flex">
            <Popover
            triggerLabel="Campus"
            triggerClassName={pill}
            width={260}
            className="p-1"
            trigger={<><span className="size-2 rounded-full bg-success" aria-hidden />{campusId === 'all' ? 'All campuses' : campuses.find((c) => c.id === campusId)?.short}<ChevronDown className="size-3.5 text-subtle" /></>}>
            
              {(close) =>
            <>
                  <MenuLabel>Campus scope</MenuLabel>
                  {(role === 'principal' || role === 'owner') &&
              <MenuItem active={campusId === 'all'} onClick={() => {setCampusId('all');close();}}>
                      <span className="flex-1">All campuses (consolidated)</span>{campusId === 'all' && <Check />}
                    </MenuItem>
              }
                  {campuses.map((c) =>
              <MenuItem key={c.id} active={campusId === c.id} onClick={() => {setCampusId(c.id);close();}}>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span lang="bn" className="font-bn text-[11px] text-muted-foreground">{c.bn}</span>
                    </MenuItem>
              )}
                </>
            }
            </Popover>
            <Popover triggerLabel="Academic year" triggerClassName={pill} width={240} className="p-1" trigger={<>AY {year}<ChevronDown className="size-3.5 text-subtle" /></>}>
              {(close) =>
            <>
                  <MenuLabel>Academic year</MenuLabel>
                  {[...new Set([currentYear, ...academicYears])].sort((a, b) => b.localeCompare(a)).map((y) =>
              <MenuItem key={y} active={year === y} onClick={() => {setYear(y);close();if (y !== currentYear) toast.info(`AY ${y} is read-only history`, { description: 'Archived years cannot be edited.' });}}>
                      <span className="flex-1">{y}</span>
                      <span className="text-[11px] text-muted-foreground">{y === currentYear ? 'Current' : 'Archived · read-only'}</span>
                    </MenuItem>
              )}
                </>
            }
            </Popover>
          </div>
        }

        <div className="ml-auto flex items-center gap-1">
          {actions.length > 0 &&
          <Popover
            triggerLabel="Quick actions"
            align="end"
            width={240}
            className="p-1"
            triggerClassName="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary-hover"
            trigger={<><Plus className="size-4" /><span className="hidden sm:inline">New</span></>}>
            
              {(close) =>
            <>
                  <MenuLabel>Quick actions</MenuLabel>
                  {actions.map((a) =>
              <MenuItem key={a.label} onClick={() => {close();navigate(a.href);}}>
                      <a.icon className="text-muted-foreground" />
                      {a.label}
                    </MenuItem>
              )}
                </>
            }
            </Popover>
          }

          {role === 'teacher' &&
          <button type="button" className={cn(iconBtn, !online && 'text-warning')} onClick={() => {setOnline(!online);toast(online ? 'Offline mode (simulated)' : 'Back online — syncing drafts', { description: online ? 'Attendance & lesson drafts are saved on this device.' : 'Pending lessons will replay safely.' });}} aria-label={online ? 'Simulate offline' : 'Go online'} title={online ? 'Online — click to simulate offline' : 'Offline — click to reconnect'}>
              {online ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
            </button>
          }

          <button type="button" className={cn(iconBtn, 'hidden sm:inline-flex')} onClick={() => setLang(lang === 'en' ? 'bn' : 'en')} aria-label="Toggle Bangla navigation labels" title={lang === 'en' ? 'বাংলা মেনু' : 'English menu'}>
            {lang === 'en' ? <span lang="bn" className="font-bn text-[13px] font-semibold">বাং</span> : <Languages className="size-4" />}
          </button>

          <button type="button" className={iconBtn} onClick={() => setDark(!dark)} aria-label={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          <Popover
            triggerLabel={`Notifications, ${unread} unread`}
            triggerClassName={iconBtn}
            align="end"
            width={340}
            trigger={<><Bell className="size-4" /><CountBadge count={unread} overlay label={`${unread} unread`} /></>}>
            
            {(close) =>
            <>
                <div className="sticky top-0 flex items-center justify-between border-b border-border bg-popover px-3 py-2">
                  <span className="text-[13px] font-semibold">Notifications</span>
                  <button type="button" className="text-xs font-medium text-primary hover:underline disabled:text-subtle disabled:no-underline" disabled={unread === 0} onClick={() => setRead(new Set(mine.map((n) => n.id)))}>Mark all read</button>
                </div>
                <div className="p-1">
                  {mine.length === 0 && <p className="px-3 py-6 text-center text-xs text-muted-foreground">You're all caught up.</p>}
                  {mine.map((n) =>
                <MenuItem key={n.id} onClick={() => {setRead((r) => new Set(r).add(n.id));close();navigate(n.href);}} className="items-start gap-2 py-2">
                      <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', read.has(n.id) ? 'bg-border' : n.tone === 'danger' ? 'bg-danger' : n.tone === 'warning' ? 'bg-warning' : n.tone === 'success' ? 'bg-success' : 'bg-info')} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-[13px] leading-snug', read.has(n.id) ? 'font-normal text-muted-foreground' : 'font-medium')}>{n.title}</span>
                        <span className="block text-[11.5px] text-muted-foreground">{n.detail}</span>
                      </span>
                      <span className="shrink-0 text-[10.5px] text-subtle">{n.at}</span>
                    </MenuItem>
                )}
                </div>
              </>
            }
          </Popover>

          <Popover
            triggerLabel="Account and role"
            align="end"
            width={352}
            triggerClassName="flex h-9 items-center gap-2 rounded-lg px-1.5 hover:bg-muted data-[state=open]:bg-muted"
            trigger={
            <>
                <Avatar name={roleInfo.user} className="bg-inverse text-white" />
                <span className="hidden text-left leading-tight xl:block">
                  <span className="block text-[13px] font-medium text-foreground">{roleInfo.user}</span>
                  <span className="block text-[11px] text-muted-foreground">{roleInfo.label}</span>
                </span>
                <ChevronDown className="hidden size-3.5 text-subtle sm:block" />
              </>
            }>
            
            {(close) =>
            <>
                <div className="flex items-center gap-3 border-b border-border px-3 py-3">
                  <Avatar name={roleInfo.user} className="bg-inverse text-white" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-foreground">{roleInfo.user}</p>
                    <p className="truncate text-[11.5px] text-muted-foreground">{roleInfo.title} · {roleInfo.scope}</p>
                  </div>
                </div>
                <div className="p-1.5">
                  <MenuLabel className="px-1.5 pt-0.5">Switch role · prototype</MenuLabel>
                  <div className="grid grid-cols-2 gap-0.5">
                    {roles.map((r) =>
                  <MenuItem key={r.id} active={r.id === role} aria-current={r.id === role ? 'true' : undefined} onClick={() => {close();switchRole(r.id);}} className="flex-col items-start gap-0">
                        <span className="w-full truncate text-[12.5px] font-medium leading-tight">{r.label}</span>
                        <span className="w-full truncate text-[10.5px] leading-tight text-muted-foreground">{r.user}</span>
                      </MenuItem>
                  )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 border-t border-border p-1.5">
                  <MenuItem onClick={() => {close();navigate('/guide');}} className="flex-1 justify-center text-[12.5px]"><BookOpen /> Guide</MenuItem>
                  <MenuItem onClick={() => {close();toast.info('Sign out', { description: 'Authentication is not part of the prototype.' });}} className="flex-1 justify-center text-[12.5px]"><LogOut /> Sign out</MenuItem>
                </div>
              </>
            }
          </Popover>
        </div>
      </div>
      <TopNavStrip />
    </header>);

}