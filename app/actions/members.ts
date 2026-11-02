'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Result = { ok: true } | { ok: false; error: string }

const ADMIN_ROLES = ['admin', 'administratorka']

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data && ADMIN_ROLES.includes(data.role) ? user : null
}

export async function addMemberAction(name: string, email: string, password: string): Promise<Result> {
  const admin = await requireAdmin()
  if (!admin) return { ok: false, error: 'Brak uprawnień administratora.' }

  const cleanName = name.trim()
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false, error: 'Podaj imię i poprawny e-mail.' }
  if (password.length < 8) return { ok: false, error: 'Hasło musi mieć co najmniej 8 znaków.' }

  const { error } = await createAdminClient().auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: { display_name: cleanName },
  })
  if (error) {
    console.error('addMember failed:', error.message)
    return { ok: false, error: error.status === 422 ? 'Konto z tym e-mailem już istnieje.' : 'Nie udało się utworzyć konta.' }
  }
  return { ok: true }
}

export async function removeMemberAction(id: string): Promise<Result> {
  const admin = await requireAdmin()
  if (!admin) return { ok: false, error: 'Brak uprawnień administratora.' }
  if (admin.id === id) return { ok: false, error: 'Nie możesz usunąć własnego konta.' }

  const { error } = await createAdminClient().auth.admin.deleteUser(id)
  if (error) {
    console.error('removeMember failed:', error.message)
    return { ok: false, error: 'Nie udało się usunąć konta.' }
  }
  return { ok: true }
}

export async function setMemberRoleAction(id: string, role: 'admin' | 'pracownik'): Promise<Result> {
  const admin = await requireAdmin()
  if (!admin) return { ok: false, error: 'Brak uprawnień administratora.' }
  if (admin.id === id) return { ok: false, error: 'Nie możesz zmienić własnej roli.' }

  // 'administratorka' is the admin role the DB sync trigger preserves across auth updates.
  const { error } = await createAdminClient()
    .from('profiles')
    .update({ role: role === 'admin' ? 'administratorka' : 'employee' })
    .eq('id', id)
  if (error) {
    console.error('setMemberRole failed:', error.message)
    return { ok: false, error: 'Nie udało się zmienić roli.' }
  }
  return { ok: true }
}
