import type { HistoryEntry } from 'code-finder'
import process from 'node:process'
import { config } from './config'
import { CLI_PATH, EDITOR_CONFIG_NAME_MAP } from './constants'
import { execFileAsync, normalizePath } from './utils'

export async function processCli(mode: 'update' | 'combine'): Promise<HistoryEntry[] | undefined> {
  const { JSON_MARKER } = await import('code-finder')

  const ide = config.ide.map(name => EDITOR_CONFIG_NAME_MAP[name as keyof typeof EDITOR_CONFIG_NAME_MAP])
  const ignorePaths = Array.isArray(config.ignorePaths) ? config.ignorePaths : [config.ignorePaths].filter(Boolean)
  const args: string[] = [CLI_PATH, mode]

  if (config.workspace)
    args.push('--cwd', normalizePath(config.workspace))
  ignorePaths.forEach((i) => {
    args.push('--ignore-paths', normalizePath(i))
  })
  ide.forEach((i) => {
    args.push('--ide', `${i}`)
  })
  if (config.overwriteOpenRecent)
    args.push('--overwrite')

  if (mode === 'combine') {
    args.push('--json', '--tildify')
    if (config.showGitBranch)
      args.push('--git-branch')
    if (config.showSource)
      args.push('--source')
  }

  let stdout: string
  try {
    const result = await execFileAsync('node', args, { encoding: 'utf-8' })
    stdout = result.stdout
  }
  catch {
    const result = await execFileAsync(process.execPath, args, { encoding: 'utf-8' })
    stdout = result.stdout
  }

  if (mode === 'combine') {
    const lines = stdout.split('\n')
    const start = lines.findIndex(line => line.includes(JSON_MARKER))
    const end = lines.slice(start + 1).findIndex(line => line.includes(JSON_MARKER)) + start + 1
    return JSON.parse(lines.slice(start + 1, end).join('\n'))
  }
}
