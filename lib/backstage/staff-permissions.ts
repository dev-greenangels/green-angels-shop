export type StaffPermissionRegistryItem = {
  key: string
  group: string
  labelKey: string
  descriptionKey: string
  status: 'EXISTING' | 'PLANNED'
}

export async function fetchStaffPermissionRegistry(): Promise<{
  items: StaffPermissionRegistryItem[]
}> {
  const res = await fetch('/api/backstage/staff-permissions/registry', {
    credentials: 'include',
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Не вдалося завантажити реєстр прав.',
    )
  }
  return {
    items: Array.isArray(data.items) ? data.items : [],
  }
}

export async function fetchUserStaffPermissions(userId: string): Promise<string[]> {
  const res = await fetch(
    `/api/backstage/staff-permissions/users/${encodeURIComponent(userId)}`,
    { credentials: 'include', cache: 'no-store' },
  )
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Не вдалося завантажити права.',
    )
  }
  return Array.isArray(data.permissions) ? data.permissions : []
}

export async function saveUserStaffPermissions(
  userId: string,
  permissions: string[],
): Promise<string[]> {
  const res = await fetch(
    `/api/backstage/staff-permissions/users/${encodeURIComponent(userId)}`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions }),
    },
  )
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Не вдалося зберегти права.',
    )
  }
  return Array.isArray(data.permissions) ? data.permissions : []
}
