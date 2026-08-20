import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

/**
 * @shadcnblocks/faq16 — a centered, narrow FAQ card.
 *
 * Adapted: content moved to props, and the block's `text-6xl` display heading
 * pulled down to the page's own heading scale so it stops out-shouting the
 * hero.
 */

interface Faq16Item {
  question: string
  answer: string
}

interface Faq16Props {
  heading: string
  items: Faq16Item[]
  className?: string
}

const Faq16 = ({ heading, items, className }: Faq16Props) => {
  return (
    <section className={cn("bg-background py-24", className)}>
      <div className="container">
        <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          {heading}
        </h2>
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-background p-3">
          <Accordion
            multiple={false}
            className="flex w-full flex-col gap-3 border-none"
          >
            {items.map((item) => (
              <AccordionItem
                value={item.question}
                key={item.question}
                className="w-full rounded-xl border-b-0 bg-muted px-4 py-2"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

export { Faq16 }
