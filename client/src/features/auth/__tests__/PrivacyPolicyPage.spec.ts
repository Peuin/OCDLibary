import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n, setI18nLocale } from '@/i18n'
import { routes } from '@/router'
import PrivacyPolicyPage from '../PrivacyPolicyPage.vue'
import policy from '../privacy-policy.md?raw'

function mountPage() {
  return mount(PrivacyPolicyPage, {
    global: { stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } },
  })
}

afterEach(() => {
  i18n.global.locale.value = 'en'
})

describe('PrivacyPolicyPage', () => {
  it('renders the complete policy verbatim as semantic text, without translating the body', () => {
    const wrapper = mountPage()
    const text = wrapper
      .findAll('article h1, article h2, article p, article li')
      .map((block) => block.text())
      .join(' ')
    const normalized = (value: string) => value.replace(/\s+/g, ' ').trim()
    expect(normalized(text)).toBe(normalized(policy.replace(/^## |^- /gm, '')))
    expect(wrapper.get('article').attributes('lang')).toBe('en')
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.findAll('h2').map((heading) => heading.text())).toEqual(
      policy
        .split('\n')
        .filter((line) => line.startsWith('## '))
        .map((line) => line.slice(3)),
    )
  })

  it.each([
    ['en', 'Back to sign in'],
    ['vi', 'Quay lại đăng nhập'],
  ] as const)('localizes the return links for %s and keeps the supplied English policy', async (locale, label) => {
    await setI18nLocale(locale)
    const wrapper = mountPage()
    const links = wrapper.findAll('a[href="/login"]')
    expect(links).toHaveLength(2)
    expect(links.every((link) => link.text() === label)).toBe(true)
    expect(wrapper.get('h1').text()).toBe('Privacy Policy')
  })

  it('registers a public, standalone route with a localized title', () => {
    const route = routes.find((entry) => entry.name === 'privacy-policy')
    expect(route?.path).toBe('/privacy-policy')
    expect(route?.meta?.public).toBe(true)
    expect(route?.meta?.title).toBeTypeOf('function')
  })
})
