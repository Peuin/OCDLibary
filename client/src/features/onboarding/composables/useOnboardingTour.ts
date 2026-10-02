import { driver } from 'driver.js'
import type { DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import { i18n } from '@/i18n'
import { useAuth } from '@/features/auth/composables/useAuth'
import { api } from '@/lib/api'

export function useOnboardingTour() {
  const { user, me } = useAuth()

  function isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 768
  }

  function isTourCompleted(): boolean {
    return user.value?.settings?.onboarding?.tourCompleted === true
  }

  const { t } = i18n.global

  function buildSteps(): DriveStep[] {
    const candidates: DriveStep[] = [
      // Left sidebar - top to bottom
      {
        element: '[data-tour="sidebar-libraries"]',
        popover: {
          title: t('onboarding.tour.librariesTitle'),
          description: t('onboarding.tour.librariesBody'),
          side: 'right',
          align: 'start',
          showButtons: ['next', 'close'],
        },
      },
      {
        element: '[data-tour="sidebar-smartScopes"]',
        popover: {
          title: t('onboarding.tour.smartScopesTitle'),
          description: t('onboarding.tour.smartScopesBody'),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="sidebar-collections"]',
        popover: {
          title: t('onboarding.tour.collectionsTitle'),
          description: t('onboarding.tour.collectionsBody'),
          side: 'right',
          align: 'start',
        },
      },
      // Header - left to right
      {
        element: '[data-tour="global-search"]',
        popover: {
          title: t('onboarding.tour.searchTitle'),
          description: t('onboarding.tour.searchBody'),
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="book-dock-btn"]',
        popover: {
          title: t('onboarding.tour.bookDockTitle'),
          description: t('onboarding.tour.bookDockBody'),
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="statistics-btn"]',
        popover: {
          title: t('onboarding.tour.statisticsTitle'),
          description: t('onboarding.tour.statisticsBody'),
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="upload-button"]',
        popover: {
          title: t('onboarding.tour.uploadTitle'),
          description: t('onboarding.tour.uploadBody'),
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="appearance-picker"]',
        popover: {
          title: t('onboarding.tour.appearanceTitle'),
          description: t('onboarding.tour.appearanceBody'),
          side: 'bottom',
          align: 'end',
        },
      },
    ]

    return candidates.filter((step) => document.querySelector(step.element as string) !== null)
  }

  function markCompletedLocally(): void {
    if (!user.value) return
    user.value = {
      ...user.value,
      settings: {
        ...user.value.settings,
        onboarding: { tourCompleted: true },
      },
    }
  }

  function persistCompletion(): void {
    api('/api/v1/users/me/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { onboarding: { tourCompleted: true } } }),
    }).catch(() => {})
  }

  function startTour(): void {
    const steps = buildSteps()
    if (steps.length === 0) return

    const driverObj = driver({
      showProgress: true,
      progressText: t('onboarding.tour.progress', { current: '{{current}}', total: '{{total}}' }),
      nextBtnText: t('onboarding.tour.next'),
      prevBtnText: t('onboarding.tour.back'),
      doneBtnText: t('onboarding.tour.done'),
      disableActiveInteraction: true,
      onDestroyed: () => {
        markCompletedLocally()
        persistCompletion()
      },
      steps,
    })

    driverObj.drive()
  }

  function maybeStartTour(): void {
    if (isMobileViewport()) return
    if (isTourCompleted()) return
    startTour()
  }

  async function resetTour(): Promise<void> {
    await api('/api/v1/users/me/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { onboarding: { tourCompleted: false } } }),
    })
    await me()
    startTour()
  }

  return { maybeStartTour, startTour, resetTour }
}
