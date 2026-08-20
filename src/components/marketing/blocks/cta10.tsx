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

interface Cta10Props extends CtaSimpleProps {}

/*
 * The block's English placeholder defaults were removed. They only ever
 * rendered when a caller forgot a prop, which makes a forgotten prop publish
 * marketing copy nobody wrote instead of failing the build.
 */

const Cta10 = ({ heading, description, buttons, className }: Cta10Props) => {
  return (
    <section className={cn("py-12 md:py-16 lg:py-32", className)}>
      <div className="container mx-auto">
        <div className="mx-auto flex w-full flex-col gap-16 overflow-hidden rounded-lg bg-accent p-8 md:rounded-xl lg:flex-row lg:items-center lg:p-12">
          <div className="flex flex-1 flex-col gap-3 md:gap-4 lg:gap-6">
            <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">
              {heading}
            </h2>
            <p className="max-w-xl text-muted-foreground lg:text-lg">
              {description}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
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
            {buttons?.primary && (
              <Button
                size="lg"
                render={<a href={buttons.primary.url} />}
                nativeButton={false}
              >
                {buttons.primary.text}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export { Cta10 }
