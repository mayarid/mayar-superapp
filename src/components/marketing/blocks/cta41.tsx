import { useId } from "react"

import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"

interface Button {
  text: string
  url: string
  icon?: React.ReactNode
}
interface Buttons {
  primary?: Button
  secondary?: Button
}

interface CtaSimpleProps {
  heading: string
  description: string
  buttons?: Buttons
  className?: string
}

interface Cta41Props extends CtaSimpleProps {}

/*
 * The block's English placeholder defaults were removed. They only ever
 * rendered when a caller forgot a prop, which makes a forgotten prop publish
 * marketing copy nobody wrote instead of failing the build.
 */

const DottedPattern = () => {
  const patternId = useId().replaceAll(":", "")
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    >
      <defs>
        <pattern
          id={patternId}
          width={20}
          height={20}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={10}
            cy={10}
            r={1.5}
            fill="currentColor"
            className="text-border"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}

const Cta41 = ({ heading, description, buttons, className }: Cta41Props) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="relative flex items-center justify-center overflow-hidden border py-20 text-center md:p-20">
        <DottedPattern />
        <div className="relative z-10 container">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-4 text-3xl font-semibold text-balance md:text-5xl">
              {heading}
            </h2>
            <p className="md:text-lg">{description}</p>
            <div className="mt-11 flex flex-col justify-center gap-2 sm:flex-row">
              {buttons?.primary && (
                <Button
                  size="lg"
                  render={<a href={buttons.primary.url} />}
                  nativeButton={false}
                >
                  {buttons.primary.text}
                </Button>
              )}
              {buttons?.secondary && (
                <Button
                  size="lg"
                  variant="outline"
                  render={<a href={buttons.secondary.url} />}
                  nativeButton={false}
                >
                  {buttons.secondary.text}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Cta41 }
