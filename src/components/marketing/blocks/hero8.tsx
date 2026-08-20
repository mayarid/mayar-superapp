import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Image {
  src: string
  alt: string
  srcDark?: string
}
interface Button {
  text: string
  url: string
  icon?: React.ReactNode
}
interface Buttons {
  primary?: Button
  secondary?: Button
}

interface HeroBasicProps {
  heading: string
  description: string
  buttons?: Buttons
  image: Image
  className?: string
}

interface Hero8Props extends HeroBasicProps {}

/*
 * The block's English placeholder defaults were removed. They only ever
 * rendered when a caller forgot a prop, which makes a forgotten prop publish
 * marketing copy nobody wrote instead of failing the build.
 */

const Hero8 = ({
  heading,
  description,
  buttons,
  image,
  className,
}: Hero8Props) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="overflow-hidden border-b border-border">
        <div className="container mx-auto">
          <div className="mx-auto flex max-w-5xl flex-col items-center">
            <div className="flex flex-col items-center gap-6 text-center">
              <h1 className="mx-auto max-w-xl text-4xl font-semibold tracking-tight text-pretty md:text-5xl lg:max-w-3xl lg:text-6xl">
                {heading}
              </h1>
              <p className="mx-auto max-w-5xl text-lg text-balance text-muted-foreground md:text-xl">
                {description}
              </p>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                {buttons?.primary && (
                  <Button
                    className="w-full sm:w-auto"
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
                    className="w-full sm:w-auto"
                    render={<a href={buttons.secondary.url} />}
                    nativeButton={false}
                  >
                    {buttons.secondary.text}
                  </Button>
                )}
              </div>
            </div>
          </div>
          {image.srcDark ? (
            <>
              <img
                src={image.src}
                alt={image.alt}
                className="mx-auto mt-16 aspect-3/4 w-full rounded-t-lg border-x border-t border-border object-cover object-top-left shadow-[0_10px_36px_-10px_rgb(0_0_0/0.08),inset_0_-24px_48px_-24px_rgb(0_0_0/0.05)] md:aspect-video md:object-top dark:hidden"
              />
              <img
                src={image.srcDark}
                alt={image.alt}
                className="mx-auto mt-16 hidden aspect-3/4 w-full rounded-t-lg border-x border-t border-border object-cover object-top-left shadow-[0_10px_36px_-10px_rgb(0_0_0/0.22),inset_0_-24px_48px_-24px_rgb(0_0_0/0.14)] md:aspect-video md:object-top dark:block"
              />
            </>
          ) : (
            <img
              src={image.src}
              alt={image.alt}
              className="mx-auto mt-16 aspect-3/4 w-full rounded-t-lg border-x border-t border-border object-cover object-top-left shadow-[0_10px_36px_-10px_rgb(0_0_0/0.08),inset_0_-24px_48px_-24px_rgb(0_0_0/0.05)] md:aspect-video md:object-top dark:shadow-[0_10px_36px_-10px_rgb(0_0_0/0.22),inset_0_-24px_48px_-24px_rgb(0_0_0/0.14)]"
            />
          )}
        </div>
      </div>
    </section>
  )
}

export { Hero8 }
