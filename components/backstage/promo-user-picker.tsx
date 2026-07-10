'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { backstagePickerResultButtonClassName } from '@/lib/backstage/picker-styles'
import {
  fetchBackstageUsers,
  type BackstageUserListItem,
} from '@/lib/backstage/users'

type PromoUserSummary = {
  id: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  email: string | null
}

const MIN_SEARCH_CHARS = 1
const DEBOUNCE_MS = 300

function userLabel(user: BackstageUserListItem | PromoUserSummary) {
  const patronymic = 'patronymic' in user ? user.patronymic : null
  const name = [user.lastName, user.firstName, patronymic].filter(Boolean).join(' ')
  const contact = user.phone || user.email || ''
  return name ? `${name}${contact ? ` · ${contact}` : ''}` : contact || user.id.slice(0, 8)
}

export function PromoUserPicker({
  selectedIds,
  selectedUsers,
  onChange,
}: {
  selectedIds: string[]
  selectedUsers: PromoUserSummary[]
  onChange: (ids: string[], users: PromoUserSummary[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<BackstageUserListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const anchorRef = useRef<HTMLDivElement>(null)
  const selectedIdsRef = useRef(selectedIds)

  selectedIdsRef.current = selectedIds
  const knownUsers = new Map(selectedUsers.map((u) => [u.id, u]))

  const runSearch = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (trimmed.length < MIN_SEARCH_CHARS) {
      setResults([])
      setSearchError(null)
      setLoading(false)
      return
    }

    const requestId = ++requestIdRef.current
    setLoading(true)
    setSearchError(null)

    try {
      const users = await fetchBackstageUsers({ segment: 'customers', search: trimmed })
      if (requestIdRef.current !== requestId) return

      const filtered = Array.isArray(users)
        ? users.filter((u) => !selectedIdsRef.current.includes(u.id)).slice(0, 12)
        : []

      setResults(filtered)
      if (!filtered.length) {
        setSearchError('Користувачів не знайдено. Спробуйте ПІБ, телефон або email.')
      }
    } catch (error) {
      if (requestIdRef.current !== requestId) return
      setResults([])
      setSearchError(
        error instanceof Error ? error.message : 'Не вдалося виконати пошук.',
      )
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      void runSearch(search)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [open, search, runSearch])

  const addUser = (user: BackstageUserListItem) => {
    if (selectedIdsRef.current.includes(user.id)) return
    onChange([...selectedIdsRef.current, user.id], [
      ...selectedUsers,
      {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
      },
    ])
    setSearch('')
    setResults([])
    setSearchError(null)
    setOpen(true)
  }

  const removeUser = (id: string) => {
    onChange(
      selectedIds.filter((x) => x !== id),
      selectedUsers.filter((u) => u.id !== id),
    )
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setResults([])
      setSearchError(null)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">Конкретні користувачі (порожньо = за групами / усі)</Label>

      <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
        <PopoverAnchor asChild>
          <div ref={anchorRef} className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              placeholder="ПІБ, телефон або email…"
              className="h-9 bg-background pl-9 text-sm shadow-sm"
              autoComplete="off"
            />
            {loading ? (
              <Loader2 className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>
        </PopoverAnchor>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg shadow-black/10"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) {
              e.preventDefault()
            }
          }}
        >
          <Command shouldFilter={false}>
            <CommandList>
              {search.trim().length < MIN_SEARCH_CHARS ? (
                <CommandEmpty>Введіть мінімум {MIN_SEARCH_CHARS} символ</CommandEmpty>
              ) : loading ? (
                <CommandEmpty>Пошук…</CommandEmpty>
              ) : searchError ? (
                <CommandEmpty>{searchError}</CommandEmpty>
              ) : (
                <CommandEmpty>Користувачів не знайдено</CommandEmpty>
              )}
              <CommandGroup className="p-1">
                {results.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => addUser(user)}
                    className={backstagePickerResultButtonClassName}
                  >
                    {userLabel(user)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.map((id) => {
            const user = knownUsers.get(id)
            const label = user ? userLabel(user) : id.slice(0, 8)
            return (
              <Badge key={id} variant="secondary" className="max-w-full gap-1 text-xs font-normal">
                <span className="truncate">{label}</span>
                <button type="button" onClick={() => removeUser(id)} aria-label="Прибрати">
                  <X className="h-3 w-3 shrink-0" />
                </button>
              </Badge>
            )
          })}
        </div>
      ) : null}

      {selectedIds.length > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onChange([], [])}
        >
          Очистити користувачів
        </Button>
      ) : null}
    </div>
  )
}
