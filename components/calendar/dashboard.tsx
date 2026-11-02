'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { CalendarCheck, CalendarDays, CircleCheck, Hourglass, Info, Plus, TreePalm, Wallet, X } from 'lucide-react'
import { VENUE_META, useStore, type CalendarEvent, type Closure, type EventStatus, type Venue } from '@/lib/store'
import { ClosuresSheet } from './closures-sheet'
import { formatPLN, paidAmount, remainingAmount } from '@/lib/money'
import { StatusLegend } from './status'
import { VENUE_ORDER, VENUE_STYLES } from './venue'
import { MONTHS_GENITIVE, addDays, diffDays, formatShort, fromISO, todayISO, weekdayLong } from '@/lib/date'
import { cn } from '@/lib/utils'
import { MonthCalendar } from './month-calendar'
import { YearView } from './year-view'
import { EventCard } from './event-card'
import { EventFormSheet } from './event-form-sheet'
import { ProfileSheet, Avatar } from './profile-sheet'
import { SettingsSheet } from './settings-sheet'
import { AppSidebar } from './app-sidebar'
import { UpcomingList } from './upcoming-list'
import { primaryButtonClass, secondaryButtonClass } from './sheet'

type View = 'month' | 'year'
type Panel = null | 'form' | 'profile' | 'settings' | 'closures'

