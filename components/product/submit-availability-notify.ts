export type AvailabilityNotifyPayload = {
  plantId: string
  plantName: string
  name: string
  contactType: 'email' | 'phone'
  contact: string
}

/** Заглушка: збереження підписки «повідомити про наявність» (розсилку підключимо пізніше). */
export async function submitAvailabilityNotify(
  payload: AvailabilityNotifyPayload
): Promise<{ ok: true }> {
  if (process.env.NODE_ENV === 'development') {
    console.info('[submitAvailabilityNotify]', payload)
  }
  await new Promise((r) => setTimeout(r, 400))
  return { ok: true }
}
