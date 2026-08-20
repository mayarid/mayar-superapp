import { cn } from "@/lib/utils"

/**
 * @shadcnblocks/feature28 — two framed media cards side by side.
 *
 * Adapted: content moved to props, `bg-gray-50` swapped for a semantic muted
 * surface, and the block's "Learn more" anchors dropped. Every destination on
 * these pages is the checkout below, so a second link here would compete with
 * the one action the page is asking for.
 */

interface Feature28Card {
  title: string
  description: string
  image: { src: string; alt: string }
}

interface Feature28Props {
  cards: [Feature28Card, Feature28Card]
  className?: string
}

const Feature28 = ({ cards, className }: Feature28Props) => {
  return (
    <section className={cn("bg-muted/40 py-24", className)}>
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
          {cards.map((card) => (
            <div key={card.title}>
              <div className="rounded-2xl border bg-muted p-4 md:p-6">
                <img
                  src={card.image.src}
                  alt={card.image.alt}
                  width={800}
                  height={450}
                  loading="lazy"
                  className="aspect-video max-h-[500px] w-full rounded-lg object-cover"
                />
              </div>
              <div className="p-6">
                <p className="mb-2 font-semibold">{card.title}</p>
                <p className="leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { Feature28 }
