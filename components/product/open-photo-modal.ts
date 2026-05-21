/** Заглушка: модальне вікно свіжих фото (підключити пізніше). */
export function openPhotoModal(variantId: string, variantLabel: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.info('[openPhotoModal]', { variantId, variantLabel })
  }
}
