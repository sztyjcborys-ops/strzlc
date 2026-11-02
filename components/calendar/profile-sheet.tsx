'use client'

import { useState } from 'react'
import { ChevronRight, LogOut, Plus, Settings, ShieldCheck } from 'lucide-react'
import { useStore, type Role } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Sheet, inputClass, primaryButtonClass, secondaryButtonClass } from './sheet'

const ROLE_LABEL: Record<Role, string> = { admin: 'Administrator', pracownik: 'Pracownik' }

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-accent font-semibold uppercase text-accent-foreground ring-1 ring-primary/10',
        className,
      )}
    >
      {name.charAt(0)}
    </span>
  )
}

export function ProfileSheet({
  open,
  onClose,
  onOpenSettings,
}: {
  open: boolean
  onClose: () => void
  onOpenSettings: () => void
}) {
  const { user, logout, members, removeMember, setMemberRole, addMember } = useStore()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const isAdmin = user?.role === 'admin'

  if (!user) return null
  const team = members.filter((m) => m.id !== user.id)

  return (
    <Sheet open={open} onClose={onClose} eyebrow="Konto pracownika" title="Profil i zespół">
      <div className="flex flex-col gap-7">
        <div className="flex items-center gap-3 rounded-lg border border-border p-4">
          <Avatar name={user.name} className="size-12 text-lg" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{user.name}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden />
              {ROLE_LABEL[user.role]} · dostęp globalny
            </p>
          </div>
        </div>

        <section>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Członkowie zespołu</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">Wspólny kalendarz jest dostępny dla wszystkich.</p>
            </div>
            <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{team.length}</span>
          </div>
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
            {team.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Avatar name={m.name} className="size-8 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABEL[m.role]}</p>
                </div>
                {isAdmin && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setMemberRole(m.id, m.role === 'admin' ? 'pracownik' : 'admin')}
                      className={cn(secondaryButtonClass, 'h-7 px-2 text-xs')}
                    >
                      {m.role === 'admin' ? 'Ustaw pracownika' : 'Nadaj admina'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMember(m.id)}
                      className="h-7 rounded-md px-2 text-xs font-medium text-destructive transition hover:bg-destructive/10"
                    >
                      Usuń
                    </button>
                  </div>
                )}
              </li>
            ))}
            {isAdmin && (
              <li>
                <button
                  type="button"
                  onClick={() => setAdding((a) => !a)}
                  aria-expanded={adding}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <span className="flex size-8 items-center justify-center rounded-full border border-dashed border-border">
                    <Plus className="size-4" aria-hidden />
                  </span>
                  <span className="flex-1">Dodaj konto pracownika</span>
                  <ChevronRight className={cn('size-4 transition-transform', adding && 'rotate-90')} aria-hidden />
                </button>
                {adding && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      setSaving(true)
                      const ok = await addMember(name, email, password)
                      setSaving(false)
                      if (!ok) return
                      setName('')
                      setEmail('')
                      setPassword('')
                      setAdding(false)
                    }}
                    className="flex flex-col gap-2 px-4 pb-4"
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input aria-label="Imię" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Imię" className={inputClass} />
                      <input aria-label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className={inputClass} />
                      <input
                        aria-label="Hasło startowe"
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Hasło (min. 8 znaków)"
                        className={cn(inputClass, 'sm:col-span-2')}
                      />
                    </div>
                    <button type="submit" disabled={saving} className={cn(primaryButtonClass, 'h-9 self-end disabled:opacity-60')}>
                      {saving ? 'Tworzenie…' : 'Utwórz konto'}
                    </button>
                  </form>
                )}
              </li>
            )}
          </ul>
        </section>

        <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/50"
          >
            <Settings className="size-4 text-muted-foreground" aria-hidden />
            <span className="flex-1">Ustawienia</span>
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
          >
            <LogOut className="size-4" aria-hidden />
            Wyloguj się
          </button>
        </div>
      </div>
    </Sheet>
  )
}
