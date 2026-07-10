export type BackstageStaffRole = 'ADMIN' | 'MANAGER'

export type BackstageSession = {
  email: string
  firstName: string
  lastName: string
  staffRole?: BackstageStaffRole
}
