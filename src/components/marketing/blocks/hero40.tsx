import { ArrowRight, Check } from "lucide-react"
import type { ElementType } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Hero40Props {
  heading: string
  description: string
  buttons?: {
    primary?: { text: string; url: string }
    secondary?: { text: string; url: string }
  }
  image: { src: string; alt: string }
  integrations: {
    name: string
    description: string
    icon: ElementType
  }[]
  checklistItems?: string[]
  className?: string
}

/*
 * The block's English placeholder defaults were removed. They only ever
 * rendered when a caller forgot a prop, which makes a forgotten prop publish
 * marketing copy nobody wrote instead of failing the build.
 */

const Hero40 = ({
  heading,
  description,
  buttons,
  image,
  integrations,
  checklistItems,
  className,
}: Hero40Props) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-semibold tracking-tight text-balance lg:text-6xl">
              {heading}
            </h1>
            <p className="text-lg text-muted-foreground">{description}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {buttons?.primary && (
                <Button
                  size="lg"
                  render={<a href={buttons.primary.url} />}
                  nativeButton={false}
                >
                  {buttons.primary.text}
                  <ArrowRight data-icon="inline-end" />
                </Button>
              )}
              {buttons?.secondary && (
                <Button
                  variant="outline"
                  size="lg"
                  render={<a href={buttons.secondary.url} />}
                  nativeButton={false}
                >
                  {buttons.secondary.text}
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {checklistItems?.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="size-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <img
              src={image.src}
              alt={image.alt}
              className="aspect-video w-full rounded-lg border border-border object-cover"
            />
            <ul className="flex flex-col gap-3">
              {integrations.map((integration) => (
                <li
                  key={integration.name}
                  className="flex gap-3 rounded-xl border border-border p-4"
                >
                  <integration.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{integration.name}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {integration.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Hero40 }
