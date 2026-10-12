import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

const QUOTES = [
  'שני עולמות מתחברים לאחד',
  'התאמה מדויקת מבוססת ערכים',
  'הדרך החכמה והבטוחה לחופה',
  'שדכנות אישית שרואה אותך',
  'לבנות בית נאמן בישראל',
]

export function RollingQuotes() {
  const loop = [...QUOTES, ...QUOTES]

  return (
    <div className="overflow-hidden rounded-full bg-white/30 px-4 py-3 backdrop-blur-sm" dir="ltr">
      <motion.div
        className="flex w-max items-center"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 32, ease: 'linear', repeat: Infinity }}
        aria-hidden="true"
      >
        {loop.map((quote, index) => (
          <span key={`${quote}-${index}`} className="flex shrink-0 items-center gap-6 pe-6" dir="rtl">
            <span className="text-base font-semibold text-navy sm:text-lg">{quote}</span>
            <Heart className="shrink-0 text-coral" size={14} fill="currentColor" />
          </span>
        ))}
      </motion.div>
    </div>
  )
}
