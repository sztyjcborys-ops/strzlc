'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CalendarEvent, Closure, EventStatus } from '@/lib/store'
import { CLOSURE_STRIPES } from './closures-sheet'
import { MONTHS, WEEKDAYS_SHORT, monthMatrix } from '@/lib/date'
import { cn } from '@/lib/utils'
import { useHorizontalSwipe } from '@/hooks/use-swipe'
import { STATUS_ORDER, STATUS_STYLES, StatusLegend } from './status'
import { VenueLegend, VenueMarks, venuesOf } from './venue'

interface Props {
  year: number
  today: string
  selected: string
  eventsByDate: Map<string, CalendarEvent[]>
  closureByDate: Map<string, Closure>
  onYearShift: (delta: number) => void
  onPickDay: (iso: string) => void
  onPickMonth: (month: number) => void
  actions?: React.ReactNode
}

function dominantStatus(list: CalendarEvent[]): EventStatus {
  return STATUS_ORDER.find((s) => list.some((e) => e.status === s)) ?? 'oplacone'
}

function eventsLabel(n: number) {
  if (n === 1) return '1 impreza'
  const lastTwo = n % 100
  const last = n % 10
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} imprezy`
  return `${n} imprez`
}

export function YearView({ year, today, selected, eventsByDate, closureByDate, onYearShift, onPickDay, onPickMonth, actions }: Props) {
  const swipe = useHorizontalSwipe(onYearShift)
  const yearEvents = [...eventsByDate.entries()].filter(([iso]) => iso.startsWith(`${year}-`)).flatMap(([, l]) => l)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-5">
        <div className="flex items-center gap-3">
          <div className="inline-flex overflow-hidden rounded-lg border border-border shadow-xs">
            <button
              type="button"
              onClick={() => onYearShift(-1)}
              aria-label="Poprzedni rok"
              className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onYearShift(1)}
              aria-label="Następny rok"
              className="flex size-8 items-center justify-center border-l border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <h3 className="text-base font-semibold tabular-nums tracking-tight md:text-lg" aria-live="polite">
            {year}
          </h3>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {eventsLabel(yearEvents.length)}
          </span>
        </div>
        {actions}
      </div>

      <div {...swipe} className="grid touch-pan-y grid-cols-1 gap-3 p-4 min-[420px]:grid-cols-2 md:p-5 lg:grid-cols-3 2xl:grid-cols-4">
        {MONTHS.map((name, m) => {
          const cells = monthMatrix(year, m, true)
          const monthCount = cells
            .filter((c) => c.inMonth)
            .reduce((acc, c) => acc + (eventsByDate.get(c.iso)?.length ?? 0), 0)
          return (
            <div key={name} className="rounded-lg border border-border p-3">
              <button
                type="button"
                onClick={() => onPickMonth(m)}
                className="mb-2 flex w-full items-baseline justify-between rounded-md px-1 text-left transition-colors hover:text-primary"
              >
                <span className="text-sm font-semibold capitalize">{name}</span>
                <span className="text-xs text-muted-foreground">{monthCount > 0 ? eventsLabel(monthCount) : '—'}</span>
              </button>
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {WEEKDAYS_SHORT.map((w, i) => (
                  <span
                    key={i}
                    className={cn('pb-1 text-[10px] font-medium', i >= 5 ? 'text-gold' : 'text-muted-foreground')}
                  >
                    {w}
                  </span>
                ))}
                {cells.map((c) => {
                  if (!c.inMonth) return <span key={c.iso} className="aspect-square" aria-hidden />
                  const list = eventsByDate.get(c.iso)
                  const status = list?.length ? dominantStatus(list) : null
                  const isToday = c.iso === today
                  const closure = closureByDate.get(c.iso)
                  return (
                    <button
                      key={c.iso}
                      type="button"
                      onClick={() => onPickDay(c.iso)}
                      aria-label={`${c.day} ${name}${closure ? `, ${closure.title}` : ''}${list?.length ? `, ${list.length} imprez` : ''}`}
                      title={[closure?.title, ...(list?.map((e) => e.title) ?? [])].filter(Boolean).join(', ')}
                      className={cn(
                        'relative flex aspect-square items-center justify-center rounded-md text-xs tabular-nums transition hover:ring-1 hover:ring-primary/40',
                        status
                          ? cn(STATUS_STYLES[status].cell, 'font-semibold')
                          : closure
                            ? cn('bg-zinc-200 text-zinc-600', CLOSURE_STRIPES)
                            : c.weekday >= 5
                            ? 'bg-gold-soft/60 text-foreground/70'
                            : 'text-muted-foreground',
                        isToday && 'bg-primary font-semibold text-primary-foreground',
                        c.iso === selected && !isToday && 'ring-1 ring-primary',
                      )}
                    >
                      {c.day}
                      {list && <VenueMarks venues={venuesOf(list)} className="absolute -right-1 -top-1 z-10" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-border px-4 py-3">
        <VenueLegend />
        <StatusLegend className="justify-center" />
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn('size-3 rounded-sm bg-zinc-200', CLOSURE_STRIPES)} aria-hidden />
          Dzień wolny / urlop
        </span>
      </div>
    </div>
  )
}
