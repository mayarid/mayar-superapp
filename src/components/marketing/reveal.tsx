import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"

/**
 * Scroll reveal for marketing sections.
 *
 * The rule this is built around: a section is never hidden until something has
 * confirmed it is off screen. The server renders every section in its resting
 * position, and only an IntersectionObserver report of "not intersecting" is
 * allowed to take that away. So the worst case — no JavaScript, a tab that
 * stays in the background, an observer that never reports — is a page with no
 * animation, never a page with invisible sections.
 *
 * That also rules out measuring against `window.innerHeight` on mount. It can
 * still be 0 while the document is laying out, which reads as "nothing is on
 * screen" and hides the whole page.
 *
 * A section already on screen when the observer first reports stays put.
 * Something sitting in its resting position when the page appears has no
 * reason to play an entrance.
 *
 * Only transform and opacity are animated, and both are dropped entirely when
 * the reader asks for reduced motion.
 */

/** Small travel. A section sliding a whole viewport reads as a page turn. */
const TRAVEL = 12

/** A marketing page may run longer than product UI, but not past this. */
const DURATION = 0.4

/** Entrances ease out: the fast start reads as a response, not a wind-up. */
const EASE_OUT = [0, 0, 0.2, 1] as const

const AT_REST = { opacity: 1, y: 0 }
const HIDDEN = { opacity: 0, y: TRAVEL }

type Phase = "rest" | "hidden" | "shown"

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>("rest")

  useEffect(() => {
    if (reduced) return
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          // The first report, for a section below the fold. Hiding it here is
          // safe precisely because the reader cannot see it happen.
          setPhase((current) => (current === "rest" ? "hidden" : current))
          return
        }
        // On screen. Either it always was — in which case it stays where it
        // is — or it was hidden and has now been scrolled to.
        setPhase((current) => (current === "hidden" ? "shown" : "rest"))
        observer.disconnect()
      },
      // Waits until the section is a little way in, so it is not still
      // arriving by the time the reader is looking straight at it.
      { rootMargin: "0px 0px -10% 0px" }
    )
    observer.observe(element)

    return () => observer.disconnect()
  }, [reduced])

  return (
    <motion.div
      ref={ref}
      className={className}
      // The first paint has to match the server's, so nothing is animated into
      // place on arrival.
      initial={false}
      animate={phase === "hidden" ? HIDDEN : AT_REST}
      transition={
        // Hiding is instant and happens off screen; only the reveal that
        // follows it gets a duration.
        phase === "shown"
          ? { duration: DURATION, delay, ease: EASE_OUT }
          : { duration: 0 }
      }
    >
      {children}
    </motion.div>
  )
}
