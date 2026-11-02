'use client'

import { useSyncExternalStore } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallStatus = 'installed' | 'available' | 'ios' | 'manual'

let deferredPrompt: BeforeInstallPromptEvent | null = null
let justInstalled = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    justInstalled = true
    deferredPrompt = null
    emit()
  })
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function getSnapshot(): InstallStatus {
  if (justInstalled || isStandalone()) return 'installed'
  if (deferredPrompt) return 'available'
  if (isIOS()) return 'ios'
  return 'manual'
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useInstallStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, () => 'manual' as InstallStatus)
}

export async function promptInstall() {
  if (!deferredPrompt) return false
  const event = deferredPrompt
  await event.prompt()
  const { outcome } = await event.userChoice
  deferredPrompt = null
  emit()
  return outcome === 'accepted'
}
