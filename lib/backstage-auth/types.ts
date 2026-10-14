export type BackstageStaffRole = 'ADMIN' | 'MANAGER'

export type BackstageSession = {
  email: string
  firstName: string
  lastName: string
  staffRole?: BackstageStaffRole
  /** Effective permission keys (ADMIN = full EXISTING set from Nest). */
  permissions?: string[]
}
