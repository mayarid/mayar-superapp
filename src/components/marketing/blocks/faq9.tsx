import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

/**
 * @shadcnblocks/faq9 — a bold heading over accordion items on muted panels
 * rather than plain divider lines.
 *
 * Adapted: content moved to props.
 */

interface Faq9Item {
  question: string
  answer: string
}

interface Faq9Props {
  heading: string
  items: Faq9Item[]
  className?: string
}

const Faq9 = ({ heading, items, className }: Faq9Props) => {
  return (
    <section className={cn("py-24", className)}>
      <div className="container">
        <h2 className="mb-10 text-3xl font-semibold tracking-tight text-balance md:text-5xl">
          {heading}
        </h2>
        <Accordion className="border-none">
          {items.map((item) => (
            <AccordionItem
              key={item.question}
              value={item.question}
              className="mb-3 rounded-xl border-b-0 bg-muted px-5 py-2"
            >
              <AccordionTrigger className="text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

export { Faq9 }
