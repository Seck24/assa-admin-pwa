'use client'
import { useEffect, useState } from 'react'
import { listClients, type Client } from './api'

/**
 * Hook qui poll le nombre de captures en attente d'activation
 * Retourne le count de clients avec has_capture=true et statut≠actif
 */
export function usePendingCaptures(pollIntervalMs = 30000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true

    async function check() {
      try {
        const { clients } = await listClients(1, '')
        if (!active) return
        const pending = clients.filter((c: Client) => c.has_capture && c.account_status !== 'actif').length
        setCount(pending)
      } catch { /* ignore */ }
    }

    check()
    const id = setInterval(check, pollIntervalMs)
    return () => { active = false; clearInterval(id) }
  }, [pollIntervalMs])

  return count
}
