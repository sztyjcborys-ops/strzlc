'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { VENUE_META, type CalendarEvent, type Closure } from '@/lib/store'
import { CLOSURE_STRIPES } from './closures-sheet'
import { MONTHS, WEEKDAYS, monthMatrix } from '@/lib/date'
import { cn } from '@/lib/utils'
import { useHorizontalSwipe } from '@/hooks/use-swipe'
import { STATUS_STYLES } from './status'
import { VENUE_STYLES, VenueMarks, venuesOf } from './venue'

interface Props {
  year: number
  month: number
  selected: string
  today: string
  eventsByDate: Map<string, CalendarEvent[]>
  closureByDate: Map<string, Closure>
  onSelect: (iso: string) => void
  onShift: (delta: number) => void
  actions?: React.ReactNode
}

const STATUS_ACCENT: Record<CalendarEvent['status'], string> = {
  wstepna: 'border-l-pending',
  zaliczka: 'border-l-deposit',
  oplacone: 'border-l-paid',
}

export function MonthCalendar({ year, month, selected, today, eventsByDate, closureByDate, onSelect, onShift, actions }: Props) {
  const cells = monthMatrix(year, month)
  const swipe = useHorizontalSwipe(onShift)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-2 pt-4 md:px-6 md:pt-5">
        <div className="flex items-center gap-2">
          <div className="-ml-2 flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => onShift(-1)}
              aria-label="Poprzedni miesiąc"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onShift(1)}
              aria-label="Następny miesiąc"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <h3 className="min-w-0 text-xl font-semibold capitalize tracking-tight md:text-2xl" aria-live="polite">
            {MONTHS[month]} <span className="font-normal text-muted-foreground">{year}</span>
          </h3>
        </div>
        {actions}
      </div>

      <div role="grid" aria-label={`${MONTHS[month]} ${year}`} className="touch-pan-y px-2 pb-3 md:px-4 md:pb-4" {...swipe}>
        <div role="row" className="grid grid-cols-7 gap-1 md:gap-1.5">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              role="columnheader"
              className={cn(
                'py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:px-2 md:text-left',
                i >= 5 && 'text-gold-fg',
              )}
            >
              {w}
            </div>
          ))}
        </div>

        <div role="row" className="grid grid-cols-7 gap-1 md:gap-1.5">
          {cells.map((c) => {
            const dayEvents = eventsByDate.get(c.iso) ?? []
            const isToday = c.iso === today
            const isSelected = c.iso === selected
            const weekend = c.weekday >= 5
            const hasEvents = dayEvents.length > 0
            const closure = closureByDate.get(c.iso)
            const closureStart = closure && (closure.start === c.iso || c.weekday === 0)
            return (
              <button
                key={c.iso}
                type="button"
                role="gridcell"
                aria-selected={isSelected}
                aria-current={isToday ? 'date' : undefined}
                aria-label={`${c.day} ${MONTHS[month]}${closure ? `, ${closure.title}` : ''}${hasEvents ? `, ${dayEvents.length} imprez` : ''}`}
                onClick={() => onSelect(c.iso)}
                className={cn(
                  'group relative flex min-h-14 flex-col items-center gap-1 rounded-xl p-1.5 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-28 md:items-stretch md:p-2',
                  !c.inMonth && 'opacity-40',
                  isSelected
                    ? 'bg-accent shadow-[inset_0_0_0_1.5px_var(--primary)]'
                    : cn(
                        closure ? cn('bg-zinc-200/70', CLOSURE_STRIPES) : weekend ? 'bg-gold-soft/50' : 'bg-muted/50',
                        'hover:bg-card hover:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_4px_12px_-2px_rgb(0_0_0/0.08)]',
                      ),
                  closure && isSelected && CLOSURE_STRIPES,
                )}
              >
                {closure && (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute inset-x-0 bottom-1 h-1 bg-zinc-500/70 md:hidden',
                      closure.start === c.iso && 'left-1.5 rounded-l-full',
                      closure.end === c.iso && 'right-1.5 rounded-r-full',
                    )}
                  />
                )}
                <span className="flex w-full items-center justify-center md:justify-between">
                  <span
                    className={cn(
                      'flex size-7 items-center justify-center rounded-full text-[13px] font-medium tabular-nums transition-colors',
                      isToday && 'bg-primary font-semibold text-primary-foreground',
                      !isToday && isSelected && 'font-semibold text-primary',
                    )}
                  >
                    {c.day}
                  </span>
                  {hasEvents && (
                    <span className="hidden text-[11px] font-medium tabular-nums text-muted-foreground md:inline">
                      {dayEvents.length}
                    </span>
                  )}
                </span>

                {hasEvents && (
                  <VenueMarks venues={venuesOf(dayEvents)} className="absolute -right-0.5 -top-0.5 z-10 md:hidden" />
                )}

                {hasEvents && (
                  <span className="flex gap-1 md:hidden" aria-hidden>
                    {dayEvents.slice(0, 3).map((e) => (
                      <span key={e.id} className={cn('size-1.5 rounded-full', STATUS_STYLES[e.status].dot)} />
                    ))}
                  </span>
                )}

                {closure && (
                  <span
                    aria-hidden
                    className="hidden truncate rounded-md bg-zinc-700 px-1.5 py-0.5 text-[11px] font-medium leading-tight text-white md:block"
                  >
                    {closureStart ? closure.title : '\u00a0'}
                  </span>
                )}

                <span className="hidden min-w-0 flex-col gap-1 md:flex" aria-hidden>
                  {dayEvents.slice(0, 2).map((e) => {
                    const VenueIcon = VENUE_STYLES[e.venue].icon
                    return (
                      <span
                        key={e.id}
                        className={cn(
                          'flex min-w-0 flex-col rounded-md border-l-[3px] bg-card px-1.5 py-1 shadow-xs ring-1 ring-black/[0.04]',
                          STATUS_ACCENT[e.status],
                        )}
                      >
                        <span className="truncate text-xs font-medium leading-tight">{e.title}</span>
                        <span className="mt-1 flex items-center gap-1 text-[10px] leading-none text-muted-foreground">
                          <span
                            className={cn(
                              'inline-flex items-center gap-0.5 rounded-[4px] px-1 py-0.5 font-semibold',
                              VENUE_STYLES[e.venue].tag,
                            )}
                          >
                            <VenueIcon className="size-2.5 shrink-0" />
                            {VENUE_META[e.venue].short}
                          </span>
                          <span className="tabular-nums">{e.time}</span>
                        </span>
                      </span>
                    )
                  })}
                  {dayEvents.length > 2 && (
                    <span className="px-1 text-[11px] font-medium text-muted-foreground">+{dayEvents.length - 2} więcej</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
