/**
 * Aggregate ERP badge for backstage order detail.
 * Received Order FSM stays in erpSyncStatus; ZÁLOHA / Stripe / Bank clearing are separate FSMs.
 * Badge must not claim full success when a required post-export document is FAILED.
 */

export type ErpDocumentStageStatus = string | null | undefined

export type ErpAggregateLabel =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'WAITING'
  | 'SYNCED'
  | 'PARTIAL'
  | 'FAILED'
  | string

function norm(status: ErpDocumentStageStatus): string {
  return (status ?? '').trim().toUpperCase() || 'NOT_REQUIRED'
}

export function isCardPaymentMethodForErp(paymentMethod: string | null | undefined): boolean {
  return (paymentMethod ?? '').trim() === 'card-online'
}

export function isBankPaymentMethodForErp(paymentMethod: string | null | undefined): boolean {
  const m = (paymentMethod ?? '').trim()
  return m === 'bank-transfer' || m === 'bank-transfer-legal'
}

export function isCodPaymentMethodForErp(paymentMethod: string | null | undefined): boolean {
  return (paymentMethod ?? '').trim() === 'dobierka'
}

export type ErpAggregateInput = {
  paymentMethod: string | null | undefined
  paymentStatus?: string | null | undefined
  erpSyncStatus: ErpDocumentStageStatus
  erpAdvanceSyncStatus?: ErpDocumentStageStatus
  erpStripePaySyncStatus?: ErpDocumentStageStatus
  erpBankPaySyncStatus?: ErpDocumentStageStatus
}

/**
 * Stages shown on the ABRA / ERP card (not including overall badge).
 * CARD: Received Order + ZÁLOHA + Stripe payment
 * BANK: Received Order + ZÁLOHA + Bank payment
 * COD: Received Order only
 */
export function resolveErpDocumentStages(paymentMethod: string | null | undefined): Array<
  'received' | 'advance' | 'stripePay' | 'bankPay'
> {
  if (isCardPaymentMethodForErp(paymentMethod)) {
    return ['received', 'advance', 'stripePay']
  }
  if (isBankPaymentMethodForErp(paymentMethod)) {
    return ['received', 'advance', 'bankPay']
  }
  return ['received']
}

/** Effective bank-pay status for display (WAITING until website paid). */
export function resolveBankPayDisplayStatus(input: {
  paymentStatus?: string | null
  erpBankPaySyncStatus?: ErpDocumentStageStatus
}): string {
  const stored = norm(input.erpBankPaySyncStatus)
  if (stored === 'SYNCED' || stored === 'FAILED' || stored === 'PENDING') return stored
  if ((input.paymentStatus ?? '').trim() !== 'success') return 'WAITING'
  return stored === 'NOT_REQUIRED' ? 'WAITING' : stored
}

export function resolveErpAggregateLabel(input: ErpAggregateInput): ErpAggregateLabel {
  const stages = resolveErpDocumentStages(input.paymentMethod)
  const statuses: string[] = []

  for (const stage of stages) {
    if (stage === 'received') statuses.push(norm(input.erpSyncStatus))
    else if (stage === 'advance') statuses.push(norm(input.erpAdvanceSyncStatus))
    else if (stage === 'stripePay') statuses.push(norm(input.erpStripePaySyncStatus))
    else {
      statuses.push(
        resolveBankPayDisplayStatus({
          paymentStatus: input.paymentStatus,
          erpBankPaySyncStatus: input.erpBankPaySyncStatus,
        }),
      )
    }
  }

  if (statuses.every((s) => s === 'NOT_REQUIRED')) return 'NOT_REQUIRED'
  if (statuses.some((s) => s === 'FAILED')) {
    const anyOk = statuses.some((s) => s === 'SYNCED')
    return anyOk ? 'PARTIAL' : 'FAILED'
  }
  // BANK unpaid: Received+ZÁLOHA SYNCED + Bank WAITING → PARTIAL (not full green).
  if (statuses.some((s) => s === 'WAITING')) {
    if (statuses.every((s) => s === 'SYNCED' || s === 'WAITING' || s === 'NOT_REQUIRED')) {
      return 'PARTIAL'
    }
  }
  if (statuses.every((s) => s === 'SYNCED' || s === 'NOT_REQUIRED')) {
    const required = statuses.filter((s) => s !== 'NOT_REQUIRED')
    if (required.length === 0) return 'NOT_REQUIRED'
    if (required.every((s) => s === 'SYNCED')) return 'SYNCED'
  }
  if (statuses.some((s) => s === 'SYNCED') && statuses.some((s) => s !== 'SYNCED' && s !== 'NOT_REQUIRED')) {
    return 'PARTIAL'
  }
  if (statuses.some((s) => s === 'PENDING' || s === 'QUEUED' || s === 'IN_PROGRESS')) {
    return 'PENDING'
  }
  return norm(input.erpSyncStatus)
}
