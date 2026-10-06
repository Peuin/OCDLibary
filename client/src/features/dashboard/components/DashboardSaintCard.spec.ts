import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import DashboardSaintCard from './DashboardSaintCard.vue'

describe('DashboardSaintCard', () => {
  it('splits the saint name from the title that follows a dash', () => {
    const wrapper = mount(DashboardSaintCard, { props: { saintName: 'Thánh Têrêsa Avila - Tiến sĩ Hội Thánh', imageUrl: null } })

    const lines = wrapper.findAll('p').map((line) => line.text())
    expect(lines).toEqual(['Thánh Têrêsa Avila', 'Tiến sĩ Hội Thánh'])
  })

  it('shows a name without a title as a single line', () => {
    const wrapper = mount(DashboardSaintCard, { props: { saintName: 'Edith Stein', imageUrl: null } })

    expect(wrapper.findAll('p').map((line) => line.text())).toEqual(['Edith Stein'])
  })

  it('fills the card with the portrait', () => {
    const wrapper = mount(DashboardSaintCard, { props: { saintName: 'Edith Stein', imageUrl: '/portrait.jpg' } })

    expect(wrapper.get('img').classes()).toEqual(expect.arrayContaining(['absolute', 'inset-0', 'object-cover']))
  })

  it('opens the shelf from its action button', async () => {
    const wrapper = mount(DashboardSaintCard, { props: { saintName: 'Edith Stein', imageUrl: null, showAction: true } })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('view-works')).toHaveLength(1)
  })
})
