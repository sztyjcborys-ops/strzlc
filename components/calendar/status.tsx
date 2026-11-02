import { cn } from '@/lib/utils'
import { STATUS_META, type EventStatus } from '@/lib/store'

export const STATUS_STYLES: Record<EventStatus, { dot: string; badge: string; bar: string; cell: string; chip: string }> = {
  wstepna: {
    dot: 'bg-pending',
    badge: 'bg-pending-soft text-pending-fg ring-pending/25',
    bar: 'bg-pending',
    cell: 'bg-pending-soft text-pending-fg',
    chip: 'bg-pending-soft text-pending-fg border-pending',
  },
  zaliczka: {
    dot: 'bg-deposit',
    badge: 'bg-deposit-soft text-deposit-fg ring-deposit/25',
    bar: 'bg-deposit',
    cell: 'bg-deposit-soft text-deposit-fg',
    chip: 'bg-deposit-soft text-deposit-fg border-deposit',
  },
  oplacone: {
    dot: 'bg-paid',
    badge: 'bg-paid-soft text-paid-fg ring-paid/25',
    bar: 'bg-paid',
    cell: 'bg-paid-soft text-paid-fg',
    chip: 'bg-paid-soft text-paid-fg border-paid',
  },
}

export const STATUS_ORDER: EventStatus[] = ['wstepna', 'zaliczka', 'oplacone']

export function StatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        STATUS_STYLES[status].badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', STATUS_STYLES[status].dot)} aria-hidden />
      {STATUS_META[status].short}
    </span>
  )
}

export function StatusPicker({
  value,
  onChange,
  name,
}: {
  value: EventStatus
  onChange: (s: EventStatus) => void
  name: string
}) {
  return (
    <div role="radiogroup" aria-label="Status płatności" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
      {STATUS_ORDER.map((s) => {
        const active = value === s
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={active}
            name={name}
            onClick={() => onChange(s)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition',
              active
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span className={cn('size-2 rounded-full', STATUS_STYLES[s].dot, !active && 'opacity-50')} aria-hidden />
            {STATUS_META[s].short}
          </button>
        )
      })}
    </div>
  )
}

const STATUS_ACTIVE_RING: Record<EventStatus, string> = {
  wstepna: 'border-pending bg-pending-soft/60 ring-pending/20',
  zaliczka: 'border-deposit bg-deposit-soft/60 ring-deposit/20',
  oplacone: 'border-paid bg-paid-soft/60 ring-paid/20',
}

export function StatusCards({ value, onChange }: { value: EventStatus; onChange: (s: EventStatus) => void }) {
  return (
    <div role="radiogroup" aria-label="Status płatności" className="flex flex-col gap-2">
      {STATUS_ORDER.map((s) => {
        const active = value === s
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(s)}
            className={cn(
              'flex items-start gap-3 rounded-xl border bg-card p-3 text-left transition',
              active ? cn('ring-[3px]', STATUS_ACTIVE_RING[s]) : 'border-border hover:border-zinc-300 hover:bg-muted/40',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                active ? 'border-transparent' : 'border-zinc-300',
                active && STATUS_STYLES[s].dot,
              )}
              aria-hidden
            >
              {active && <span className="size-1.5 rounded-full bg-white" />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{STATUS_META[s].label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{STATUS_META[s].description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function StatusLegend({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground', className)}>
      {STATUS_ORDER.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className={cn('size-2 rounded-full', STATUS_STYLES[s].dot)} aria-hidden />
          {STATUS_META[s].short}
        </li>
      ))}
    </ul>
  )
}
