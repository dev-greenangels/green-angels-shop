export type ReferralDiscountType = 'PERCENT' | 'FIXED'

export type ReferralProgramSummary = {
  id: string
  isActive: boolean
  refereeDiscountType: ReferralDiscountType
  refereeDiscountValue: number
  referrerPoints: number
  minOrderSubtotal: number | null
  maxRefereeDiscount: number | null
  cookieDays: number
}

export type ReferralBackstageProgram = ReferralProgramSummary & {
  name: string
  excludeProductIds: string[]
  excludeCategoryIds: string[]
  onlyForRoles: string[]
  groupIds: string[]
  pointsExpireDays: number | null
  createdAt: string
  updatedAt: string
}

export type PointsLedgerEntry = {
  id: string
  delta: number
  balanceAfter: number
  reason: string
  orderId: string | null
  createdAt: string
  expiresAt: string | null
}

export type MyReferralSummary = {
  eligible: boolean
  code: string | null
  isCodeActive: boolean
  sharePath: string | null
  balance: number
  program: ReferralProgramSummary | null
  ledger: PointsLedgerEntry[]
}

export type ClaimReferralCodeResult = {
  valid: boolean
  cookieDays: number
  program: ReferralProgramSummary | null
}

export type PointsRedemptionPreview = {
  valid: boolean
  points: number
  moneyValue: number
  currentBalance: number
  reason?: string
}
