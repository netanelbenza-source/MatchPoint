import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'he' | 'en'

const STORAGE_KEY = 'matchpoint-lang'

const VALUE_LABELS: Record<string, string> = {
  Male: 'Male',
  Female: 'Female',
  זכר: 'Male',
  נקבה: 'Female',
  ישיבה: 'Yeshiva',
  סמינר: 'Seminary',
  כולל: 'Kollel',
  'הכשרה מקצועית': 'Vocational training',
  'לימודים אקדמאים': 'Academic studies',
  'ללא מסגרת': 'No framework',
  'לימוד מלא': 'Full-time study',
  'לימוד ועבודה': 'Study and work',
  'עבודה וקביעות עיתים': 'Work with set study times',
  עבודה: 'Work',
  חסידי: 'Hasidic',
  ליטאי: 'Lithuanian',
  ספרדי: 'Sephardi',
  חבד: 'Chabad',
  'חרדי מודרני': 'Modern Haredi',
  אחר: 'Other',
  אנגלית: 'English',
  ספרדית: 'Spanish',
  צרפתית: 'French',
  עברית: 'Hebrew',
  רוסית: 'Russian',
}

const API_EN: Record<string, string> = {
  'אם יש חשבון עם האימייל הזה, נשלח קישור לאיפוס הסיסמה.': 'If an account exists for this email, a reset link was sent.',
  'הקישור לא תקין או שפג תוקפו.': 'The link is invalid or expired.',
  'הסיסמה עודכנה. אפשר להתחבר.': 'The password was updated. You can log in.',
  'שליחת האימייל נכשלה': 'The email could not be sent.',
  'שליחת האימייל לא הוגדרה. הוסף SMTP_USER ו-SMTP_PASS לקובץ .env': 'Email sending is not configured.',
  'אין רשומת שדכן עם האימייל של החשבון הזה': 'No matchmaker record matches this account email.',
  'הבחור שנבחר לא זמין': 'The selected man is not available.',
  'הבחורה שנבחרה לא זמינה': 'The selected woman is not available.',
  'הבחור שנבחר לא מקושר לחשבון משתמש, ולכן אי אפשר לשלוח לו אישור.': 'The selected man is not linked to a user account, so an approval cannot be sent.',
  'הבחורה שנבחרה לא מקושרת לחשבון משתמש, ולכן אי אפשר לשלוח לה אישור.': 'The selected woman is not linked to a user account, so an approval cannot be sent.',
  'הבחור שנבחר לא תואם את השדה שנבחר.': 'The selected man does not match that field.',
  'הבחורה שנבחרה לא תואמת את השדה שנבחר.': 'The selected woman does not match that field.',
  'הבחור שנבחר בלי כתובת אימייל, ולכן אי אפשר לשלוח לו אישור.': 'The selected man has no email address, so an approval cannot be sent.',
  'הבחורה שנבחרה בלי כתובת אימייל, ולכן אי אפשר לשלוח לה אישור.': 'The selected woman has no email address, so an approval cannot be sent.',
  'אי אפשר לשלוח אישור שידוך לחשבון של השדכן. לכל צד צריך אימייל משלו.': 'An engagement approval cannot be sent to the matchmaker account. Each side needs their own email.',
  'לאחד הצדדים אין אימייל אמיתי, ולכן האישור לא נשלח.': 'One side has no real email address, so the approval was not sent.',
  'כבר נשלחה בקשת אישור פתוחה לזוג הזה': 'An open approval request already exists for this pair.',
  'לא נוצרו שני קישורי אישור נפרדים': 'Two separate approval links were not created.',
  'הבקשה לא נמצאה': 'The request was not found.',
  'השידוך כבר נסגר': 'The match is already closed.',
  'האישור שלך כבר נקלט': 'Your approval was already received.',
  'שני הצדדים אישרו. השידוך נסגר.': 'Both sides approved. The match is closed.',
  'מחכים לאישור הצד השני.': 'Waiting for the other side to approve.',
  'לא ניתן לשלוח פרטים על עצמך': 'You cannot send your own details.',
  'חסר פרופיל למשתמש המחובר': 'The signed-in user has no profile.',
  'המועמד לא נמצא': 'The candidate was not found.',
  'למועמד אין שדכן': 'The candidate has no matchmaker.',
  'לשדכן אין כתובת אימייל': 'The matchmaker has no email address.',
  'הפרטים נשלחו לשדכן': 'Your details were sent to the matchmaker.',
  'הבקשה נכשלה': 'The request failed.',
  'Invalid or expired token': 'Invalid or expired token.',
  'הקוד או הקישור לא תקינים.': 'The code or link is not valid.',
  'קודם ממלאים פרופיל.': 'Fill in a profile first.',
  'המגדר המבוקש חייב להיות המגדר ההפוך מהפרופיל.': 'The requested gender must be the opposite of the profile gender.',
}

function labelOf(value: string, lang: Lang) {
  if (!value) return ''
  if (lang === 'he') {
    if (value === 'Male') return 'זכר'
    if (value === 'Female') return 'נקבה'
    return value
  }
  return VALUE_LABELS[value] ?? value
}

type I18nValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  tr: (he: string, en: string) => string
  label: (value: string) => string
  message: (value: string) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'he'))

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'he'
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl'
    localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  const value = useMemo<I18nValue>(() => ({
    lang,
    setLang,
    tr: (he, en) => (lang === 'en' ? en : he),
    label: (item) => labelOf(item, lang),
    message: (item) => (lang === 'en' ? API_EN[item] ?? item : item),
  }), [lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside LanguageProvider')
  return value
}
