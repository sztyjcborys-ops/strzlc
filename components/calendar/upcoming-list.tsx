'use client'

import { Info } from 'lucide-react'
import { VENUE_META, type CalendarEvent } from '@/lib/store'
import { MONTHS_GENITIVE, WEEKDAYS, fromISO, weekdayIndex } from '@/lib/date'
import { cn } from '@/lib/utils'
import { STATUS_STYLES } from './status'
import { VENUE_STYLES } from './venue'

interface Props {
  events: CalendarEvent[]
  onPick: (iso: string) => void
  note?: string
  className?: string
}

export function UpcomingList({ events, onPick, note, className }: Props) {
  return (
    <section aria-labelledby="upcoming" className={cn('flex flex-col rounded-2xl bg-card p-2 shadow-xs ring-1 ring-border', className)}>
      <div className="flex items-center justify-between px-3 pb-2 pt-2.5">
        <h2 id="upcoming" className="text-sm font-semibold">
          Najbliższe imprezy
        </h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {events.length}
        </span>
      </div>

      {events.length === 0 ? (
        <p className="px-3 pb-4 pt-2 text-sm text-muted-foreground">Brak zaplanowanych imprez.</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {events.slice(0, 6).map((e) => {
            const d = fromISO(e.date)
            const VenueIcon = VENUE_STYLES[e.venue].icon
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onPick(e.date)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/70"
                >
                  <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-muted/70 leading-none">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {MONTHS_GENITIVE[d.getMonth()].slice(0, 3)}
                    </span>
                    <span className="mt-1 text-lg font-semibold tabular-nums">{d.getDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{e.title}</span>
                    <span className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <span className="capitalize">{WEEKDAYS[weekdayIndex(e.date)]}</span>
                      <span aria-hidden>·</span>
                      <span className="tabular-nums">{e.time}</span>
                      <span aria-hidden>·</span>
                      <VenueIcon className="size-3 shrink-0" aria-hidden />
                      <span className="truncate">{VENUE_META[e.venue].short}</span>
                    </span>
                  </span>
                  <span
                    className={cn('size-2 shrink-0 rounded-full', STATUS_STYLES[e.status].dot)}
                    title={e.status}
                    aria-hidden
                  />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {note && (
        <p className="mt-auto flex items-start gap-2 px-3 pb-2 pt-3 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {note}
        </p>
      )}
    </section>
  )
}
