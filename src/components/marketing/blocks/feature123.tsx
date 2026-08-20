import { cn } from "@/lib/utils"

/**
 * @shadcnblocks/feature123 — heading beside a stack of accent-striped rows.
 *
 * Adapted: content moved from module constants to props, and the row accent
 * moved off `from-blue-500 to-purple-500` onto the theme's primary so it
 * follows the palette instead of fighting it.
 */

interface Feature123Item {
  title: string
  description: string
}

interface Feature123Props {
  eyebrow?: string
  heading: string
  description?: string
  items: Feature123Item[]
  className?: string
}

const Feature123 = ({
  eyebrow,
  heading,
  description,
  items,
  className,
}: Feature123Props) => {
  return (
    <section
      className={cn(
        "container flex flex-col gap-16 py-24 lg:flex-row",
        className
      )}
    >
      <div className="w-full max-w-[400px]">
        {eyebrow && (
          <span className="text-sm tracking-wider text-muted-foreground uppercase">
            {eyebrow}
          </span>
        )}
        <h2 className="mt-4 mb-6 text-3xl font-semibold tracking-tight text-balance">
          {heading}
        </h2>
        {description && (
          <p className="text-lg leading-relaxed text-pretty text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-10 lg:gap-14">
        {items.map((item) => (
          <div className="relative pl-5" key={item.title}>
            <div className="absolute top-0 left-0 h-full w-1 rounded-full bg-linear-to-b from-primary to-primary/20" />
            <p className="mb-2 text-xl font-medium">{item.title}</p>
            <p className="leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export { Feature123 }
