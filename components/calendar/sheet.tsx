'use client'

import { useEffect, useId } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onClose: () => void
  eyebrow: string
  title: string
  children: React.ReactNode
  className?: string
}

export function Sheet({ open, onClose, eyebrow, title, children, className }: SheetProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end">
      <button
        type="button"
        aria-label="Zamknij"
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/30 backdrop-blur-[1px] animate-in fade-in duration-200"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border-border bg-card shadow-2xl',
          'animate-in slide-in-from-bottom-8 duration-300',
          'md:max-h-none md:h-dvh md:max-w-[480px] md:rounded-none md:border-l md:slide-in-from-bottom-0 md:slide-in-from-right-8',
          className,
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-border md:hidden" aria-hidden />
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 md:px-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>
            <h2 id={titleId} className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij okno"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:px-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
      {children}
    </label>
  )
}

export const inputClass =
  'w-full min-h-10 rounded-lg border border-input bg-card px-3 py-2 text-base text-foreground shadow-xs placeholder:text-muted-foreground/70 outline-none transition focus:border-primary focus:ring-[3px] focus:ring-primary/15 md:text-sm'

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.99]'

export const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-xs transition hover:bg-muted'

export const ghostButtonClass =
  'inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground'
