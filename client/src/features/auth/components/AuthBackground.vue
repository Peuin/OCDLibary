<script setup lang="ts">
import authBackgroundUrl from '@/assets/backgrounds/auth-carmel.jpg'
import authBackgroundSmallUrl from '@/assets/backgrounds/auth-carmel-sm.jpg'

const srcset = `${authBackgroundSmallUrl} 960w, ${authBackgroundUrl} 1792w`
</script>

<template>
  <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
    <img
      :src="authBackgroundUrl"
      :srcset="srcset"
      sizes="100vw"
      alt=""
      class="h-full w-full object-cover object-[28%_center]"
      fetchpriority="high"
      decoding="async"
    />
    <!-- The artwork leaves its right half open, so the scrim deepens there behind the form. -->
    <div class="auth-scrim absolute inset-0" />
  </div>
</template>

<style scoped>
.auth-scrim {
  background: linear-gradient(
    90deg,
    transparent 0%,
    transparent 38%,
    color-mix(in oklch, var(--background) 18%, transparent) 62%,
    color-mix(in oklch, var(--background) 42%, transparent) 100%
  );
}

:global(.dark) .auth-scrim {
  background: linear-gradient(
    90deg,
    color-mix(in oklch, var(--background) 45%, transparent) 0%,
    color-mix(in oklch, var(--background) 55%, transparent) 45%,
    color-mix(in oklch, var(--background) 78%, transparent) 100%
  );
}

/* On narrow screens the form sits over the artwork itself, so the whole image is softened. */
@media (max-width: 1023px) {
  .auth-scrim {
    background: color-mix(in oklch, var(--background) 45%, transparent);
  }

  :global(.dark) .auth-scrim {
    background: color-mix(in oklch, var(--background) 70%, transparent);
  }
}
</style>
