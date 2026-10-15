import { configDefaults, defineConfig } from 'vitest/config'
import { repoSpecGlob } from '../../../../vitest.repo-specs.js'

export default defineConfig({
  test: {
    clearMocks: false,
    include: ['tests/**/*.test.ts'],
    exclude: [...configDefaults.exclude, repoSpecGlob],
  },
})
