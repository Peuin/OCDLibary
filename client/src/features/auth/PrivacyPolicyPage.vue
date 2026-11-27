<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import policy from './privacy-policy.md?raw'

const { t } = useI18n()
const titleEnd = policy.indexOf('\n')
const title = policy.slice(0, titleEnd)
const blocks = policy
  .slice(titleEnd + 1)
  .trim()
  .replace(/^(## [^\n]+)\n/gm, '$1\n\n')
  .split(/\n\n+/)
const content = blocks.map((text) => {
  if (text.startsWith('## ')) return { kind: 'heading', text: text.slice(3), items: [] }
  if (text.startsWith('- ')) return { kind: 'list', text: '', items: text.split('\n').map((line) => line.slice(2)) }
  return { kind: 'paragraph', text, items: [] }
})
</script>

<template>
  <main class="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 sm:py-12">
    <div class="mx-auto max-w-[68ch]">
      <RouterLink
        to="/login"
        class="inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {{ t('auth.privacyPolicy.backToLogin') }}
      </RouterLink>

      <article lang="en" aria-labelledby="privacy-title" class="mt-8 break-words text-base leading-relaxed sm:mt-10">
        <h1 id="privacy-title" class="mb-6 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{{ title }}</h1>
        <template v-for="(block, index) in content" :key="index">
          <h2 v-if="block.kind === 'heading'" class="mt-10 mb-4 font-serif text-2xl font-semibold">{{ block.text }}</h2>
          <ul v-else-if="block.kind === 'list'" class="mb-5 list-disc space-y-2 ps-6">
            <li v-for="item in block.items" :key="item">{{ item }}</li>
          </ul>
          <p v-else class="mb-5">{{ block.text }}</p>
        </template>
      </article>

      <RouterLink
        to="/login"
        class="mt-8 inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {{ t('auth.privacyPolicy.backToLogin') }}
      </RouterLink>
    </div>
  </main>
</template>
