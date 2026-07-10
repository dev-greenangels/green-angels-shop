export function formatPersonName(
  lastName: string,
  firstName: string,
  patronymic?: string | null,
): string {
  return [lastName, firstName, patronymic?.trim()].filter(Boolean).join(' ')
}
