import { CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ComponentType } from "react"

/**
 * @shadcnblocks/feature118 — a bento row of one wide card and one list card,
 * closed by a band of figures.
 *
 * Adapted: content moved to props, and the block's five-star rating removed.
 * This app has no reviews, and a fabricated rating is the one thing on a
 * marketing page that cannot be walked back.
 */

interface Feature118Props {
  heading: string
  description?: string
  wide: {
    icon: ComponentType<{ className?: string }>
    title: string
    body: string
    image: { src: string; alt: string }
  }
  list: {
    icon: ComponentType<{ className?: string }>
    title: string
    items: string[]
  }
  figures?: { value: string; label: string }[]
  className?: string
}

const Feature118 = ({
  heading,
  description,
  wide,
  list,
  figures,
  className,
}: Feature118Props) => {
  const WideIcon = wide.icon
  const ListIcon = list.icon

  return (
    <section className={cn("bg-muted/60 py-24", className)}>
      <div className="container">
        <div className="flex flex-col gap-10">
          <div className="mx-auto flex max-w-xl flex-col gap-3 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              {heading}
            </h2>
            {description && (
              <p className="leading-relaxed text-pretty text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-3 lg:gap-6">
            <div className="grid gap-7 rounded-2xl bg-background p-7 md:grid-cols-2 lg:col-span-2">
              <div className="flex h-full flex-col justify-between gap-3">
                <div>
                  <span className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <WideIcon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-balance lg:text-2xl">
                    {wide.title}
                  </h3>
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  {wide.body}
                </p>
              </div>
              <img
                src={wide.image.src}
                alt={wide.image.alt}
                width={800}
                height={450}
                loading="lazy"
                className="aspect-video h-full w-full rounded-xl object-cover md:aspect-auto"
              />
            </div>

            <div className="rounded-2xl bg-background p-7">
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <span className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <ListIcon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-balance lg:text-2xl">
                    {list.title}
                  </h3>
                </div>
                <ul className="flex flex-col gap-4 text-sm">
                  {list.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="size-4 shrink-0 translate-y-0.5 text-muted-foreground" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {figures && figures.length > 0 && (
            <dl className="grid items-center gap-8 rounded-2xl bg-background p-7 md:p-10 lg:grid-cols-3">
              {figures.map((figure) => (
                <div key={figure.label} className="flex items-center gap-5">
                  <dt className="sr-only">{figure.label}</dt>
                  <dd className="flex items-center gap-5">
                    <span className="text-4xl font-semibold tabular-nums md:text-5xl">
                      {figure.value}
                    </span>
                    <p className="leading-relaxed text-muted-foreground">
                      {figure.label}
                    </p>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  )
}

export { Feature118 }
