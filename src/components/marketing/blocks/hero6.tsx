import { ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * @shadcnblocks/hero6 — centered headline over a two-panel media band.
 *
 * Adapted: content moved to props, and the block's third-party wordmark strip
 * removed. Those logos advertised the stack the block was demoed on; borrowing
 * them here would imply endorsements this app does not have.
 */

interface Hero6Props {
  heading: string
  description: string
  buttons?: {
    primary?: { text: string; url: string }
    secondary?: { text: string; url: string }
  }
  images: [{ src: string; alt: string }, { src: string; alt: string }]
  className?: string
}

const Hero6 = ({
  heading,
  description,
  buttons,
  images,
  className,
}: Hero6Props) => {
  return (
    <section className={cn("py-24", className)}>
      <div className="container">
        <div className="mx-auto flex max-w-5xl flex-col items-center">
          <div className="z-10 flex flex-col items-center gap-8 text-center">
            <div className="max-w-3xl">
              <h1 className="mb-4 text-4xl font-semibold tracking-tight text-pretty lg:text-6xl">
                {heading}
              </h1>
              <p className="leading-relaxed text-pretty text-muted-foreground lg:text-xl">
                {description}
              </p>
            </div>
            <div className="flex w-full flex-col justify-center gap-2 sm:flex-row">
              {buttons?.primary && (
                <Button
                  render={<a href={buttons.primary.url} />}
                  nativeButton={false}
                >
                  {buttons.primary.text}
                  <ChevronRight data-icon="inline-end" />
                </Button>
              )}
              {buttons?.secondary && (
                <Button
                  variant="ghost"
                  render={<a href={buttons.secondary.url} />}
                  nativeButton={false}
                >
                  {buttons.secondary.text}
                  <ChevronRight data-icon="inline-end" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="mx-auto mt-16 grid max-w-7xl gap-px overflow-hidden rounded-2xl bg-border p-px md:grid-cols-5">
          <img
            src={images[0].src}
            alt={images[0].alt}
            width={900}
            height={500}
            className="h-full max-h-[500px] w-full object-cover md:col-span-3"
          />
          <img
            src={images[1].src}
            alt={images[1].alt}
            width={600}
            height={500}
            className="h-full max-h-[500px] w-full object-cover md:col-span-2"
          />
        </div>
      </div>
    </section>
  )
}

export { Hero6 }
