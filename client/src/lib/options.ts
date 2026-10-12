export const GENDERS = [
  { value: 'Male', label: 'זכר' },
  { value: 'Female', label: 'נקבה' },
] as const

export const SECTORS = ['חסידי', 'ליטאי', 'ספרדי', 'חבד', 'חרדי מודרני', 'אחר']
export const EDUCATION = ['ישיבה', 'סמינר', 'כולל', 'הכשרה מקצועית', 'לימודים אקדמאים']
export const NO_FRAMEWORK = 'ללא מסגרת'
export const LIFESTYLES = ['לימוד מלא', 'לימוד ועבודה', 'עבודה וקביעות עיתים', 'עבודה']

export function educationForSoughtGender(gender: 'Male' | 'Female') {
  if (gender === 'Female') return ['סמינר', 'לימודים אקדמאים', 'הכשרה מקצועית', NO_FRAMEWORK]
  return [...EDUCATION.filter((item) => item !== 'סמינר'), NO_FRAMEWORK]
}

export function lifestyleForSoughtGender(gender: 'Male' | 'Female') {
  return gender === 'Female' ? ['לימוד ועבודה', 'עבודה'] : [...LIFESTYLES]
}

export function educationForProfileGender(gender: 'Male' | 'Female') {
  if (gender === 'Female') return ['סמינר', 'הכשרה מקצועית', 'לימודים אקדמאים', NO_FRAMEWORK]
  return ['ישיבה', 'כולל', 'הכשרה מקצועית', 'לימודים אקדמאים', NO_FRAMEWORK]
}

export function lifestyleForProfileGender(gender: 'Male' | 'Female') {
  return gender === 'Female' ? ['לימוד ועבודה', 'עבודה'] : [...LIFESTYLES]
}
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
