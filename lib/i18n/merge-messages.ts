function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function deepMergeMessages<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown>): T {
  const result = { ...base } as Record<string, unknown>

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue
    const current = result[key]
    if (isRecord(value) && isRecord(current)) {
      result[key] = deepMergeMessages(current, value)
    } else {
      result[key] = value
    }
  }

  return result as T
}

export function flattenMessageStrings(
  obj: Record<string, unknown>,
  prefix = '',
): Array<{ key: string; value: string }> {
  const result: Array<{ key: string; value: string }> = []

  for (const [entryKey, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${entryKey}` : entryKey
    if (typeof value === 'string') {
      result.push({ key: path, value })
    } else if (isRecord(value)) {
      result.push(...flattenMessageStrings(value, path))
    }
  }

  return result
}

export function setMessageByPath(tree: Record<string, unknown>, path: string, value: string) {
  const parts = path.split('.')
  let current = tree

  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index]
    const next = current[part]
    if (!isRecord(next)) {
      current[part] = {}
    }
    current = current[part] as Record<string, unknown>
  }

  current[parts[parts.length - 1]] = value
}

export function getMessageByPath(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (!isRecord(current)) return undefined
    current = current[part]
  }

  return typeof current === 'string' ? current : undefined
}

export function buildMessageOverridesTree(
  entries: Array<{ key: string; value: string }>,
  baseMessages: Record<string, unknown>,
): Record<string, unknown> {
  const tree: Record<string, unknown> = {}

  for (const { key, value } of entries) {
    const trimmed = value.trim()
    const baseValue = getMessageByPath(baseMessages, key)
    if (!trimmed || (typeof baseValue === 'string' && trimmed === baseValue)) continue
    setMessageByPath(tree, key, trimmed)
  }

  return tree
}
