"use client"

import { ArrowRight } from "lucide-react"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"
import type { Photo } from "@/components/marketing/images"

interface Button {
  text: string
  url: string
  icon?: React.ReactNode
}
interface Buttons {
  primary?: Button
  secondary?: Button
}
interface Badge {
  text: string
  announcement?: string
  url?: string
}
interface HeroSaasProps {
  className?: string
  heading: string
  description: string
  buttons?: Buttons
  badge?: Badge
}

interface Hero76Props extends HeroSaasProps {
  image: Photo
}

/*
 * The block's English placeholder defaults were removed. They only ever
 * rendered when a caller forgot a prop, which makes a forgotten prop publish
 * marketing copy nobody wrote instead of failing the build.
 */

const Hero76 = ({
  heading,
  description,
  buttons,
  badge,
  image,
  className,
}: Hero76Props) => {
  return (
    <section className={cn("relative bg-background py-20 md:py-28", className)}>
      <div className="relative z-10 container">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative z-10 flex flex-col gap-6 md:gap-8">
            {badge?.text && (
              <Badge
                variant="outline"
                className="w-fit gap-2 rounded-full px-3 py-1 text-xs font-medium"
              >
                {badge.text}
                {badge.announcement && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {badge.announcement}
                    </span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </Badge>
            )}

            <div className="flex max-w-xl flex-col gap-4 md:gap-5">
              <h1 className="text-4xl font-semibold tracking-tight text-pretty text-foreground md:text-5xl lg:text-6xl">
                {heading}
              </h1>
              <p className="text-base text-pretty text-muted-foreground md:text-lg">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {buttons?.primary && (
                <Button
                  className="rounded-full px-6"
                  render={<a href={buttons.primary.url} />}
                  nativeButton={false}
                >
                  {buttons.primary.text}
                </Button>
              )}
              {buttons?.secondary && (
                <Button
                  variant="outline"
                  className="rounded-full px-6"
                  render={<a href={buttons.secondary.url} />}
                  nativeButton={false}
                >
                  {buttons.secondary.text}
                </Button>
              )}
            </div>
          </div>

          <div className="relative z-0 w-full min-w-0">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-y-16 -left-[55%] z-0 w-[calc(55%+12rem)] md:-left-[62%] md:w-[calc(62%+14rem)]"
            >
              <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[14px_14px] opacity-35 md:bg-size-[18px_18px] dark:opacity-[0.12]" />
              <div className="absolute inset-0 bg-linear-to-r from-background from-0% via-background/25 via-22% to-transparent to-58%" />
              <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-background to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-background to-transparent" />
            </div>
            <div className="relative z-10 overflow-hidden rounded-xl border border-border md:rounded-2xl">
              <AspectRatio ratio={16 / 9}>
                <img
                  src={image.src}
                  alt={image.alt}
                  className="size-full object-cover"
                />
              </AspectRatio>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Hero76 }
