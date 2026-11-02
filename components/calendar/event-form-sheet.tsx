'use client'

import { useState } from 'react'
import { AlertTriangle, ArrowRight, Info } from 'lucide-react'
import { VENUE_META, useStore, type CalendarEvent, type EventInput } from '@/lib/store'
import { addDays, diffDays, formatLong, todayISO } from '@/lib/date'
import { formatPLN } from '@/lib/money'
import { FieldLabel, Sheet, inputClass, primaryButtonClass, secondaryButtonClass } from './sheet'
import { StatusCards } from './status'
import { VenuePicker } from './venue'

interface Props {
  open: boolean
  onClose: () => void
  defaultDate: string
  editing: CalendarEvent | null
}

export function EventFormSheet({ open, onClose, defaultDate, editing }: Props) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow={editing ? 'Edycja rezerwacji' : 'Nowa rezerwacja'}
      title={editing ? 'Edytuj imprezę' : 'Dodaj imprezę'}
    >
      {open && <EventForm key={editing?.id ?? defaultDate} defaultDate={defaultDate} editing={editing} onDone={onClose} />}
    </Sheet>
  )
}

function defaultPaymentDue(eventDate: string, depositDays: number) {
  const fromToday = addDays(todayISO(), depositDays)
  return diffDays(fromToday, eventDate) < 0 ? eventDate : fromToday
}

