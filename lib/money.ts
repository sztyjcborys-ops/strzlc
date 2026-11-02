import type { CalendarEvent } from '@/lib/store'

const pln = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 })

export function formatPLN(value: number) {
  return pln.format(value)
}

export function paidAmount(e: CalendarEvent) {
  if (e.status === 'oplacone') return e.price ?? e.deposit ?? 0
  if (e.status === 'zaliczka') return e.deposit ?? 0
  return 0
}

export function remainingAmount(e: CalendarEvent) {
  if (e.price == null) return 0
  return Math.max(0, e.price - paidAmount(e))
}
