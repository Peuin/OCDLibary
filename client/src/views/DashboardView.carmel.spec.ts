// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const mainCss = readFileSync(fileURLToPath(new URL('../assets/main.css', import.meta.url)), 'utf8')

describe('dashboard Carmel artwork', () => {
  it('oversizes and top-pins the artwork only around the dashboard on wide viewports', () => {
    const block = /@media\s*\(min-aspect-ratio:\s*16\/9\)\s*\{\s*\.pattern-carmel:has\(#dashboard-main\)::before\s*\{(?<body>[^}]*)\}/s.exec(mainCss)

    expect(block?.groups?.body).toContain('background-size: 110% auto')
    expect(block?.groups?.body).toContain('background-position: center 0')
  })
})
