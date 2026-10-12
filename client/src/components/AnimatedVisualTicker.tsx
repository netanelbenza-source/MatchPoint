import { motion } from 'framer-motion'
import { HeartHandshake, Home, Sparkles, type LucideIcon } from 'lucide-react'

function Ring({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="14" r="6" />
      <path d="M9 9.2 12 4l3 5.2" />
    </svg>
  )
}

const ITEMS: { icon: LucideIcon | typeof Ring; text: string }[] = [
  { icon: Ring, text: 'חיבור מושלם' },
  { icon: HeartHandshake, text: 'התאמה מבוססת ערכים' },
  { icon: Home, text: 'בניין עדי עד' },
  { icon: Sparkles, text: 'ליווי אישי ומקצועי' },
]

export function AnimatedVisualTicker() {
  const loop = [...ITEMS, ...ITEMS]

  return (
    <div className="overflow-hidden py-1" dir="ltr">
      <motion.div
        className="flex w-max items-center gap-3"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 26, ease: 'linear', repeat: Infinity }}
        aria-hidden="true"
      >
        {loop.map((item, index) => {
          const Icon = item.icon
          return (
            <span
              key={`${item.text}-${index}`}
              dir="rtl"
              className="flex shrink-0 items-center gap-2.5 rounded-full border border-white/30 bg-white/20 px-6 py-3 shadow-sm backdrop-blur-md"
            >
              <Icon className="shrink-0 text-coral" size={18} />
              <span className="text-sm font-semibold text-navy">{item.text}</span>
            </span>
          )
        })}
      </motion.div>
    </div>
  )
}
