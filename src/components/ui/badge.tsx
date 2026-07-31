import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        success: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25",
        kbank: "border-transparent bg-[#138F2D]/15 text-[#138F2D] dark:bg-[#138F2D]/20 dark:text-[#2dd153] hover:bg-[#138F2D]/25",
        scb: "border-transparent bg-[#4E2A81]/15 text-[#4E2A81] dark:bg-[#4E2A81]/30 dark:text-[#a074e8] hover:bg-[#4E2A81]/25",
        ktb: "border-transparent bg-[#1DB2E9]/15 text-[#1DB2E9] dark:bg-[#1DB2E9]/20 dark:text-[#52caff] hover:bg-[#1DB2E9]/25",
        ttb: "border-transparent bg-[#005087]/15 text-[#005087] dark:bg-[#005087]/30 dark:text-[#42a8f5] hover:bg-[#005087]/25",
        truemoney: "border-transparent bg-[#FF8200]/15 text-[#FF8200] dark:bg-[#FF8200]/20 dark:text-[#ffb15c] hover:bg-[#FF8200]/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
