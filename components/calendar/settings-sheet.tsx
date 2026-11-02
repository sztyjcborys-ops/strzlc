'use client'

import { useState } from 'react'
import { ArrowLeft, Check, Download, MoreVertical, Share, Smartphone } from 'lucide-react'
import { useStore, type Settings } from '@/lib/store'
import { promptInstall, useInstallStatus } from '@/lib/install-prompt'
import { cn } from '@/lib/utils'
import { Sheet, ghostButtonClass, primaryButtonClass } from './sheet'

export function SettingsSheet({ open, onClose, onBack }: { open: boolean; onClose: () => void; onBack: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} eyebrow="Preferencje kalendarza" title="Ustawienia">
      {open && <SettingsForm onDone={onClose} onBack={onBack} />}
    </Sheet>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        checked ? 'bg-primary' : 'bg-zinc-300',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-all',
          checked ? 'left-[18px]' : 'left-0.5',
        )}
      />
    </button>
  )
}

function NumberField({
  id,
  value,
  onChange,
  min,
  max,
}: {
  id: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
}) {
  return (
    <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-input bg-card shadow-xs focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15">
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value)
          onChange(Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : min)
        }}
        className="h-9 w-14 bg-transparent px-2 text-center font-mono text-sm tabular-nums outline-none"
      />
      <span className="flex h-9 items-center border-l border-border bg-muted/60 px-2.5 text-xs text-muted-foreground">dni</span>
    </div>
  )
}

function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between gap-4 px-4 py-3.5', className)}>{children}</div>
}

function RowText({ title, hint, htmlFor }: { title: string; hint?: string; htmlFor?: string }) {
  const Comp = htmlFor ? 'label' : 'span'
  return (
    <Comp htmlFor={htmlFor} className="flex min-w-0 flex-col">
      <span className="text-sm font-medium">{title}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </Comp>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      <div className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">{children}</div>
    </section>
  )
}

function InstallRow() {
  const status = useInstallStatus()
  const [busy, setBusy] = useState(false)

  if (status === 'installed') {
    return (
      <Row>
        <RowText title="Aplikacja zainstalowana" hint="Panel działa jako aplikacja na tym urządzeniu" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-paid-soft px-2.5 py-1 text-xs font-medium text-paid-fg">
          <Check className="size-3.5" aria-hidden /> Gotowe
        </span>
      </Row>
    )
  }

  if (status === 'available') {
    return (
      <Row>
        <RowText title="Zainstaluj aplikację" hint="Skrót na ekranie głównym, pełny ekran" />
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await promptInstall()
            setBusy(false)
          }}
          className={`${primaryButtonClass} h-9 shrink-0 disabled:opacity-60`}
        >
          <Download className="size-4" aria-hidden /> Zainstaluj
        </button>
      </Row>
    )
  }

  return (
    <div className="flex gap-3 px-4 py-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Smartphone className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-medium">Dodaj do ekranu początkowego</p>
        {status === 'ios' ? (
          <ol className="mt-1.5 flex list-decimal flex-col gap-1 pl-4 text-xs leading-relaxed text-muted-foreground">
            <li>
              Otwórz stronę w Safari i stuknij{' '}
              <Share className="inline size-3.5 align-[-2px] text-foreground" aria-label="Udostępnij" />{' '}
              <strong className="font-medium text-foreground">Udostępnij</strong>.
            </li>
            <li>
              Wybierz <strong className="font-medium text-foreground">Do ekranu początkowego</strong>.
            </li>
            <li>
              Potwierdź przyciskiem <strong className="font-medium text-foreground">Dodaj</strong>.
            </li>
          </ol>
        ) : (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Otwórz menu przeglądarki{' '}
            <MoreVertical className="inline size-3.5 align-[-2px] text-foreground" aria-hidden /> i wybierz{' '}
            <strong className="font-medium text-foreground">Zainstaluj aplikację</strong> lub{' '}
            <strong className="font-medium text-foreground">Dodaj do ekranu głównego</strong>.
          </p>
        )}
      </div>
    </div>
  )
}

function SettingsForm({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const { settings, saveSettings } = useStore()
  const [s, setS] = useState<Settings>(settings)
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((prev) => ({ ...prev, [k]: v }))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        saveSettings(s)
        onDone()
      }}
      className="flex flex-col gap-7"
    >
      <Section title="Powiadomienia" description="Wybierz, o czym chcesz być informowany.">
        <Row>
          <RowText title="Nowe wydarzenie" hint="Gdy ktoś doda imprezę" />
          <Toggle label="Nowe wydarzenie" checked={s.notifyNew} onChange={(v) => set('notifyNew', v)} />
        </Row>
        <Row>
          <RowText title="Zbliżająca się impreza" hint="Przypomnienie dzień wcześniej" />
          <Toggle label="Zbliżająca się impreza" checked={s.notifyUpcoming} onChange={(v) => set('notifyUpcoming', v)} />
        </Row>
        <Row>
          <RowText title="Termin płatności" hint="Gdy zbliża się termin zaliczki" />
          <Toggle label="Termin płatności" checked={s.notifyPayment} onChange={(v) => set('notifyPayment', v)} />
        </Row>
        <Row>
          <RowText htmlFor="remind" title="Przypomnij przed terminem" hint="0 = w dniu płatności" />
          <NumberField id="remind" min={0} max={30} value={s.remindDays} onChange={(v) => set('remindDays', v)} />
        </Row>
      </Section>

      <Section title="Automatyczne usuwanie" description="Zwalniaj terminy rezerwacji wstępnych bez zaliczki.">
        <Row>
          <RowText title="Usuwaj rezerwacje wstępne" hint="Bez zaliczki po terminie wpłaty" />
          <Toggle label="Automatyczne usuwanie" checked={s.autoDelete} onChange={(v) => set('autoDelete', v)} />
        </Row>
        <div className={cn('divide-y divide-border transition-opacity', !s.autoDelete && 'pointer-events-none opacity-40')}>
          <Row>
            <RowText htmlFor="deposit" title="Czas na wpłatę zaliczki" hint="Liczone od dnia dodania" />
            <NumberField id="deposit" min={0} max={365} value={s.depositDays} onChange={(v) => set('depositDays', v)} />
          </Row>
          <Row>
            <RowText htmlFor="grace" title="Okres tolerancji" hint="Maksymalnie 365 dni" />
            <NumberField id="grace" min={0} max={365} value={s.graceDays} onChange={(v) => set('graceDays', v)} />
          </Row>
        </div>
        <p className="bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          Przykład: rezerwacja dodana dziś dostanie termin zaliczki za{' '}
          <strong className="font-medium text-foreground">{s.depositDays} dni</strong>
          {s.graceDays > 0 && (
            <>
              {' '}+ <strong className="font-medium text-foreground">{s.graceDays} dni</strong> tolerancji
            </>
          )}
          . Ustaw tolerancję 0, aby zwolnić termin zaraz po upływie terminu płatności.
        </p>
      </Section>

      <Section title="Aplikacja" description="Zainstaluj panel na telefonie lub komputerze, aby uruchamiać go jak zwykłą aplikację.">
        <InstallRow />
      </Section>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-5">
        <button type="button" onClick={onBack} className={ghostButtonClass}>
          <ArrowLeft className="size-4" aria-hidden /> Profil
        </button>
        <button type="submit" className={`${primaryButtonClass} h-10`}>
          Zapisz ustawienia
        </button>
      </div>
    </form>
  )
}
