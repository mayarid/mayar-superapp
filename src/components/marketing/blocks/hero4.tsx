import { ArrowRight, Star } from "lucide-react"

import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Image {
  src: string
  alt: string
  srcDark?: string
}
interface Button {
  text: string
  url: string
  icon?: React.ReactNode
}
interface Buttons {
  primary?: Button
  secondary?: Button
}

interface HeroBasicProps {
  heading: string
  description: string
  buttons?: Buttons
  image: Image
  className?: string
}

interface Hero4Props extends HeroBasicProps {
  reviews?: Hero4Reviews
}

/*
 * The block's English placeholder defaults were removed. They only ever
 * rendered when a caller forgot a prop, which makes a forgotten prop publish
 * marketing copy nobody wrote instead of failing the build.
 */

const MAX_REVIEW_AVATARS = 5

interface Hero4Reviews {
  count: number
  rating: number
  avatars: { src: string; alt: string }[]
}

const Hero4 = ({
  heading,
  description,
  buttons,
  reviews,
  image,
  className,
}: Hero4Props) => {
  const reviewAvatars = (reviews?.avatars ?? []).slice(0, MAX_REVIEW_AVATARS)

  return (
    <section className={cn("py-32", className)}>
      <div className="container mx-auto">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="flex w-full lg:order-1">
            {image.srcDark ? (
              <>
                <img
                  src={image.src}
                  alt={image.alt}
                  className="aspect-video max-h-[600px] w-full rounded-md border border-border object-cover object-top lg:max-h-[800px] dark:hidden"
                />
                <img
                  src={image.srcDark}
                  alt={image.alt}
                  className="hidden aspect-video max-h-[600px] w-full rounded-md border border-border object-cover object-top lg:max-h-[800px] dark:block"
                />
              </>
            ) : (
              <img
                src={image.src}
                alt={image.alt}
                className="aspect-video max-h-[600px] w-full rounded-md border border-border object-cover object-top lg:max-h-[800px]"
              />
            )}
          </div>
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center md:mr-auto lg:order-2 lg:items-start lg:text-left">
            <h1 className="max-w-xl text-4xl font-bold tracking-tight text-pretty lg:max-w-3xl lg:text-6xl xl:text-7xl">
              {heading}
            </h1>
            <p className="max-w-5xl text-balance text-muted-foreground lg:text-xl">
              {description}
            </p>
            {reviews && (
              <div className="flex w-fit flex-col items-center gap-4 sm:flex-row">
                <span className="inline-flex items-center -space-x-3">
                  {reviewAvatars.map((avatar, index) => (
                    <Avatar
                      key={index}
                      className="size-10 bg-background ring-2 ring-background after:hidden"
                    >
                      <AvatarImage src={avatar.src} alt={avatar.alt} />
                    </Avatar>
                  ))}
                </span>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        className="size-5 fill-none stroke-amber-500 dark:stroke-amber-400"
                      />
                    ))}
                    <span className="ml-1 font-semibold text-foreground">
                      {reviews.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-left font-medium text-muted-foreground">
                    from {reviews.count}+ reviews
                  </p>
                </div>
              </div>
            )}
            <div className="flex w-full flex-col justify-center gap-2 sm:flex-row lg:justify-start">
              {buttons?.primary && (
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  render={<a href={buttons.primary.url} />}
                  nativeButton={false}
                >
                  {buttons.primary.text}
                  <ArrowRight data-icon="inline-end" />
                </Button>
              )}
              {buttons?.secondary && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full bg-background sm:w-auto"
                  render={<a href={buttons.secondary.url} />}
                  nativeButton={false}
                >
                  {buttons.secondary.text}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Hero4 }
