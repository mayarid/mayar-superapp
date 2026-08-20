import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

/**
 * @shadcnblocks/faq7 — a two-column FAQ, heading and lede beside the accordion.
 *
 * Adapted: content moved to props, and the block's "View all FAQs" button and
 * support link removed. Neither has anywhere to go in this app, and a link that
 * goes nowhere is worse than no link.
 */

interface Faq7Item {
  question: string
  answer: string
}

interface Faq7Props {
  heading: string
  headingMuted?: string
  description: string
  items: Faq7Item[]
  className?: string
}

const Faq7 = ({
  heading,
  headingMuted,
  description,
  items,
  className,
}: Faq7Props) => {
  return (
    <section className={cn("py-24", className)}>
      <div className="container">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {heading}
              {headingMuted && (
                <>
                  <br />
                  <span className="text-muted-foreground/70">
                    {headingMuted}
                  </span>
                </>
              )}
            </h2>
            <p className="max-w-[52ch] leading-relaxed text-pretty text-muted-foreground md:text-lg">
              {description}
            </p>
          </div>
          <Accordion>
            {items.map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

export { Faq7 }
