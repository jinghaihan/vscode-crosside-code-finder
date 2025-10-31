import type { ExtensionContext, QuickPickItem } from 'vscode'
import { basename } from 'node:path'
import { defineExtension, useCommand } from 'reactive-vscode'
import { commands, ProgressLocation, QuickPickItemKind, ThemeIcon, Uri, window } from 'vscode'
import { processCli } from './cli'
import { config } from './config'
import { installDependencies } from './utils'

const { activate, deactivate } = defineExtension(async (ctx: ExtensionContext) => {
  useCommand('octohash.crosside-code-finder.openRecent', async () => {
    await installDependencies(ctx, { silent: true })

    const { EDITOR_NAME_MAP } = await import('code-finder')

    const entries = await processCli('combine') || []
    if (entries.length === 0) {
      window.showInformationMessage(`No recent projects found.`)
      return
    }

    const folderIcon = new ThemeIcon('folder')
    const fileIcon = new ThemeIcon('file')

    const items: (QuickPickItem & { path?: string })[] = []
    entries.forEach((entry) => {
      items.push({
        kind: QuickPickItemKind.Separator,
        label: entry.branch || '',
      })

      const source = entry.source ?? []
      const resolvedSource = source.length > 1 ? source.filter(i => i !== 'Codespace') : source
      const sourceNames = resolvedSource.map(i => EDITOR_NAME_MAP[i as keyof typeof EDITOR_NAME_MAP])

      items.push({
        label: decodeURIComponent(basename(entry.path!)),
        description: entry.path,
        detail: `${sourceNames.join(', ')}`,
        iconPath: entry.folderUri ? folderIcon : fileIcon,
        path: entry.folderUri || entry.fileUri,
      })
    })

    const selected = await window.showQuickPick(items, {
      placeHolder: 'Select to open',
      matchOnDescription: true,
      matchOnDetail: true,
    })

    if (selected && selected.path) {
      const uri = Uri.parse(selected.path)
      await commands.executeCommand('vscode.openFolder', uri, config.openInNewWindow)
    }
  })

  useCommand('octohash.crosside-code-finder.detectCodespaces', async () => {
    if (!config.workspace) {
      window.showInformationMessage('Please set the workspace in the extension settings to detect codespaces')
      return
    }

    await installDependencies(ctx, { silent: true })
    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: 'Detecting codespaces...',
        cancellable: false,
      },
      async (progress) => {
        await processCli('update')
        progress.report({ increment: 100, message: 'Update open recent history completed' })
      },
    )
  })

  useCommand('octohash.crosside-code-finder.installDependencies', async () => {
    await installDependencies(ctx)
  })
})

export { activate, deactivate }
