const N8N = 'https://automation.preo-ia.info/webhook/admin'

async function apiFetch<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${N8N}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StatsOverview {
  total_commerciaux: number
  total_clients: number
  total_activations: number
  activations_today: number
  ca_total: number
  commissions_total: number
}

export interface Commercial {
  uid: string
  code_commercial: string
  nom: string
  telephone: string
  actif: boolean
  date_creation: string
  activations_count?: number
  commission_totale?: number
}

export interface Client {
  uid: string
  telephone: string
  nom: string
  prenom: string
  email?: string
  account_status: string
  date_inscription: string
  date_activation?: string
  activated_by?: string
}

export interface Activation {
  uid: string
  telephone_client: string
  nom_client?: string
  code_commercial: string
  nom_commercial?: string
  montant_installation: number
  statut: string
  date_activation: string
}

export interface Commission {
  commercial_uid: string
  code_commercial: string
  nom_commercial: string
  activations_count: number
  montant_par_activation: number
  commission_totale: number
  periode: string
}

// ── API calls ─────────────────────────────────────────────────────────────────

export function getStatsOverview() {
  return apiFetch<StatsOverview>('/stats-overview', {})
}

export function listCommerciaux() {
  return apiFetch<Commercial[]>('/commerciaux-list', {})
}

export function createCommercial(data: { nom: string; telephone: string; code_commercial: string; code_secret: string }) {
  return apiFetch<{ success: boolean; message: string; uid?: string }>('/commercial-create', data)
}

export function toggleCommercial(uid: string, actif: boolean) {
  return apiFetch<{ success: boolean }>('/commercial-toggle', { uid, actif })
}

export function resetCommercialSecret(uid: string, new_secret: string) {
  return apiFetch<{ success: boolean }>('/commercial-reset-secret', { uid, new_secret })
}

export function listClients(page = 1, search = '') {
  return apiFetch<{ clients: Client[]; total: number }>('/users-list', { page, search })
}

export function activateClient(uid: string) {
  return apiFetch<{ success: boolean }>('/user-activate', { uid })
}

export function suspendClient(uid: string) {
  return apiFetch<{ success: boolean }>('/user-suspend', { uid })
}

export function listActivations(page = 1, commercial_uid = '') {
  return apiFetch<{ activations: Activation[]; total: number }>('/activations-list', { page, commercial_uid })
}

export function listCommissions(periode = '') {
  return apiFetch<Commission[]>('/commissions-list', { periode })
}

// ── Admin Users ───────────────────────────────────────────────────────────────

export interface AdminUser {
  uid: string
  nom: string
  username: string
  role: 'super_admin' | 'admin'
  actif: boolean
  must_change_password: boolean
  created_by?: string
  date_creation?: string
  last_login?: string
}

export function listAdmins() {
  return apiFetch<AdminUser[]>('/admins-list', {})
}

export function createAdmin(data: { nom: string; username: string; role: string; created_by: string }) {
  return apiFetch<{ success: boolean; message?: string; uid?: string; username?: string; temp_password?: string }>('/admin-create', data)
}

export function toggleAdmin(uid: string, actif: boolean) {
  return apiFetch<{ success: boolean }>('/admin-toggle', { uid, actif })
}

export function resetAdminPassword(uid: string) {
  return apiFetch<{ success: boolean; temp_password?: string }>('/admin-reset-password', { uid })
}
