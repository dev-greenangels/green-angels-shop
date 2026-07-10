export type NpOption = {
  id: string
  label: string
  group?: 'branch' | 'postomat'
}

export type {
  NpAutoSyncConfig,
  NpHumanSchedule,
} from './cron-schedule'
export {
  DEFAULT_AUTO_SYNC_CONFIG,
  formatHumanSchedule,
  NP_WEEKDAY_LABELS,
  toggleWeekday,
} from './cron-schedule'

export type NovaPoshtaSettings = {
  apiKeyConfigured: boolean
  apiKeyMasked: string
  apiKeySource: 'env' | 'database' | 'none'
  jsonApiUrl: string
  effectiveJsonApiUrl: string
  jsonApiUrlSource: 'env' | 'database' | 'default'
  syncPageSizes: {
    settlements: number
    warehouses: number
  }
  syncPageSizeLimits: {
    settlements: number
    warehouses: number
  }
  autoSync: import('./cron-schedule').NpAutoSyncConfig
  lastManualSyncAt?: string
  lastAutoSyncAt?: string
}

export type NpSyncRunSnapshot = {
  id: string
  kind: string
  status: string
  startedAt: string
  finishedAt: string | null
  recordsTotal: number | null
  recordsSynced: number
  currentPage: number
  error: string | null
}

export type NpTargetLastSync = {
  target: 'settlements' | 'warehouses' | 'warehouse_types'
  status: 'completed' | 'failed' | 'cancelled'
  startedAt: string
  finishedAt: string
  recordsSynced: number
  error: string | null
  source: 'manual' | 'auto'
  jobId: string | null
}

export type NovaPoshtaSyncStatus = {
  isRunning: boolean
  activeJobId: string | null
  activeRun: NpSyncRunSnapshot | null
  lastRun: NpSyncRunSnapshot | null
  lastByTarget: {
    settlements: NpTargetLastSync | null
    warehouses: NpTargetLastSync | null
    warehouse_types: NpTargetLastSync | null
  }
  counts: {
    settlements: number
    warehouses: number
    warehouseTypes: number
  }
}

export type NpSyncTarget = 'all' | 'settlements' | 'warehouses' | 'warehouse_types'

const KIND_LABELS: Record<string, string> = {
  all: 'все',
  settlements: 'населені пункти',
  warehouses: 'відділення',
  warehouse_types: 'типи відділень',
}

const TARGET_LABELS: Record<NpTargetLastSync['target'], string> = {
  settlements: 'Населені пункти',
  warehouses: 'Відділення',
  warehouse_types: 'Типи відділень',
}

function formatLastRunStatus(status: string): string {
  switch (status) {
    case 'completed':
      return 'успішно'
    case 'failed':
      return 'не оновились'
    case 'cancelled':
      return 'скасовано'
    case 'running':
      return 'виконується'
    default:
      return status
  }
}

export function formatSyncRunLabel(run: NpSyncRunSnapshot): string {
  const kind = KIND_LABELS[run.kind] ?? run.kind
  return `${kind} — ${formatLastRunStatus(run.status)}`
}

export function formatSyncRunProgress(run: NpSyncRunSnapshot): string {
  const parts = [
    `сторінка ${run.currentPage}`,
    `записів ${run.recordsSynced.toLocaleString('uk-UA')}`,
  ]
  if (run.recordsTotal != null) {
    parts.push(`з ${run.recordsTotal.toLocaleString('uk-UA')}`)
  }
  return parts.join(' · ')
}

export function formatTargetLastSync(result: NpTargetLastSync): {
  summary: string
  error: string | null
} {
  const label = TARGET_LABELS[result.target]
  const when = new Date(result.finishedAt).toLocaleString('uk-UA')
  const source = result.source === 'auto' ? 'авто' : 'ручний'
  const count =
    result.status === 'completed' && result.recordsSynced > 0
      ? ` · ${result.recordsSynced.toLocaleString('uk-UA')} записів`
      : ''

  if (result.status === 'completed') {
    return {
      summary: `${label}: оновились успішно ${when} (${source})${count}`,
      error: null,
    }
  }
  if (result.status === 'cancelled') {
    return {
      summary: `${label}: скасовано ${when} (${source})`,
      error: result.error?.trim() || null,
    }
  }
  return {
    summary: `${label}: не оновились ${when} (${source})`,
    error: result.error?.trim() || 'невідома помилка',
  }
}

export { formatLastRunStatus, TARGET_LABELS }
