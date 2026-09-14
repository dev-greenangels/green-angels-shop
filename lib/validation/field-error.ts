/**
 * Stable validation error codes for storefront forms.
 * Pure validators return codes; UI translates via next-intl `validation.*`.
 */

export type FieldErrorCode =
  | 'required'
  | 'invalidEmail'
  | 'invalidPhone'
  | 'invalidPhoneUa'
  | 'invalidPhoneSk'
  | 'invalidPhoneIntl'
  | 'latinCharactersRequired'
  | 'minLatinLetters'
  | 'requiredForeignPhone'
  | 'requiredAddressDelivery'
  | 'reviewFullNameRequired'
  | 'reviewFullNameInvalid'
  | 'reviewPhotosMax'
  | 'reviewContactRequired'
  | 'reviewTextMin'
  | 'reviewTextMax'
  | 'reviewTextNoHtml'
  | 'reviewImageInvalid'
  | 'reviewRatingRequired'
  | 'invalidIco'
  | 'invalidEdrpou'
  | 'companyLegalNameMin'
  | 'cyrillicFirstName'
  | 'cyrillicLastName'
  | 'cyrillicNameMin'
  | 'invalidSkPostal'
  | 'minTwoChars'
  | 'passwordMin8'
  | 'passwordsMismatch'
  | 'agreeTermsRequired'
  | 'phoneUaStartPlus380'
  | 'phoneUaNeed9After380'
  | 'phoneUaNeed9After0'

export type FieldErrorMessages = Partial<Record<FieldErrorCode, string>> & {
  required: string
}

export function formatFieldError(
  code: FieldErrorCode | null | undefined,
  messages: FieldErrorMessages,
): string | null {
  if (!code) return null
  return messages[code] ?? messages.required
}
