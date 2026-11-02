'use client'

import { useState } from 'react'
import { Plus, Trash2, TreePalm } from 'lucide-react'
import { useStore } from '@/lib/store'
import { diffDays, formatShort, todayISO } from '@/lib/date'
import { cn } from '@/lib/utils'
import { FieldLabel, Sheet, inputClass, primaryButtonClass } from './sheet'

export const CLOSURE_STRIPES =
  'bg-[repeating-linear-gradient(135deg,rgb(0_0_0/0.06)_0_6px,transparent_6px_12px)]'

const PRESETS = ['Urlop', 'Przerwa świąteczna', 'Remont', 'Zamknięte']

function daysCount(start: string, end: string) {
  const n = diffDays(start, end) + 1
  return n === 1 ? '1 dzień' : `${n} dni`
}

export function ClosuresSheet({ open, onClose, defaultDate }: { open: boolean; onClose: () => void; defaultDate: string }) {
  return (
    <Sheet open={open} onClose={onClose} eyebrow="Przerwy w pracy" title="Dni wolne i urlopy">
      {open && <ClosuresContent defaultDate={defaultDate} />}
    </Sheet>
  )
}

function ClosuresContent({ defaultDate }: { defaultDate: string }) {
  const { closures, addClosure, deleteClosure } = useStore()
  const [title, setTitle] = useState('Urlop')
  const [start, setStart] = useState(defaultDate)
  const [end, setEnd] = useState(defaultDate)
  const [note, setNote] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const today = todayISO()
  const upcoming = closures.filter((c) => c.end >= today)
  const past = closures.filter((c) => c.end < today)

  return (
    <div className="flex flex-col gap-7">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return
          addClosure({ title: title.trim(), start, end: end < start ? start : end, note: note.trim() })
          setNote('')
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <FieldLabel htmlFor="closure-title">Nazwa</FieldLabel>
          <input
            id="closure-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTitle(p)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition',
                  title === p ? 'bg-foreground text-background ring-foreground' : 'text-muted-foreground ring-border hover:bg-muted',
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="closure-start">Od</FieldLabel>
            <input
              id="closure-start"
              type="date"
              required
              value={start}
              onChange={(e) => {
                setStart(e.target.value)
                if (end < e.target.value) setEnd(e.target.value)
              }}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="closure-end">Do</FieldLabel>
            <input
              id="closure-end"
              type="date"
              required
              min={start}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="closure-note">Notatka (opcjonalnie)</FieldLabel>
          <input id="closure-note" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </div>
        <button type="submit" className={cn(primaryButtonClass, 'h-10 self-end')}>
          <Plus className="size-4" aria-hidden /> Dodaj przerwę
        </button>
      </form>

      {[
        { label: 'Zaplanowane', list: upcoming },
        { label: 'Minione', list: past },
      ].map(
        (g) =>
          g.list.length > 0 && (
            <section key={g.label}>
              <h3 className="text-sm font-semibold">{g.label}</h3>
              <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
                {g.list.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground', CLOSURE_STRIPES)}>
                      <TreePalm className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.title}</p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {c.start === c.end ? formatShort(c.start) : `${formatShort(c.start)} – ${formatShort(c.end)}`} ·{' '}
                        {daysCount(c.start, c.end)}
                      </p>
                      {c.note && <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.note}</p>}
                    </div>
                    {confirmId === c.id ? (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="h-7 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                        >
                          Anuluj
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteClosure(c.id)
                            setConfirmId(null)
                          }}
                          className="h-7 rounded-md bg-destructive px-2 text-xs font-medium text-white hover:bg-destructive/90"
                        >
                          Usuń
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(c.id)}
                        aria-label={`Usuń: ${c.title}`}
                        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ),
      )}
    </div>
  )
}
