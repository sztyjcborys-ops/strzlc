'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { addDays, diffDays, todayISO } from '@/lib/date'
import { createClient } from '@/lib/supabase/client'
import { addMemberAction, removeMemberAction, setMemberRoleAction } from '@/app/actions/members'

export type EventStatus = 'wstepna' | 'zaliczka' | 'oplacone'

export const STATUS_META: Record<EventStatus, { label: string; short: string; description: string }> = {
  wstepna: {
    label: 'Rezerwacja wstępna',
    short: 'Wstępna',
    description: 'Czeka na wpłatę zaliczki. Bez wpłaty zostanie automatycznie usunięta.',
  },
  zaliczka: {
    label: 'Zaliczka wpłacona',
    short: 'Zaliczka',
    description: 'Termin potwierdzony zaliczką. Pozostała kwota do rozliczenia.',
  },
  oplacone: {
    label: 'Opłacone w całości',
    short: 'Opłacone',
    description: 'Impreza w pełni opłacona.',
  },
}

export type Venue = 'sala' | 'bar'

export const VENUE_META: Record<Venue, { label: string; short: string; description: string }> = {
  sala: { label: 'Sala bankietowa', short: 'Sala', description: 'Wesela, komunie, duże przyjęcia' },
  bar: { label: 'Bar', short: 'Bar', description: 'Kameralne spotkania, urodziny' },
}

export interface CalendarEvent {
  id: string
  venue: Venue
  price: number | null
  deposit: number | null
  title: string
  client: string
  phone: string
  guests: number | null
  time: string
  date: string
  paymentDue: string
  status: EventStatus
  note: string
  createdAt: string
}

export type EventInput = Omit<CalendarEvent, 'id' | 'createdAt'>

export interface Closure {
  id: string
  title: string
  start: string
  end: string
  note: string
}

export type ClosureInput = Omit<Closure, 'id'>

export interface Settings {
  notifyNew: boolean
  notifyUpcoming: boolean
  notifyPayment: boolean
  remindDays: number
  autoDelete: boolean
  depositDays: number
  graceDays: number
}

export type Role = 'admin' | 'pracownik'

export interface Member {
  id: string
  name: string
  login: string
  role: Role
}

export interface SessionUser {
  id: string
  name: string
  role: Role
}

interface StoreValue {
  user: SessionUser | null
  userLoading: boolean
  error: string | null
  clearError: () => void
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  events: CalendarEvent[]
  addEvent: (input: EventInput) => void
  updateEvent: (id: string, patch: Partial<EventInput>) => void
  deleteEvent: (id: string) => void
  closures: Closure[]
  addClosure: (input: ClosureInput) => void
  deleteClosure: (id: string) => void
  settings: Settings
  saveSettings: (s: Settings) => void
  members: Member[]
  addMember: (name: string, email: string, password: string) => Promise<boolean>
  removeMember: (id: string) => Promise<boolean>
  setMemberRole: (id: string, role: Role) => Promise<boolean>
  autoRemoved: CalendarEvent[]
  dismissAutoRemoved: () => void
  deletionDate: (e: CalendarEvent) => string | null
}

const StoreContext = createContext<StoreValue | null>(null)

const DEFAULT_SETTINGS: Settings = {
  notifyNew: true,
  notifyUpcoming: true,
  notifyPayment: true,
  remindDays: 1,
  autoDelete: true,
  depositDays: 5,
  graceDays: 0,
}

const EVENT_COLUMNS =
  'id, title, event_date, payment_due, guest_name, notes, status, paid_in_full, venue, price, deposit, phone, guests, event_time, created_at'

interface EventRow {
  id: string
  title: string
  event_date: string
  payment_due: string
  guest_name: string
  notes: string
  status: 'pending' | 'approved'
  paid_in_full: boolean
  venue: Venue
  price: number | string | null
  deposit: number | string | null
  phone: string
  guests: number | null
  event_time: string
  created_at: string
}

const num = (v: number | string | null) => (v == null ? null : Number(v))

function fromRow(r: EventRow): CalendarEvent {
  return {
    id: r.id,
    venue: r.venue,
    price: num(r.price),
    deposit: num(r.deposit),
    title: r.title,
    client: r.guest_name,
    phone: r.phone,
    guests: r.guests,
    time: r.event_time,
    date: r.event_date,
    paymentDue: r.payment_due,
    status: r.status === 'pending' ? 'wstepna' : r.paid_in_full ? 'oplacone' : 'zaliczka',
    note: r.notes,
    createdAt: r.created_at.slice(0, 10),
  }
}

