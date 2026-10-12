import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useI18n } from '../lib/i18n'

const SLIDES = [
  { src: '/assets/rings.png', he: 'חיבור מושלם', en: 'A perfect bond' },
  { src: '/assets/handshake.png', he: 'התאמה מבוססת ערכים', en: 'A match based on values' },
  { src: '/assets/chuppah.jpg?v=2', he: 'בניין עדי עד', en: 'Building a lasting home' },
]

export function AnimatedImageSliderBox() {
  const { tr } = useI18n()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length)
    }, 3500)
    return () => window.clearInterval(timer)
  }, [])

  const slide = SLIDES[index]

  return (
    <article className="relative mx-auto h-96 w-80 sm:h-[26rem] sm:w-96">
      <AnimatePresence>
        <motion.div
          key={slide.src}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <img src={slide.src} alt="" className="float-photo h-full w-full object-cover" />
          <p className="float-caption absolute inset-x-0 bottom-8 text-center text-2xl font-semibold text-navy">
            {tr(slide.he, slide.en)}
          </p>
        </motion.div>
      </AnimatePresence>
    </article>
  )
}
