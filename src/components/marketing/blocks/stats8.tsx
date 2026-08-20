import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * @shadcnblocks/stats8 — a heading and lede above a row of large figures.
 *
 * Adapted: the placeholder defaults are gone. A block that silently falls back
 * to "250%+ average growth" and a "Read the full impact report" link is one
 * forgotten prop away from publishing a claim nobody wrote. Everything is
 * required now, except the link, which renders only when it is given.
 */

interface Stats8Props {
  heading: string
  description?: string
  link?: { text: string; url: string }
  stats: { id: string; value: string; label: string }[]
  className?: string
}

const Stats8 = ({
  heading,
  description,
  link,
  stats,
  className,
}: Stats8Props) => {
  return (
    <section className={cn("py-24", className)}>
      <div className="container">
        <div className="flex max-w-[62ch] flex-col gap-4">
          <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            {heading}
          </h2>
          {description && (
            <p className="leading-relaxed text-pretty text-muted-foreground">
              {description}
            </p>
          )}
          {link && (
            <a
              href={link.url}
              className="flex w-fit items-center gap-1 font-medium hover:underline"
            >
              {link.text}
              <ArrowRight className="size-4" />
            </a>
          )}
        </div>
        <dl className="mt-12 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.id} className="flex flex-col gap-3">
              <dd className="text-5xl font-semibold tracking-tight tabular-nums">
                {stat.value}
              </dd>
              <dt className="leading-relaxed text-muted-foreground">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export { Stats8 }