function toRow(p: Partial<EventInput>, current?: CalendarEvent) {
  const row: Record<string, unknown> = {}
  if (p.venue !== undefined) row.venue = p.venue
  if (p.price !== undefined) row.price = p.price
  if (p.deposit !== undefined) row.deposit = p.deposit
  if (p.title !== undefined) row.title = p.title
  if (p.client !== undefined) row.guest_name = p.client
  if (p.phone !== undefined) row.phone = p.phone
  if (p.guests !== undefined) row.guests = p.guests
  if (p.time !== undefined) row.event_time = p.time
  if (p.date !== undefined) row.event_date = p.date
  if (p.note !== undefined) row.notes = p.note
  if (p.status !== undefined) {
    row.status = p.status === 'wstepna' ? 'pending' : 'approved'
    row.paid_in_full = p.status === 'oplacone'
  }
  // DB requires payment_due <= event_date.
  const date = p.date ?? current?.date
  const due = p.paymentDue ?? (p.date !== undefined ? current?.paymentDue : undefined)
  if (due !== undefined && date !== undefined) row.payment_due = due > date ? date : due
  return row
}

const ADMIN_ROLES = ['admin', 'administratorka']

async function fetchEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await createClient().from('events').select(EVENT_COLUMNS).order('event_date')
  if (error) throw error
  return (data as EventRow[]).map(fromRow)
}

async function fetchClosures(): Promise<Closure[]> {
  const { data, error } = await createClient()
    .from('closures')
    .select('id, title, start_date, end_date, note')
    .order('start_date')
  if (error) throw error
  return data.map((r) => ({ id: r.id, title: r.title, start: r.start_date, end: r.end_date, note: r.note }))
}

async function fetchSettings(): Promise<Settings> {
  const { data, error } = await createClient()
    .from('app_settings')
    .select('grace_days, notify_new, notify_upcoming, notify_payment, remind_days, auto_delete, deposit_days')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw error
  if (!data) return DEFAULT_SETTINGS
  return {
    notifyNew: data.notify_new,
    notifyUpcoming: data.notify_upcoming,
    notifyPayment: data.notify_payment,
    remindDays: data.remind_days,
    autoDelete: data.auto_delete,
    depositDays: data.deposit_days,
    graceDays: data.grace_days,
  }
}

// Service admin account (wscieklydywan@gmail.com), kept out of the team list.
const HIDDEN_MEMBER_IDS = ['1ac597e4-7b05-44b1-8176-ecdd4ac1c63a']

async function fetchMembers(): Promise<Member[]> {
  const { data, error } = await createClient().from('profiles').select('id, display_name, role').order('created_at')
  if (error) throw error
  return data.filter((p) => !HIDDEN_MEMBER_IDS.includes(p.id)).map((p) => ({
    id: p.id,
    name: p.display_name,
    login: '',
    role: ADMIN_ROLES.includes(p.role) ? 'admin' : 'pracownik',
  }))
}

