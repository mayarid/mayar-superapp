import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

/**
 * @shadcnblocks/faq3 — centered heading and lede above a single-column
 * accordion.
 *
 * Adapted twice. The block declared `supportHeading`, `supportDescription`,
 * `supportButtonText` and `supportButtonUrl` as required props and then never
 * rendered any of them, so every caller was writing copy into a void. And its
 * English placeholder questions were the default for `items`, one forgotten
 * prop away from shipping.
 */

interface Faq3Item {
  id: string
  question: string
  answer: string
}

interface Faq3Props {
  heading: string
  description: string
  items: Faq3Item[]
  className?: string
}

const Faq3 = ({ heading, description, items, className }: Faq3Props) => {
  return (
    <section className={cn("py-24", className)}>
      <div className="container flex flex-col gap-12">
        <div className="mx-auto flex max-w-3xl flex-col text-left md:text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-balance lg:text-4xl">
            {heading}
          </h2>
          <p className="leading-relaxed text-pretty text-muted-foreground lg:text-lg">
            {description}
          </p>
        </div>
        <Accordion multiple={false} className="mx-auto w-full lg:max-w-3xl">
          {items.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="transition-opacity duration-200 hover:no-underline hover:opacity-60">
                <div className="font-medium sm:py-1 lg:py-2 lg:text-lg">
                  {item.question}
                </div>
              </AccordionTrigger>
              <AccordionContent className="sm:mb-1 lg:mb-2">
                <div className="leading-relaxed text-muted-foreground lg:text-lg">
                  {item.answer}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

export { Faq3 }
