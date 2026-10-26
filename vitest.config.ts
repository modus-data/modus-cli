import path from 'node:path'
import { configDefaults, defineConfig } from 'vitest/config'
import { ciReporterExperimental, ciReporters } from '../../../../packages/testing/src/vitest-ci-reporters.js'
import { repoSpecGlob } from '../../../../vitest.repo-specs.js'

export default defineConfig({
  test: {
    name: 'modus-cli',
    clearMocks: false,
    include: ['tests/**/*.test.ts'],
    exclude: [...configDefaults.exclude, repoSpecGlob],
    reporters: ciReporters(path.resolve(import.meta.dirname, '../../../..')),
    experimental: ciReporterExperimental,
  },
})
