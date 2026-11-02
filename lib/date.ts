export const MONTHS = [
  'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
  'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień',
]

export const MONTHS_GENITIVE = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
]

export const WEEKDAYS = ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'ndz']
export const WEEKDAYS_SHORT = ['P', 'W', 'Ś', 'C', 'P', 'S', 'N']
export const WEEKDAYS_LONG = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela']

const pad = (n: number) => String(n).padStart(2, '0')

export function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO() {
  return toISO(new Date())
}

export function addDays(iso: string, days: number) {
  const d = fromISO(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export function diffDays(fromIso: string, toIso: string) {
  const a = fromISO(fromIso)
  const b = fromISO(toIso)
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utcB - utcA) / 86_400_000)
}

export function formatLong(iso: string) {
  const d = fromISO(iso)
  return `${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]} ${d.getFullYear()}`
}

export function formatShort(iso: string) {
  const d = fromISO(iso)
  return `${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()].slice(0, 3)}`
}

export function weekdayIndex(iso: string) {
  return (fromISO(iso).getDay() + 6) % 7
}

export function weekdayLong(iso: string) {
  return WEEKDAYS_LONG[weekdayIndex(iso)]
}

export interface DayCell {
  iso: string
  day: number
  inMonth: boolean
  weekday: number
}

export function monthMatrix(year: number, month: number, fixedRows = false): DayCell[] {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const rows = fixedRows ? 6 : Math.ceil((offset + daysInMonth) / 7)
  const cells: DayCell[] = []
  for (let i = 0; i < rows * 7; i++) {
    const d = new Date(year, month, 1 - offset + i)
    cells.push({ iso: toISO(d), day: d.getDate(), inMonth: d.getMonth() === month, weekday: i % 7 })
  }
  return cells
}

export type DueTone = 'overdue' | 'soon' | 'upcoming'

export function relativeDue(iso: string, today = todayISO()): { label: string; tone: DueTone } | null {
  const n = diffDays(today, iso)
  if (n < 0) return { label: 'po terminie', tone: 'overdue' }
  if (n === 0) return { label: 'dziś', tone: 'soon' }
  if (n === 1) return { label: 'jutro', tone: 'soon' }
  if (n === 2) return { label: 'pojutrze', tone: 'soon' }
  if (n < 7) return { label: `za ${n} dni`, tone: 'upcoming' }
  if (n === 7) return { label: 'za tydzień', tone: 'upcoming' }
  if (n <= 14) return { label: `za ${n} dni`, tone: 'upcoming' }
  return null
}

export function daysLabel(n: number) {
  if (n === 1) return '1 dzień'
  return `${n} dni`
}
