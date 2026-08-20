import { cn } from "@/lib/utils"

/**
 * @shadcnblocks/feature187 — numbered steps joined by a connector line.
 *
 * Adapted: content moved from a module constant to props, and the step title
 * moved off `text-black` onto `text-foreground` so it survives dark mode.
 */

interface Feature187Step {
  title: string
  description: string
}

interface Feature187Props {
  heading: string
  description?: string
  steps: Feature187Step[]
  className?: string
}

const Feature187 = ({
  heading,
  description,
  steps,
  className,
}: Feature187Props) => {
  return (
    <section className={cn("py-24", className)}>
      <div className="container">
        <div className="max-w-[62ch]">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {heading}
          </h2>
          {description && (
            <p className="mt-6 leading-relaxed text-pretty text-muted-foreground md:text-lg">
              {description}
            </p>
          )}
        </div>
        <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-6">
          {steps.map((step, index) => (
            <StepItem
              key={step.title}
              index={index}
              step={step}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function StepItem({
  step,
  index,
  isLast,
  className,
}: {
  step: Feature187Step
  index: number
  isLast: boolean
  className?: string
}) {
  return (
    <div className={cn("max-lg:flex max-lg:gap-4", className)}>
      <div className="relative lg:py-6">
        <div
          className={cn(
            "absolute h-full w-1 -translate-x-1/2 translate-y-11 bg-muted max-lg:left-1/2 lg:top-1/2 lg:h-1 lg:w-full lg:translate-x-6 lg:-translate-y-1/2",
            isLast && "hidden"
          )}
        />
        <div className="relative z-0 grid size-11 place-content-center rounded-full border-4 bg-background">
          <p className="text-lg font-bold tabular-nums">{index + 1}</p>
        </div>
      </div>
      <div className="max-lg:mt-2">
        <p className="text-lg font-semibold text-foreground">{step.title}</p>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          {step.description}
        </p>
      </div>
    </div>
  )
}

export { Feature187 }
