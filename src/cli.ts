import type { HistoryEntry } from 'code-finder'
import process from 'node:process'
import { config } from './config'
import { CLI_PATH, EDITOR_CONFIG_NAME_MAP } from './constants'
import { execFileAsync } from './utils'

async function executeCli(args: string[]) {
  let stdout: string
  try {
    const result = await execFileAsync('node', args, { encoding: 'utf-8' })
    stdout = result.stdout
  }
  catch {
    const result = await execFileAsync(process.execPath, args, { encoding: 'utf-8' })
    stdout = result.stdout
  }
  return stdout
}

export async function processCli(mode: 'update' | 'combine'): Promise<HistoryEntry[] | undefined> {
  const { extractJSON, normalizePath } = await import('code-finder')

  const ide = config.ide.map(name => EDITOR_CONFIG_NAME_MAP[name as keyof typeof EDITOR_CONFIG_NAME_MAP])
  const ignorePaths = Array.isArray(config.ignorePaths) ? config.ignorePaths : [config.ignorePaths].filter(Boolean)
  const args: string[] = [CLI_PATH, mode, '--json', '--tildify']

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

  if (config.showGitBranch)
    args.push('--git-branch')

  if (config.showSource)
    args.push('--source')

  const stdout = await executeCli(args)
  if (mode === 'combine')
    return extractJSON(stdout)
}
