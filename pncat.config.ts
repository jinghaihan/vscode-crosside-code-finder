import { defineConfig, mergeCatalogRules } from 'pncat'

export default defineConfig({
  exclude: ['@types/vscode'],
  catalogRules: mergeCatalogRules([
    {
      name: 'cli',
      match: ['code-finder'],
    },
  ]),
  postRun: 'eslint --fix "**/package.json" "**/pnpm-workspace.yaml"',
})
