'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight, BellRing, CalendarDays, Eye, EyeOff, Lock, Wallet } from 'lucide-react'
import { useStore } from '@/lib/store'
import { FieldLabel, inputClass, primaryButtonClass } from './sheet'

const FEATURES = [
  { icon: CalendarDays, title: 'Wspólny kalendarz', text: 'Wszystkie imprezy całego zespołu w jednym widoku.' },
  { icon: Wallet, title: 'Kontrola zaliczek', text: 'Status płatności każdej rezerwacji na pierwszy rzut oka.' },
  { icon: BellRing, title: 'Automatyczne zwalnianie', text: 'Nieopłacone rezerwacje wstępne znikają same.' },
]

export function LoginScreen() {
  const { login } = useStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    const message = await login(username, password)
    setPending(false)
    if (message) setError(message)
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <section className="flex flex-col px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-12">
        <Image
          src="/logo.png"
          alt="Karczma Strzelec"
          width={160}
          height={58}
          className="h-auto w-28 shrink-0 sm:w-32"
          draggable={false}
          priority
        />

        <div className="flex flex-1 flex-col">
        <div className="mx-auto my-auto flex w-full max-w-sm flex-col py-8 sm:max-lg:max-w-md sm:max-lg:rounded-2xl sm:max-lg:border sm:max-lg:border-border sm:max-lg:bg-card sm:max-lg:px-10 sm:max-lg:py-10 sm:max-lg:shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Zaloguj się do panelu</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Wprowadź dane konta, aby otworzyć kalendarz imprez.</p>

          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
            <div>
              <FieldLabel htmlFor="login">E-mail</FieldLabel>
              <input
                id="login"
                type="email"
                autoComplete="email"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError('')
                }}
                placeholder="imie@karczmastrzelec.pl"
                className={inputClass}
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="password">Hasło</FieldLabel>
              <div className="relative">
                <input
                  id="password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="••••••••"
                  className={`${inputClass} pr-10`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Ukryj hasło' : 'Pokaż hasło'}
                  className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <button type="submit" disabled={pending} className={`${primaryButtonClass} mt-2 h-10 w-full disabled:opacity-60`}>
              {pending ? 'Logowanie…' : 'Zaloguj się'}
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <p>Konta pracowników zakłada administrator w panelu zespołu.</p>
          </div>
        </div>
        </div>

        <p className="pt-6 text-xs text-muted-foreground">© Karczma Strzelec · System wewnętrzny</p>
      </section>

      <section className="relative hidden overflow-hidden bg-brand-dark lg:flex lg:flex-col lg:justify-center lg:p-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        />
        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            <span className="size-1.5 rounded-full bg-paid" aria-hidden />
            Plan imprez
          </span>
          <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white text-balance">
            Rezerwacje, zaliczki i terminy w jednym miejscu.
          </h2>
          <ul className="mt-10 flex flex-col gap-6">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gold">
                  <f.icon className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{f.title}</p>
                  <p className="mt-0.5 text-sm text-white/60">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}
