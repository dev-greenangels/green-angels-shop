export type ReviewRequestEmailTemplate = {
  subject: string
  body: string
}

export type ReviewsSettings = {
  postPurchaseRequestsEnabled: boolean
  automaticSendingEnabled: boolean
  trigger: 'SHIPPED_PLUS_DELAY'
  delayDays: number
  tokenValidityDays: number
  requestEmailTemplates: Partial<Record<string, ReviewRequestEmailTemplate>>
}

export const DEFAULT_REVIEWS_SETTINGS: ReviewsSettings = {
  postPurchaseRequestsEnabled: true,
  automaticSendingEnabled: false,
  trigger: 'SHIPPED_PLUS_DELAY',
  delayDays: 7,
  tokenValidityDays: 180,
  requestEmailTemplates: {},
}

export const REVIEW_REQUEST_EMAIL_PLACEHOLDERS =
  '{{customerName}}, {{orderNumber}}, {{reviewUrl}}'
