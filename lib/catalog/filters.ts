export const containerSizes = [
  { value: 'P9', label: 'P9 (Ø 9 см)' },
  { value: 'C2', label: 'C2 (2 л)' },
  { value: 'C3', label: 'C3 (3 л)' },
  { value: 'C5', label: 'C5 (5 л)' },
  { value: 'C7', label: 'C7 (7 л)' },
  { value: 'C10', label: 'C10 (10 л)' },
  { value: 'C20', label: 'C20 (20 л)' },
  { value: 'C30', label: 'C30 (30 л)' },
] as const

export const sunRequirements = [
  { value: 'full-sun', label: 'Повне сонце' },
  { value: 'partial-shade', label: 'Напівтінь' },
  { value: 'full-shade', label: 'Тінь' },
] as const

export const soilTypes = [
  { value: 'acidic', label: 'Кислий' },
  { value: 'neutral', label: 'Нейтральний' },
  { value: 'alkaline', label: 'Лужний' },
  { value: 'any', label: 'Будь-який' },
] as const

export const hardinessZones = [
  { value: '2-7', label: 'Зона 2-7' },
  { value: '3-7', label: 'Зона 3-7' },
  { value: '3-8', label: 'Зона 3-8' },
  { value: '3-9', label: 'Зона 3-9' },
  { value: '4-7', label: 'Зона 4-7' },
  { value: '4-8', label: 'Зона 4-8' },
] as const
