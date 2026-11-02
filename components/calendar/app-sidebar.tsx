'use client'

import Image from 'next/image'
import { CalendarDays, ChevronsUpDown, Settings, Users } from 'lucide-react'
import { STATUS_META, type EventStatus, type SessionUser } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Avatar } from './profile-sheet'
import { STATUS_ORDER, STATUS_STYLES } from './status'

interface Props {
  user: SessionUser
  statusCounts: Record<EventStatus, number>
  onOpenProfile: () => void
  onOpenSettings: () => void
}

export function AppSidebar({ user, statusCounts, onOpenProfile, onOpenSettings }: Props) {
  const nav = [
    { label: 'Kalendarz', icon: CalendarDays, active: true, onClick: undefined },
    { label: 'Zespół', icon: Users, active: false, onClick: onOpenProfile },
    { label: 'Ustawienia', icon: Settings, active: false, onClick: onOpenSettings },
  ]

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Image src="/logo.png" alt="Karczma Strzelec" width={130} height={47} className="h-auto w-28" priority />
      </div>

      <nav aria-label="Główna nawigacja" className="flex flex-col gap-0.5 p-3">
        <p className="px-2 pb-1.5 pt-2 text-xs font-medium text-muted-foreground">Panel</p>
        {nav.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            aria-current={item.active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
              item.active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-3">
        <p className="px-2 pb-1.5 pt-3 text-xs font-medium text-muted-foreground">Statusy rezerwacji</p>
        <ul className="flex flex-col gap-0.5">
          {STATUS_ORDER.map((s) => (
            <li key={s} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground">
              <span className={cn('size-2 rounded-full', STATUS_STYLES[s].dot)} aria-hidden />
              <span className="flex-1">{STATUS_META[s].short}</span>
              <span className="font-mono text-xs tabular-nums">{statusCounts[s]}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto border-t border-border p-3">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex w-full items-center gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-muted"
        >
          <Avatar name={user.name} className="size-8 text-sm" />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-medium">{user.name}</span>
            <span className="block text-xs text-muted-foreground">
              {user.role === 'admin' ? 'Administrator' : 'Pracownik'}
            </span>
          </span>
          <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden />
        </button>
      </div>
    </aside>
  )
}
