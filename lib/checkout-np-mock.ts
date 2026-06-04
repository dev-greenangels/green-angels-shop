export type NpOption = { id: string; label: string }

export const NP_CITIES: NpOption[] = [
  { id: 'kyiv', label: 'Київ' },
  { id: 'lviv', label: 'Львів' },
  { id: 'uzhhorod', label: 'Ужгород' },
  { id: 'odesa', label: 'Одеса' },
  { id: 'kharkiv', label: 'Харків' },
  { id: 'dnipro', label: 'Дніпро' },
  { id: 'vinnytsia', label: 'Вінниця' },
]

export const NP_WAREHOUSES: Record<string, NpOption[]> = {
  kyiv: [
    { id: 'kyiv-1', label: 'Відділення №1 — вул. Хрещатик, 22' },
    { id: 'kyiv-47', label: 'Відділення №47 — просп. Перемоги, 3' },
    { id: 'kyiv-101', label: 'Поштомат №101 — вул. Борщагівська, 154' },
  ],
  lviv: [
    { id: 'lviv-5', label: 'Відділення №5 — вул. Городоцька, 359' },
    { id: 'lviv-12', label: 'Відділення №12 — вул. Зелена, 147' },
  ],
  uzhhorod: [
    { id: 'uzh-1', label: 'Відділення №1 — вул. Собранецька, 89' },
    { id: 'uzh-3', label: 'Відділення №3 — вул. Капушанська, 172' },
  ],
  odesa: [
    { id: 'odesa-7', label: 'Відділення №7 — вул. Дерибасівська, 5' },
    { id: 'odesa-25', label: 'Відділення №25 — вул. Балківська, 27' },
  ],
  kharkiv: [
    { id: 'kharkiv-12', label: 'Відділення №12 — просп. Науки, 48' },
    { id: 'kharkiv-45', label: 'Відділення №45 — вул. Сумська, 1' },
  ],
  dnipro: [
    { id: 'dnipro-3', label: 'Відділення №3 — просп. Дмитра Яворницького, 91' },
  ],
  vinnytsia: [
    { id: 'vinnytsia-2', label: 'Відділення №2 — вул. Соборна, 42' },
  ],
}

export const NP_STREETS: Record<string, NpOption[]> = {
  kyiv: [
    { id: 'kyiv-khreshchatyk', label: 'вул. Хрещатик' },
    { id: 'kyiv-bolshaya-vasylkivska', label: 'вул. Велика Васильківська' },
    { id: 'kyiv-heroiv', label: 'просп. Героїв України' },
  ],
  lviv: [
    { id: 'lviv-horodotska', label: 'вул. Городоцька' },
    { id: 'lviv-franka', label: 'вул. Івана Франка' },
  ],
  uzhhorod: [
    { id: 'uzh-sobranetska', label: 'вул. Собранецька' },
    { id: 'uzh-svobody', label: 'вул. Сободи' },
  ],
  odesa: [
    { id: 'odesa-deribasivska', label: 'вул. Дерибасівська' },
    { id: 'odesa-frantsuzky', label: 'вул. Французький бульвар' },
  ],
  kharkiv: [
    { id: 'kharkiv-sumska', label: 'вул. Сумська' },
    { id: 'kharkiv-pushkinska', label: 'вул. Пушкінська' },
  ],
  dnipro: [
    { id: 'dnipro-yavornytskoho', label: 'просп. Дмитра Яворницького' },
  ],
  vinnytsia: [
    { id: 'vinnytsia-soborna', label: 'вул. Соборна' },
  ],
}

export function getNpCityLabel(cityId: string): string {
  return NP_CITIES.find((c) => c.id === cityId)?.label ?? cityId
}

export function getNpWarehouseLabel(cityId: string, warehouseId: string): string {
  return NP_WAREHOUSES[cityId]?.find((w) => w.id === warehouseId)?.label ?? warehouseId
}

export function getNpStreetLabel(cityId: string, streetId: string): string {
  return NP_STREETS[cityId]?.find((s) => s.id === streetId)?.label ?? streetId
}
