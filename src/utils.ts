import type { ExtensionContext } from 'vscode'
import { exec, execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { useLogger } from 'reactive-vscode'
import { ProgressLocation, window } from 'vscode'
import { RUNTIME_DEPENDENCIES } from './constants'
import { displayName } from './generated/meta'

export const execAsync = promisify(exec)
export const execFileAsync = promisify(execFile)

export const logger = useLogger(displayName)

export function normalizePath(path: string) {
  if (path.startsWith('file://')) {
    try {
      return fileURLToPath(path)
    }
    catch {
      return path
    }
  }
  return path
}

async function hasPnpm(): Promise<boolean> {
  try {
    await execFileAsync('pnpm', ['--version'])
    return true
  }
  catch {
    return false
  }
}

async function hasSqlite3(): Promise<boolean> {
  try {
    await execFileAsync('sqlite3', ['--version'])
    return true
  }
  catch {
    return false
  }
}

export async function installDependencies(ctx: ExtensionContext, { silent = false}: { silent?: boolean } = {}) {
  const extpath = ctx.extensionPath
  const moduleRoot = join(ctx.extensionPath, 'node_modules')

  const pnpmExists = await hasPnpm()
  const sqlite3Exists = await hasSqlite3()

  const depsToInstall = RUNTIME_DEPENDENCIES
    .filter(dep => dep !== 'pnpm' || !pnpmExists)
    .filter(dep => dep !== 'better-sqlite3' || !sqlite3Exists)
    .filter(dep => !existsSync(join(moduleRoot, dep)))
  const depNames = depsToInstall.join(', ')

  if (depsToInstall.length === 0) {
    if (!silent)
      window.showInformationMessage(`${RUNTIME_DEPENDENCIES.join(', ')} is already installed`)
    return
  }

  await window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: `Installing ${depNames}...`,
      cancellable: false,
    },
    async (progress) => {
      try {
        if (depsToInstall.includes('pnpm')) {
          const action = await window.showWarningMessage(
            'PNPM is not installed. Would you like to install it globally?',
            { modal: true },
            'Install',
            'Cancel',
          )
          if (action === 'Cancel')
            throw new Error('pnpm is not installed')

          await execAsync('npm i -g pnpm', {
            cwd: extpath,
          })
        }

        const deps = depsToInstall.filter(dep => dep !== 'pnpm')
        if (deps.length > 0) {
          const { stderr } = await execAsync(`pnpm install ${deps.join(' ')}`, {
            cwd: extpath,
          })
          if (stderr)
            logger.warn('Installation stderr:', stderr)
        }

        progress.report({ increment: 100, message: `${depNames} installed successfully` })
      }
      catch (error) {
        logger.error(`Failed to install ${depNames}:`, error)
        throw error
      }
    },
  )
}
