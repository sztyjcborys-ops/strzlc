'use client'

import { useState } from 'react'
import { Clock, Hourglass, Pencil, Phone, Trash2, Users } from 'lucide-react'
import { useStore, type CalendarEvent } from '@/lib/store'
import { daysLabel, diffDays, formatLong, formatShort, relativeDue, todayISO } from '@/lib/date'
import { formatPLN, paidAmount, remainingAmount } from '@/lib/money'
import { cn } from '@/lib/utils'
import { STATUS_STYLES, StatusBadge, StatusPicker } from './status'
import { VenueBadge } from './venue'
import { ghostButtonClass } from './sheet'

const DUE_TONE_CLASS = {
  overdue: 'bg-red-50 text-red-700 ring-red-200',
  soon: 'bg-amber-50 text-amber-800 ring-amber-200',
  upcoming: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
} as const

function DueDate({ iso }: { iso: string }) {
  const rel = relativeDue(iso)
  return (
    <span className="whitespace-nowrap">
      <span className="font-medium text-foreground tabular-nums">{formatShort(iso)}</span>
      {rel && (
        <span
          className={cn(
            'ml-1.5 inline-flex items-center rounded-full px-1.5 py-px text-[11px] font-medium leading-4 ring-1 ring-inset',
            DUE_TONE_CLASS[rel.tone],
          )}
        >
          {rel.label}
        </span>
      )}
    </span>
  )
}

export function EventCard({ event, onEdit }: { event: CalendarEvent; onEdit: (e: CalendarEvent) => void }) {
  const { updateEvent, deleteEvent, deletionDate } = useStore()
  const [confirming, setConfirming] = useState(false)
  const removeOn = deletionDate(event)
  const daysLeft = removeOn ? diffDays(todayISO(), removeOn) : null

  const paid = paidAmount(event)
  const remaining = remainingAmount(event)
  const progress = event.price ? Math.min(100, Math.round((paid / event.price) * 100)) : 0

  const meta = [
    event.time && { icon: Clock, label: 'Godzina', value: event.time },
    event.guests && { icon: Users, label: 'Liczba gości', value: `${event.guests} os.` },
    event.phone && {
      icon: Phone,
      label: 'Telefon',
      value: (
        <a href={`tel:${event.phone.replace(/\s/g, '')}`} className="underline-offset-2 hover:text-foreground hover:underline">
          {event.phone}
        </a>
      ),
    },
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: React.ReactNode }[]

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <VenueBadge venue={event.venue} />
          <StatusBadge status={event.status} />
        </div>

        <h4 className="mt-2.5 text-base font-semibold leading-snug text-pretty">{event.title}</h4>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{event.client}</p>

        {meta.length > 0 && (
          <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            {meta.map((m) => (
              <div key={m.label} className="flex min-w-0 items-center gap-1.5">
                <m.icon className="size-3.5 shrink-0" aria-hidden />
                <dt className="sr-only">{m.label}</dt>
                <dd className="truncate tabular-nums">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
          {event.price ? (
            <>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Wpłacono</span>
                <span className="tabular-nums">
                  <span className="font-semibold">{formatPLN(paid)}</span>
                  <span className="text-muted-foreground"> / {formatPLN(event.price)}</span>
                </span>
              </div>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Postęp płatności"
              >
                <div className={cn('h-full rounded-full transition-all', STATUS_STYLES[event.status].bar)} style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {remaining > 0 ? (
                  <>
                    Do zapłaty <span className="font-medium text-foreground tabular-nums">{formatPLN(remaining)}</span>
                    {event.status !== 'oplacone' && (
                      <>
                        {' · termin '}
                        <DueDate iso={event.paymentDue} />
                      </>
                    )}
                  </>
                ) : (
                  'Rozliczone w całości'
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {event.status === 'oplacone' ? (
                'Rozliczone w całości'
              ) : (
                <>
                  {'Termin płatności: '}
                  <DueDate iso={event.paymentDue} />
                </>
              )}
            </p>
          )}
        </div>

        {event.note && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{event.note}</p>}

        {daysLeft !== null && removeOn && (
          <p className="mt-3 flex items-center gap-2 rounded-lg border border-pending/30 bg-pending-soft px-3 py-2 text-xs font-medium text-pending-fg">
            <Hourglass className="size-3.5 shrink-0" aria-hidden />
            {daysLeft <= 0
              ? 'Usunięcie dziś – brak zaliczki'
              : `Automatyczne usunięcie za ${daysLabel(daysLeft)} (${formatLong(removeOn)})`}
          </p>
        )}

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Zmień status</p>
          <StatusPicker name={`status-${event.id}`} value={event.status} onChange={(s) => updateEvent(event.id, { status: s })} />
        </div>
      </div>

      <footer className="flex items-center justify-end gap-1 border-t border-border px-3 py-2">
        {confirming ? (
          <>
            <span className="mr-auto pl-1 text-sm text-muted-foreground">Usunąć imprezę?</span>
            <button type="button" onClick={() => setConfirming(false)} className={ghostButtonClass}>
              Anuluj
            </button>
            <button
              type="button"
              onClick={() => deleteEvent(event.id)}
              className="rounded-md bg-destructive px-2.5 py-1.5 text-sm font-medium text-white transition hover:bg-destructive/90"
            >
              Tak, usuń
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => onEdit(event)} className={ghostButtonClass}>
              <Pencil className="size-3.5" aria-hidden /> Edytuj
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className={cn(ghostButtonClass, 'hover:bg-destructive/10 hover:text-destructive')}
            >
              <Trash2 className="size-3.5" aria-hidden /> Usuń
            </button>
          </>
        )}
      </footer>
    </article>
  )
}