async function fetchSessionUser(): Promise<SessionUser | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('display_name, role').eq('id', user.id).maybeSingle()
  return {
    id: user.id,
    name: data?.display_name ?? user.email?.split('@')[0] ?? 'Użytkownik',
    role: data && ADMIN_ROLES.includes(data.role) ? 'admin' : 'pracownik',
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { data: user = null, isLoading: userLoading, mutate: mutateUser } = useSWR('session-user', fetchSessionUser)
  const { data: events = [], mutate: mutateEvents } = useSWR(user ? 'events' : null, fetchEvents, {
    refreshInterval: 30_000,
  })
  const { data: closures = [], mutate: mutateClosures } = useSWR(user ? 'closures' : null, fetchClosures)
  const { data: settings = DEFAULT_SETTINGS, mutate: mutateSettings } = useSWR(user ? 'settings' : null, fetchSettings)
  const { data: members = [], mutate: mutateMembers } = useSWR(user ? 'members' : null, fetchMembers)
  const [autoRemoved, setAutoRemoved] = useState<CalendarEvent[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const { data } = createClient().auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') mutateUser()
    })
    return () => data.subscription.unsubscribe()
  }, [mutateUser])

  const fail = useCallback((message: string, err: unknown) => {
    console.error(message, err)
    setError(message)
  }, [])

  const deletionDate = useCallback(
    (e: CalendarEvent) => {
      if (!settings.autoDelete || e.status !== 'wstepna') return null
      return addDays(e.paymentDue, settings.graceDays + 1)
    },
    [settings.autoDelete, settings.graceDays],
  )

  const [today, setToday] = useState(todayISO)

  useEffect(() => {
    const id = setInterval(() => setToday(todayISO()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const expired = events.filter((e) => {
      const d = deletionDate(e)
      return d !== null && diffDays(d, today) >= 0
    })
    if (expired.length === 0) return
    const ids = expired.map((e) => e.id)
    const idSet = new Set(ids)
    setAutoRemoved((r) => [...r.filter((e) => !idSet.has(e.id)), ...expired])
    mutateEvents(
      async (prev = []) => {
        const { error } = await createClient().from('events').delete().in('id', ids).eq('status', 'pending')
        if (error) throw error
        return prev.filter((e) => !idSet.has(e.id))
      },
      { optimisticData: (prev = []) => prev.filter((e) => !idSet.has(e.id)), rollbackOnError: true, revalidate: false },
    ).catch((err) => fail('Nie udało się usunąć wygasłych rezerwacji.', err))
  }, [events, deletionDate, today, mutateEvents, fail])

  const runMember = useCallback(
    async (action: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
      const res = await action()
      if (!res.ok) setError(res.error)
      await mutateMembers()
      return res.ok
    },
    [mutateMembers],
  )

  const value = useMemo<StoreValue>(
    () => ({
      user,
      userLoading,
      error,
      clearError: () => setError(null),
      login: async (email, password) => {
        const { error } = await createClient().auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
        if (error) {
          if (error.code === 'email_not_confirmed') return 'Adres e-mail nie został jeszcze potwierdzony.'
          if (error.status === 429) return 'Zbyt wiele prób. Spróbuj ponownie za chwilę.'
          if (error.code === 'invalid_credentials') return 'Nieprawidłowy e-mail lub hasło.'
          console.error('signIn failed:', error.message)
          return 'Nie udało się zalogować. Spróbuj ponownie.'
        }
        await mutateUser()
        return null
      },
      logout: async () => {
        await createClient().auth.signOut()
        await mutateUser(null, { revalidate: false })
        setAutoRemoved([])
      },
      events,
      addEvent: (input) => {
        const id = crypto.randomUUID()
        const optimistic: CalendarEvent = { ...input, id, createdAt: todayISO() }
        mutateEvents(
          async (prev = []) => {
            const { error } = await createClient()
              .from('events')
              .insert({ id, created_by: user?.id ?? null, ...toRow(input) })
            if (error) throw error
            return [...prev, optimistic]
          },
          { optimisticData: (prev = []) => [...prev, optimistic], rollbackOnError: true },
        ).catch((err) => fail('Nie udało się zapisać imprezy.', err))
      },
      updateEvent: (id, patch) => {
        const current = events.find((e) => e.id === id)
        const apply = (prev: CalendarEvent[] = []) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
        mutateEvents(
          async (prev) => {
            const { error } = await createClient().from('events').update(toRow(patch, current)).eq('id', id)
            if (error) throw error
            return apply(prev)
          },
          { optimisticData: apply, rollbackOnError: true },
        ).catch((err) => fail('Nie udało się zaktualizować imprezy.', err))
      },
      deleteEvent: (id) => {
        const apply = (prev: CalendarEvent[] = []) => prev.filter((e) => e.id !== id)
        mutateEvents(
          async (prev) => {
            const { error } = await createClient().from('events').delete().eq('id', id)
            if (error) throw error
            return apply(prev)
          },
          { optimisticData: apply, rollbackOnError: true },
        ).catch((err) => fail('Nie udało się usunąć imprezy.', err))
      },
      closures,
      addClosure: (input) => {
        const id = crypto.randomUUID()
        const closure: Closure = { ...input, id }
        const apply = (prev: Closure[] = []) => [...prev, closure].sort((a, b) => a.start.localeCompare(b.start))
        mutateClosures(
          async (prev) => {
            const { error } = await createClient().from('closures').insert({
              id,
              title: input.title,
              start_date: input.start,
              end_date: input.end,
              note: input.note,
              created_by: user?.id ?? null,
            })
            if (error) throw error
            return apply(prev)
          },
          { optimisticData: apply, rollbackOnError: true },
        ).catch((err) => fail('Nie udało się zapisać dni wolnych.', err))
      },
      deleteClosure: (id) => {
        const apply = (prev: Closure[] = []) => prev.filter((c) => c.id !== id)
        mutateClosures(
          async (prev) => {
            const { error } = await createClient().from('closures').delete().eq('id', id)
            if (error) throw error
            return apply(prev)
          },
          { optimisticData: apply, rollbackOnError: true },
        ).catch((err) => fail('Nie udało się usunąć dni wolnych.', err))
      },
      settings,
      saveSettings: (s) => {
        mutateSettings(
          async () => {
            const { error } = await createClient()
              .from('app_settings')
              .upsert({
                id: 1,
                grace_days: s.graceDays,
                notify_new: s.notifyNew,
                notify_upcoming: s.notifyUpcoming,
                notify_payment: s.notifyPayment,
                remind_days: s.remindDays,
                auto_delete: s.autoDelete,
                deposit_days: s.depositDays,
                updated_at: new Date().toISOString(),
              })
            if (error) throw error
            return s
          },
          { optimisticData: s, rollbackOnError: true },
        ).catch((err) => fail('Nie udało się zapisać ustawień.', err))
      },
      members,
      addMember: (name, email, password) => runMember(() => addMemberAction(name, email, password)),
      removeMember: (id) => runMember(() => removeMemberAction(id)),
      setMemberRole: (id, role) => runMember(() => setMemberRoleAction(id, role)),
      autoRemoved,
      dismissAutoRemoved: () => setAutoRemoved([]),
      deletionDate,
    }),
    [user, userLoading, error, events, closures, settings, members, autoRemoved, deletionDate, mutateUser, mutateEvents, mutateClosures, mutateSettings, runMember, fail],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
