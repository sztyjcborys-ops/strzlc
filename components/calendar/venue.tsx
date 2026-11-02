import { UtensilsCrossed, Wine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VENUE_META, type Venue } from '@/lib/store'

export const VENUE_ORDER: Venue[] = ['sala', 'bar']

export const VENUE_STYLES: Record<Venue, { icon: typeof Wine; badge: string; tag: string; iconBox: string; ring: string }> = {
  sala: {
    icon: UtensilsCrossed,
    badge: 'bg-accent text-accent-foreground ring-primary/15',
    tag: 'bg-primary text-primary-foreground',
    iconBox: 'bg-accent text-primary',
    ring: 'border-primary ring-primary/15',
  },
  bar: {
    icon: Wine,
    badge: 'bg-gold-soft text-gold-fg ring-gold/25',
    tag: 'bg-gold text-white',
    iconBox: 'bg-gold-soft text-gold-fg',
    ring: 'border-gold ring-gold/20',
  },
}

export function VenueBadge({ venue, className }: { venue: Venue; className?: string }) {
  const Icon = VENUE_STYLES[venue].icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        VENUE_STYLES[venue].badge,
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {VENUE_META[venue].short}
    </span>
  )
}

export function VenueTag({ venue, className }: { venue: Venue; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] text-[10px] font-semibold leading-none',
        VENUE_STYLES[venue].tag,
        className,
      )}
      title={VENUE_META[venue].label}
    >
      {VENUE_META[venue].short[0]}
    </span>
  )
}

export function venuesOf(events: { venue: Venue }[]) {
  return VENUE_ORDER.filter((v) => events.some((e) => e.venue === v))
}

export function VenueMarks({ venues, className }: { venues: Venue[]; className?: string }) {
  if (venues.length === 0) return null
  return (
    <span aria-hidden className={cn('pointer-events-none flex -space-x-1', className)}>
      {venues.map((v) => (
        <span
          key={v}
          className={cn(
            'flex size-3.5 items-center justify-center rounded-full text-[8px] font-bold leading-none ring-[1.5px] ring-card',
            VENUE_STYLES[v].tag,
          )}
        >
          {VENUE_META[v].short[0]}
        </span>
      ))}
    </span>
  )
}

export function VenueLegend({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      {VENUE_ORDER.map((v) => (
        <span key={v} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <VenueMarks venues={[v]} />
          {VENUE_META[v].short}
        </span>
      ))}
    </span>
  )
}

export function VenuePicker({ value, onChange }: { value: Venue; onChange: (v: Venue) => void }) {
  return (
    <div role="radiogroup" aria-label="Miejsce imprezy" className="grid grid-cols-2 gap-2.5">
      {VENUE_ORDER.map((v) => {
        const active = value === v
        const Icon = VENUE_STYLES[v].icon
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={cn(
              'flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition',
              active ? cn('ring-[3px]', VENUE_STYLES[v].ring) : 'border-border hover:border-zinc-300 hover:bg-muted/40',
            )}
          >
            <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', VENUE_STYLES[v].iconBox)}>
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{VENUE_META[v].short}</span>
              <span className="block text-xs leading-snug text-muted-foreground">{VENUE_META[v].description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
