import { Link } from "@tanstack/react-router"
import {
  CalendarSyncIcon,
  CoinsIcon,
  KeyRoundIcon,
  MenuIcon,
  PackageIcon,
  QrCodeIcon,
  ReceiptTextIcon,
  SplitIcon,
  ZapIcon,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { MODELS } from "@/lib/catalog"
import { HREF } from "@/lib/marketing"
import type { BillingModel } from "@/lib/catalog"
import type { ComponentType } from "react"

/**
 * The nav shared by the index and all eight landing pages.
 *
 * Adapted from @shadcnblocks/navbar1 — same composition, a NavigationMenu on
 * wide screens and a Sheet with an accordion on narrow ones — but every
 * internal destination goes through the router's Link instead of a bare anchor,
 * so moving between models stays a client navigation and keeps the router's
 * intent preloading.
 */

const ICON: Record<BillingModel, ComponentType<{ className?: string }>> = {
  "sekali-bayar": ZapIcon,
  fulfillment: PackageIcon,
  invoice: ReceiptTextIcon,
  membership: CalendarSyncIcon,
  kredit: CoinsIcon,
  saas: KeyRoundIcon,
  qris: QrCodeIcon,
  cicilan: SplitIcon,
}

export function SiteHeader({ cta }: { cta?: { label: string; href: string } }) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 py-3 backdrop-blur-md">
      <div className="container">
        <nav className="hidden items-center justify-between lg:flex">
          <div className="flex items-center gap-6">
            <Wordmark />
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Model billing</NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-popover text-popover-foreground">
                    <ul className="grid w-[36rem] grid-cols-2 gap-1 p-2">
                      {MODELS.map((product) => (
                        <li key={product.model}>
                          <NavigationMenuLink
                            render={<ModelLink model={product.model} />}
                          />
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    render={
                      <Link
                        to="/"
                        className="inline-flex h-10 w-max items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                      >
                        Semua model
                      </Link>
                    }
                  />
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          {cta ? (
            <Button
              size="sm"
              render={<a href={cta.href} />}
              nativeButton={false}
            >
              {cta.label}
            </Button>
          ) : null}
        </nav>

        <div className="flex items-center justify-between lg:hidden">
          <Wordmark />
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" aria-label="Buka menu" />
              }
            >
              <MenuIcon />
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Model billing</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 p-4">
                <Accordion multiple={false} className="w-full">
                  <AccordionItem value="models">
                    <AccordionTrigger>Delapan cara menagih</AccordionTrigger>
                    <AccordionContent>
                      <ul className="flex flex-col gap-1">
                        {MODELS.map((product) => (
                          <li key={product.model}>
                            <ModelLink model={product.model} />
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    render={<Link to="/" />}
                    nativeButton={false}
                  >
                    Semua model
                  </Button>
                  {cta ? (
                    <Button render={<a href={cta.href} />} nativeButton={false}>
                      {cta.label}
                    </Button>
                  ) : null}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <QrCodeIcon className="size-4" />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        Mayar Superapp
      </span>
    </Link>
  )
}

/**
 * One row in the model menu. Kept as its own component because the desktop
 * NavigationMenuLink renders it through `render` while the mobile sheet renders
 * it directly, and both need the same markup.
 */
function ModelLink({
  model,
  className,
  ...props
}: {
  model: BillingModel
  className?: string
}) {
  const product = MODELS.find((item) => item.model === model)!
  const Icon = ICON[model]

  return (
    <Link
      {...props}
      to={HREF[model]}
      className="flex flex-row gap-3 rounded-md p-3 leading-none transition-colors hover:bg-muted"
    >
      <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold">{product.label}</span>
        <span className="text-sm leading-snug text-muted-foreground">
          {product.tagline}
        </span>
      </div>
    </Link>
  )
}
