import { defineConfig, mergeCatalogRules } from 'pncat'

export default defineConfig({
  exclude: [
    '@types/vscode',
    'code-finder',
    'better-sqlite3',
  ],
  catalogRules: mergeCatalogRules([]),
  postRun: 'eslint --fix "**/package.json" "**/pnpm-workspace.yaml"',
})
