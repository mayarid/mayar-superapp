import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

/**
 * @shadcnblocks/pricing6 — one plan card with its features in separated groups.
 *
 * Adapted twice over. The block hardcoded a `$` beside the figure and stripped
 * one off the price string, which cannot render Rupiah — the price now arrives
 * already formatted and is printed as given. And its CTA opened in a new tab,
 * which is wrong for a link that only scrolls down the same page.
 */

interface Pricing6Props {
  heading: string
  description: string
  /** Already formatted, including the currency. */
  price: string
  /** Shown small beside the figure, e.g. "sekali bayar". */
  priceNote?: string
  featureGroups: string[][]
  button: { text: string; url: string }
  className?: string
}

const Pricing6 = ({
  heading,
  description,
  price,
  priceNote,
  featureGroups,
  button,
  className,
}: Pricing6Props) => {
  return (
    <section className={cn("py-24", className)}>
      <div className="container">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-pretty lg:text-4xl">
            {heading}
          </h2>
          <p className="max-w-[52ch] leading-relaxed text-pretty text-muted-foreground lg:text-lg">
            {description}
          </p>
          <div className="mx-auto mt-4 flex w-full flex-col rounded-2xl border p-6 sm:w-fit sm:min-w-100">
            <div className="flex items-end justify-center gap-2">
              <span className="text-5xl font-medium tracking-tight tabular-nums lg:text-6xl">
                {price}
              </span>
              {priceNote && (
                <span className="pb-2 text-sm text-muted-foreground">
                  {priceNote}
                </span>
              )}
            </div>
            <div className="my-6">
              {featureGroups.map((group, index) => (
                <div key={group.join("|")}>
                  <ul className="flex flex-col gap-3">
                    {group.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center justify-between gap-2 text-left text-sm font-medium"
                      >
                        {feature}
                        <Check className="inline size-4 shrink-0 text-muted-foreground" />
                      </li>
                    ))}
                  </ul>
                  {index < featureGroups.length - 1 && (
                    <Separator className="my-6" />
                  )}
                </div>
              ))}
            </div>
            <Button render={<a href={button.url} />} nativeButton={false}>
              {button.text}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Pricing6 }
