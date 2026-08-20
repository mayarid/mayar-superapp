import { ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Hero9Props {
  badge?: string
  heading: string
  description: string
  buttons?: {
    primary?: { text: string; url: string }
    secondary?: { text: string; url: string }
  }
  code: string
  codeLanguage?: string
  className?: string
}

/*
 * The block's English placeholder defaults were removed. They only ever
 * rendered when a caller forgot a prop, which makes a forgotten prop publish
 * marketing copy nobody wrote instead of failing the build.
 */

const Hero9 = ({
  badge,
  heading,
  description,
  buttons,
  code,
  className,
}: Hero9Props) => {
  return (
    <section className={cn("relative py-32", className)}>
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-x-0 -top-20 -bottom-20 bg-[radial-gradient(ellipse_60%_60%_at_65%_50%,var(--accent)_0%,transparent_80%)]"></div>
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-x-0 -top-20 -bottom-20 bg-[radial-gradient(color-mix(in_oklch,var(--accent-foreground)_10%,transparent)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_60%_at_65%_50%,#000_0%,transparent_80%)] [background-size:8px_8px]"></div>
      {/* Content */}
      <div className="relative container">
        <div className="flex flex-col items-start text-left">
          {badge && <Badge variant="outline">{badge}</Badge>}
          <h1 className="my-6 text-4xl font-bold text-pretty lg:text-6xl">
            {heading}
          </h1>
          <p className="mb-8 max-w-3xl text-muted-foreground lg:text-xl">
            {description}
          </p>
          <div className="flex w-full flex-col justify-start gap-2 sm:flex-row">
            {buttons?.primary && (
              <Button
                className="w-full sm:w-auto"
                render={<a href={buttons.primary.url} />}
                nativeButton={false}
              >
                {buttons.primary.text}
                <ChevronRight data-icon="inline-end" />
              </Button>
            )}
            {buttons?.secondary && (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                render={<a href={buttons.secondary.url} />}
                nativeButton={false}
              >
                {buttons.secondary.text}
              </Button>
            )}
          </div>
        </div>
        {/*
          The block shipped an empty `aspect-video` frame with a code panel
          floating over one corner, clipped by a fade. There is no screenshot to
          put in that frame, and the request is the whole point of this hero —
          so the request is the media, shown in full.
        */}
        <div className="relative mt-12 overflow-hidden rounded-2xl bg-primary p-6 shadow-md">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-primary-foreground sm:text-sm">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}

export { Hero9 }
