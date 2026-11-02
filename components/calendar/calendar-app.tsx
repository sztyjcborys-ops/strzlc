'use client'

import { X } from 'lucide-react'
import { StoreProvider, useStore } from '@/lib/store'
import { LoginScreen } from './login-screen'
import { Dashboard } from './dashboard'

function ErrorToast() {
  const { error, clearError } = useStore()
  if (!error) return null
  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-lg border border-destructive/20 bg-card px-4 py-3 text-sm font-medium text-destructive shadow-lg"
    >
      <p className="flex-1">{error}</p>
      <button type="button" onClick={clearError} aria-label="Zamknij" className="rounded-md p-1 hover:bg-destructive/10">
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}

function Gate() {
  const { user, userLoading } = useStore()
  if (userLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center" aria-busy="true">
        <span className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <span className="sr-only">Ładowanie…</span>
      </main>
    )
  }
  return user ? <Dashboard /> : <LoginScreen />
}

export function CalendarApp() {
  return (
    <StoreProvider>
      <Gate />
      <ErrorToast />
    </StoreProvider>
  )
}
