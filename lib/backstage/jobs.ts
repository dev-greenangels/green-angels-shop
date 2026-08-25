export type BackstageJobsSnapshot = {
  app: {
    counts: Record<string, number>
    stockJobs: Array<{
      id: string | undefined
      name: string
      state: string
      attemptsMade: number
      timestamp: number
      failedReason: string | null
    }>
  }
  flexi: {
    jobs: Record<string, number>
    events: Record<string, number>
    cursor: number
  }
  novaPoshta: {
    jobs: Record<string, number>
    isRunning: boolean
    lastRun: { status: string; startedAt: string; error: string | null } | null
  }
  tedb: {
    jobs: Record<string, number>
    lastRunAt: string | null
    lastError: string | null
    enabledAuto: boolean
  }
}

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[]
    error?: string
  }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

export async function fetchBackstageJobs(): Promise<BackstageJobsSnapshot> {
  const res = await fetch('/api/backstage/jobs', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
