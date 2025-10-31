import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '../')
export const PACKAGE_JSON_PATH = join(ROOT_DIR, 'package.json')
export const CLI_PATH = join(ROOT_DIR, 'node_modules/code-finder/bin/code-finder.mjs')
export const RUNTIME_DEPENDENCIES = ['pnpm', 'code-finder', 'better-sqlite3'] as const

export const EDITOR_CONFIG_NAME_MAP = {
  'Visual Studio Code': 'Code',
  'Visual Studio Code - Insiders': 'Code - Insiders',
  'VSCodium': 'VSCodium',
  'VSCodium - Insiders': 'VSCodium - Insiders',
  'Cursor': 'Cursor',
  'Windsurf': 'Windsurf',
} as const
