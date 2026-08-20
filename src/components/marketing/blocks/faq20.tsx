import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

interface Question {
  question: string
  answer: string
}

interface Category {
  title: string
  questions: Question[]
}

interface Faq20Props {
  heading?: string
  description?: string
  contactLinkText?: string
  contactLinkHref?: string
  categories?: Category[]
  className?: string
}

const Faq20 = ({
  heading = "Got Questions?",
  description = "If you can't find what you're looking for,",
  contactLinkText = "get in touch",
  contactLinkHref = "/contact",
  categories = [
    {
      title: "Support",
      questions: [
        {
          question: "How do I update my account settings?",
          answer:
            "You can update your account settings by navigating to the Settings page in your dashboard. From there, you can modify your profile, notification preferences, and security settings.",
        },
        {
          question: "Is support included with all plans?",
          answer:
            "Yes, all plans include access to our support team. Premium plans include priority support with faster response times and dedicated account managers.",
        },
        {
          question: "What are your support hours?",
          answer:
            "Our support team is available Monday through Friday, 9am to 6pm EST. Enterprise customers have access to 24/7 support.",
        },
      ],
    },
    {
      title: "Your account",
      questions: [
        {
          question: "How do I reset my password?",
          answer:
            "Click the 'Forgot Password' link on the login page and enter your email address. You'll receive a password reset link within a few minutes.",
        },
        {
          question: "Can I change my email address?",
          answer:
            "Yes, you can change your email address in your account settings. You'll need to verify the new email address before the change takes effect.",
        },
      ],
    },
    {
      title: "Other questions",
      questions: [
        {
          question: "Do you offer refunds?",
          answer:
            "We offer a 30-day money-back guarantee on all plans. If you're not satisfied, contact our support team for a full refund.",
        },
        {
          question: "Can I upgrade or downgrade my plan?",
          answer:
            "Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at the start of your next billing cycle.",
        },
      ],
    },
  ],
  className,
}: Faq20Props) => {
  return (
    <section className={cn("py-28 lg:py-32", className)}>
      <div className="container max-w-5xl">
        <div className="mx-auto grid gap-16 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl tracking-tight md:text-4xl lg:text-5xl">
              {heading}
            </h2>
            <p className="max-w-md leading-snug text-muted-foreground lg:mx-auto">
              {description}{" "}
              <a
                href={contactLinkHref}
                className="underline underline-offset-4"
              >
                {contactLinkText}
              </a>
              .
            </p>
          </div>

          <div className="grid gap-6 text-start">
            {categories.map((category, categoryIndex) => (
              <div key={category.title}>
                <h3 className="border-b py-4 text-muted-foreground">
                  {category.title}
                </h3>
                <Accordion multiple={false} className="w-full">
                  {category.questions.map((item, i) => (
                    <AccordionItem key={i} value={`${categoryIndex}-${i}`}>
                      <AccordionTrigger>{item.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export { Faq20 }