export function Dashboard() {
  const { user, events, closures, settings, autoRemoved, dismissAutoRemoved } = useStore()
  const today = todayISO()
  const [selected, setSelected] = useState(today)
  const [cursor, setCursor] = useState(() => {
    const d = fromISO(today)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [view, setView] = useState<View>('month')
  const [panel, setPanel] = useState<Panel>(null)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [venueFilter, setVenueFilter] = useState<'all' | Venue>('all')

  const visibleEvents = useMemo(
    () => (venueFilter === 'all' ? events : events.filter((e) => e.venue === venueFilter)),
    [events, venueFilter],
  )

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of [...visibleEvents].sort((a, b) => a.time.localeCompare(b.time))) {
      const list = map.get(e.date) ?? []
      list.push(e)
      map.set(e.date, list)
    }
    return map
  }, [visibleEvents])

  const closureByDate = useMemo(() => {
    const map = new Map<string, Closure>()
    for (const c of closures) {
      for (let d = c.start; d <= c.end; d = addDays(d, 1)) map.set(d, c)
    }
    return map
  }, [closures])

  const upcoming = useMemo(
    () =>
      visibleEvents
        .filter((e) => diffDays(today, e.date) >= 0)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [visibleEvents, today],
  )

  const statusCounts = useMemo(() => {
    const counts: Record<EventStatus, number> = { wstepna: 0, zaliczka: 0, oplacone: 0 }
    for (const e of upcoming) counts[e.status]++
    return counts
  }, [upcoming])

  const venueCounts = useMemo(() => {
    const counts: Record<'all' | Venue, number> = { all: 0, sala: 0, bar: 0 }
    for (const e of events) {
      if (diffDays(today, e.date) < 0) continue
      counts.all++
      counts[e.venue]++
    }
    return counts
  }, [events, today])

  const totals = useMemo(() => {
    let paid = 0
    let remaining = 0
    for (const e of upcoming) {
      paid += paidAmount(e)
      remaining += remainingAmount(e)
    }
    return { paid, remaining }
  }, [upcoming])

  const stats = [
    {
      label: 'Nadchodzące imprezy',
      value: String(upcoming.length),
      icon: CalendarDays,
      hint: `${statusCounts.oplacone} opłaconych · ${statusCounts.zaliczka} z zaliczką`,
      iconBox: 'bg-muted text-foreground',
    },
    {
      label: 'Rezerwacje wstępne',
      value: String(statusCounts.wstepna),
      icon: Hourglass,
      hint: 'czekają na zaliczkę',
      iconBox: 'bg-pending-soft text-pending-fg',
    },
    {
      label: 'Wpłacono',
      value: formatPLN(totals.paid),
      icon: CircleCheck,
      hint: 'zaliczki i pełne płatności',
      iconBox: 'bg-paid-soft text-paid-fg',
    },
    {
      label: 'Do zapłaty',
      value: formatPLN(totals.remaining),
      icon: Wallet,
      hint: 'pozostało od klientów',
      iconBox: 'bg-deposit-soft text-deposit-fg',
    },
  ]

  const venueTabs: { id: 'all' | Venue; label: string }[] = [
    { id: 'all', label: 'Wszystkie' },
    ...VENUE_ORDER.map((v) => ({ id: v, label: VENUE_META[v].short })),
  ]

  const dayEvents = eventsByDate.get(selected) ?? []
  const dayClosure = closureByDate.get(selected)

  function selectDay(iso: string) {
    setSelected(iso)
    const d = fromISO(iso)
    setCursor({ year: d.getFullYear(), month: d.getMonth() })
  }

  function shiftMonth(delta: number) {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  function openAdd() {
    setEditing(null)
    setPanel('form')
  }

  function openEdit(e: CalendarEvent) {
    setEditing(e)
    setPanel('form')
  }

  if (!user) return null

  const toolbarActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setPanel('closures')}
        aria-label="Dni wolne i urlopy"
        title="Dni wolne i urlopy"
        className={cn(secondaryButtonClass, 'h-8 px-2.5')}
      >
        <TreePalm className="size-4" aria-hidden />
        <span className="hidden sm:inline">Przerwy</span>
      </button>
      <button type="button" onClick={() => selectDay(today)} className={cn(secondaryButtonClass, 'h-8 px-2.5')}>
        Dziś
      </button>
      <div role="tablist" aria-label="Widok kalendarza" className="flex rounded-lg bg-muted p-0.5">
        {(['month', 'year'] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition',
              view === v ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {v === 'month' ? 'Miesiąc' : 'Rok'}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-dvh">
      <AppSidebar
        user={user}
        statusCounts={statusCounts}
        onOpenProfile={() => setPanel('profile')}
        onOpenSettings={() => setPanel('settings')}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-8">
          <Image src="/logo.png" alt="Karczma Strzelec" width={130} height={47} className="h-auto w-20 lg:hidden" priority />
          <nav aria-label="Ścieżka" className="hidden items-center gap-2 text-sm lg:flex">
            <span className="text-muted-foreground">Karczma Strzelec</span>
            <span className="text-border" aria-hidden>
              /
            </span>
            <span className="font-medium">Kalendarz</span>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={openAdd} className={cn(primaryButtonClass, 'h-9')}>
              <Plus className="size-4" aria-hidden />
              <span className="hidden sm:inline">Nowa impreza</span>
              <span className="sm:hidden">Dodaj</span>
            </button>
            <button
              type="button"
              onClick={() => setPanel('profile')}
              aria-label="Otwórz profil"
              className="rounded-full lg:hidden"
            >
              <Avatar name={user.name} className="size-9 text-sm" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-16 pt-6 md:px-8 md:pt-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-[28px]">Kalendarz rezerwacji</h1>
            <p className="text-sm text-muted-foreground">
              Zarządzaj terminami, zaliczkami i płatnościami za imprezy w jednym miejscu.
            </p>
          </div>

          <section aria-label="Podsumowanie" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-xs md:p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-medium leading-snug text-muted-foreground">{s.label}</p>
                  <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', s.iconBox)}>
                    <s.icon className="size-4" aria-hidden />
                  </span>
                </div>
                <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight md:text-2xl">{s.value}</p>
                <p className="mt-1 hidden text-xs text-muted-foreground sm:block">{s.hint}</p>
              </div>
            ))}
          </section>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Filtruj według miejsca" className="flex rounded-lg border border-border bg-card p-1 shadow-xs">
              {venueTabs.map((t) => {
                const active = venueFilter === t.id
                const Icon = t.id === 'all' ? null : VENUE_STYLES[t.id].icon
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setVenueFilter(t.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
                      active ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {Icon && <Icon className="size-3.5" aria-hidden />}
                    {t.label}
                    <span className={cn('text-xs tabular-nums', active ? 'text-background/70' : 'text-muted-foreground/70')}>
                      {venueCounts[t.id]}
                    </span>
                  </button>
                )
              })}
            </div>
            <StatusLegend className="hidden sm:flex" />
          </div>

          {autoRemoved.length > 0 && (
            <div
              role="status"
              className="mt-4 flex items-start gap-3 rounded-xl border border-pending/30 bg-pending-soft px-4 py-3 text-sm text-pending-fg"
            >
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p className="flex-1 leading-relaxed">
                Automatycznie usunięto {autoRemoved.length} rezerwacji wstępnych bez zaliczki:{' '}
                <strong className="font-semibold">
                  {autoRemoved.map((e) => `${e.title} (${formatShort(e.date)})`).join(', ')}
                </strong>
                .
              </p>
              <button
                type="button"
                onClick={dismissAutoRemoved}
                aria-label="Zamknij komunikat"
                className="rounded-md p-1 hover:bg-pending/10"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          <div className={cn('mt-3 grid gap-6', view === 'month' && 'xl:grid-cols-[minmax(0,1fr)_360px]')}>
            <section
              aria-label="Kalendarz"
              className="self-start overflow-hidden rounded-2xl bg-card shadow-xs ring-1 ring-border"
            >
              {view === 'month' ? (
                <MonthCalendar
                  year={cursor.year}
                  month={cursor.month}
                  selected={selected}
                  today={today}
                  eventsByDate={eventsByDate}
                  closureByDate={closureByDate}
                  onSelect={setSelected}
                  onShift={shiftMonth}
                  actions={toolbarActions}
                />
              ) : (
                <YearView
                  year={cursor.year}
                  today={today}
                  selected={selected}
                  eventsByDate={eventsByDate}
                  closureByDate={closureByDate}
                  actions={toolbarActions}
                  onYearShift={(d) => setCursor((c) => ({ ...c, year: c.year + d }))}
                  onPickDay={(iso) => {
                    selectDay(iso)
                    setView('month')
                  }}
                  onPickMonth={(m) => {
                    setCursor((c) => ({ ...c, month: m }))
                    setView('month')
                  }}
                />
              )}
            </section>

            {view === 'month' && (
              <aside className="grid content-start gap-6 md:grid-cols-2 md:items-start xl:grid-cols-1">
                <section
                  aria-labelledby="day-plan"
                  className="overflow-hidden rounded-2xl bg-card shadow-xs ring-1 ring-border"
                >
                  <div className="flex items-center gap-3 bg-brand-dark px-4 py-4 text-white">
                    <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white/10 leading-none ring-1 ring-white/10">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gold">
                        {MONTHS_GENITIVE[fromISO(selected).getMonth()].slice(0, 3)}
                      </span>
                      <span className="mt-1 text-lg font-semibold tabular-nums">{fromISO(selected).getDate()}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 id="day-plan" className="text-sm font-semibold capitalize">
                        {weekdayLong(selected)}
                        {selected === today && <span className="ml-1.5 font-normal normal-case text-white/60">· dziś</span>}
                      </h2>
                      <p className="truncate text-xs text-white/60">
                        {dayClosure
                          ? `${dayClosure.title} · lokal nieczynny`
                          : dayEvents.length === 0
                          ? 'Termin wolny'
                          : `${dayEvents.length} ${dayEvents.length === 1 ? 'impreza' : dayEvents.length < 5 ? 'imprezy' : 'imprez'}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openAdd}
                      aria-label="Dodaj imprezę w tym dniu"
                      className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    >
                      <Plus className="size-4" aria-hidden />
                    </button>
                  </div>

                  {dayEvents.length === 0 ? (
                    <div className="flex flex-col items-center px-6 py-10 text-center">
                      <span className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
                        <CalendarCheck className="size-5" aria-hidden />
                      </span>
                      <p className="mt-3 text-sm font-medium">Brak imprez w tym dniu</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {dayClosure ? `Dzień wolny: ${dayClosure.title}.` : 'Termin jest wolny do rezerwacji.'}
                      </p>
                      <button type="button" onClick={openAdd} className={cn(secondaryButtonClass, 'mt-4 h-9 rounded-full px-4')}>
                        <Plus className="size-4" aria-hidden />
                        Dodaj imprezę
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 p-3">
                      {dayEvents.map((e) => (
                        <EventCard key={e.id} event={e} onEdit={openEdit} />
                      ))}
                    </div>
                  )}
                </section>

                <UpcomingList
                  events={upcoming}
                  onPick={selectDay}
                  note={
                    settings.autoDelete
                      ? `Rezerwacje wstępne bez zaliczki są usuwane po ${settings.depositDays} dniach${
                          settings.graceDays ? ` (+${settings.graceDays} dni tolerancji)` : ''
                        }.`
                      : 'Automatyczne usuwanie rezerwacji wstępnych jest wyłączone.'
                  }
                />
              </aside>
            )}
          </div>
        </main>
      </div>

      <EventFormSheet open={panel === 'form'} onClose={() => setPanel(null)} defaultDate={selected} editing={editing} />
      <ProfileSheet open={panel === 'profile'} onClose={() => setPanel(null)} onOpenSettings={() => setPanel('settings')} />
      <ClosuresSheet open={panel === 'closures'} onClose={() => setPanel(null)} defaultDate={selected} />
      <SettingsSheet open={panel === 'settings'} onClose={() => setPanel(null)} onBack={() => setPanel('profile')} />
    </div>
  )
}
