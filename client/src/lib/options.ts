export const GENDERS = [
  { value: 'Male', label: 'זכר' },
  { value: 'Female', label: 'נקבה' },
] as const

export const SECTORS = ['חסידי', 'ליטאי', 'ספרדי', 'חבד', 'חרדי מודרני', 'אחר']
export const EDUCATION = ['ישיבה', 'סמינר', 'כולל', 'הכשרה מקצועית', 'לימודים אקדמאים']
export const LIFESTYLES = ['לימוד מלא', 'לימוד ועבודה', 'עבודה וקביעות עיתים', 'עבודה']
export const LANGUAGES = ['אנגלית', 'ספרדית', 'צרפתית', 'עברית', 'רוסית', 'אחר']

export const CRITERIA: Record<string, string> = {
  age: 'גיל',
  location: 'עיר',
  languages: 'שפות',
  education: 'מסגרת',
  lifestyle: 'סדר יום',
  additionalCriteria: 'קריטריונים נוספים',
}

export function genderLabel(value: string) {
  return GENDERS.find((item) => item.value === value)?.label ?? value
}