function FormSection({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-3 flex items-center gap-2.5 text-sm font-semibold">
        <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background tabular-nums">
          {step}
        </span>
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

const parseAmount = (v: string) => (v === '' ? null : Math.max(0, Number(v)))

function EventForm({
  defaultDate,
  editing,
  onDone,
}: {
  defaultDate: string
  editing: CalendarEvent | null
  onDone: () => void
}) {
  const { addEvent, updateEvent, settings, events } = useStore()
  const [form, setForm] = useState<EventInput>(() =>
    editing
      ? { ...editing }
      : {
          venue: 'sala',
          price: null,
          deposit: null,
          title: '',
          client: '',
          phone: '',
          guests: null,
          time: '16:00',
          date: defaultDate,
          paymentDue: defaultPaymentDue(defaultDate, settings.depositDays),
          status: 'wstepna',
          note: '',
        },
  )
  const [dueTouched, setDueTouched] = useState(Boolean(editing))

  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) => setForm((f) => ({ ...f, [key]: value }))

  const conflicts = events.filter((e) => e.date === form.date && e.venue === form.venue && e.id !== editing?.id)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { ...form, title: form.title.trim(), client: form.client.trim() }
    if (editing) updateEvent(editing.id, payload)
    else addEvent(payload)
    onDone()
  }

  const deleteOn = addDays(form.paymentDue, settings.graceDays + 1)
  const remaining =
    form.price != null
      ? Math.max(0, form.price - (form.status === 'oplacone' ? form.price : form.status === 'zaliczka' ? (form.deposit ?? 0) : 0))
      : null

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <FormSection step={1} title="Miejsce i termin">
        <VenuePicker value={form.venue} onChange={(v) => set('venue', v)} />

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <FieldLabel htmlFor="ev-date">Data imprezy</FieldLabel>
            <input
              id="ev-date"
              type="date"
              required
              value={form.date}
              onChange={(e) => {
                const date = e.target.value
                setForm((f) => ({
                  ...f,
                  date,
                  paymentDue: dueTouched ? f.paymentDue : defaultPaymentDue(date, settings.depositDays),
                }))
              }}
              className={inputClass}
            />
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-3 sm:col-span-1">
            <div>
              <FieldLabel htmlFor="ev-time">Godzina</FieldLabel>
              <input id="ev-time" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel htmlFor="ev-guests">Goście</FieldLabel>
              <input
                id="ev-guests"
                type="number"
                min={1}
                inputMode="numeric"
                value={form.guests ?? ''}
                onChange={(e) => set('guests', e.target.value ? Number(e.target.value) : null)}
                placeholder="0"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {conflicts.length > 0 && (
          <p className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm leading-relaxed text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {VENUE_META[form.venue].short} jest już zajęta w tym dniu:{' '}
              <strong className="font-semibold">{conflicts.map((c) => `${c.title} (${c.time})`).join(', ')}</strong>
            </span>
          </p>
        )}
      </FormSection>

      <FormSection step={2} title="Szczegóły imprezy">
        <div>
          <FieldLabel htmlFor="ev-title">Nazwa imprezy</FieldLabel>
          <input
            id="ev-title"
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="np. Wesele, Komunia, Urodziny"
            className={inputClass}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="ev-client">Klient</FieldLabel>
            <input
              id="ev-client"
              required
              value={form.client}
              onChange={(e) => set('client', e.target.value)}
              placeholder="Imię i nazwisko"
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="ev-phone">
              Telefon <span className="font-normal text-muted-foreground">· opcjonalnie</span>
            </FieldLabel>
            <input
              id="ev-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="600 000 000"
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="ev-note">
            Notatka <span className="font-normal text-muted-foreground">· opcjonalnie</span>
          </FieldLabel>
          <textarea
            id="ev-note"
            rows={3}
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            placeholder="Menu, dekoracje, dodatkowe ustalenia…"
            className={`${inputClass} resize-none`}
          />
        </div>
      </FormSection>

      <FormSection step={3} title="Płatność">
        <StatusCards value={form.status} onChange={(s) => set('status', s)} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="ev-price">Wartość imprezy</FieldLabel>
            <div className="relative">
              <input
                id="ev-price"
                type="number"
                min={0}
                step={50}
                inputMode="numeric"
                value={form.price ?? ''}
                onChange={(e) => set('price', parseAmount(e.target.value))}
                placeholder="0"
                className={`${inputClass} pr-9 tabular-nums`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                zł
              </span>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="ev-deposit">Kwota zaliczki</FieldLabel>
            <div className="relative">
              <input
                id="ev-deposit"
                type="number"
                min={0}
                step={50}
                inputMode="numeric"
                value={form.deposit ?? ''}
                onChange={(e) => set('deposit', parseAmount(e.target.value))}
                placeholder="0"
                className={`${inputClass} pr-9 tabular-nums`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                zł
              </span>
            </div>
          </div>
        </div>

        {form.status !== 'oplacone' && (
          <div>
            <FieldLabel htmlFor="ev-due">{form.status === 'wstepna' ? 'Termin wpłaty zaliczki' : 'Termin dopłaty'}</FieldLabel>
            <input
              id="ev-due"
              type="date"
              required
              value={form.paymentDue}
              onChange={(e) => {
                setDueTouched(true)
                set('paymentDue', e.target.value)
              }}
              className={inputClass}
            />
          </div>
        )}

        {remaining !== null && (
          <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">Pozostało do zapłaty</span>
            <span className="font-semibold tabular-nums">{formatPLN(remaining)}</span>
          </div>
        )}

        {form.status === 'wstepna' && (
          <p className="flex items-start gap-2.5 rounded-lg border border-pending/30 bg-pending-soft px-3 py-2.5 text-sm leading-relaxed text-pending-fg">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            {settings.autoDelete ? (
              <span>
                Jeśli zaliczka nie wpłynie do <strong>{formatLong(form.paymentDue)}</strong>, termin zostanie automatycznie
                zwolniony <strong>{formatLong(deleteOn)}</strong>.
              </span>
            ) : (
              <span>Automatyczne usuwanie rezerwacji wstępnych jest wyłączone w ustawieniach.</span>
            )}
          </p>
        )}
      </FormSection>

      <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-col-reverse gap-2 border-t border-border bg-card/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end md:-mx-6 md:px-6">
        <button type="button" onClick={onDone} className={`${secondaryButtonClass} h-10`}>
          Anuluj
        </button>
        <button type="submit" className={`${primaryButtonClass} h-10`}>
          {editing ? 'Zapisz zmiany' : 'Zapisz imprezę'}
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </form>
  )
}
