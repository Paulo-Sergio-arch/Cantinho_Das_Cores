import { cva } from "class-variance-authority";
import { motion } from "motion/react";
import { cn } from "../../lib/cn";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-display font-semibold select-none",
    "transition-[transform,box-shadow,background-color,border-color,color] duration-150",
    "focus-visible:outline-3 focus-visible:outline-brand focus-visible:outline-offset-2",
    "disabled:opacity-55 disabled:pointer-events-none",
    "alto-contraste:border-2 alto-contraste:border-slate-950 alto-contraste:shadow-none",
  ],
  {
    variants: {
      variant: {
        // Botão tátil 3D para ações principais e área infantil
        playful:
          "bg-brand text-white shadow-[0_4px_0_#1E54AD] hover:bg-[#2863C4] active:translate-y-[2px] active:shadow-[0_2px_0_#1E54AD] alto-contraste:bg-[#0F4CC0] alto-contraste:text-white",
        secondary:
          "bg-warn text-ink shadow-[0_4px_0_#BA8C1D] hover:brightness-[1.03] active:translate-y-[2px] active:shadow-[0_2px_0_#BA8C1D] alto-contraste:bg-[#FFD029] alto-contraste:text-slate-950",
        success:
          "bg-success text-white shadow-[0_4px_0_#1F683F] hover:brightness-[1.04] active:translate-y-[2px] active:shadow-[0_2px_0_#1F683F] alto-contraste:bg-[#116B38] alto-contraste:text-white",
        // Botões limpos estilo shadcn/ui para área institucional e controles
        institutional:
          "bg-brand text-white shadow-xs hover:bg-brand-deep active:scale-[0.99] alto-contraste:bg-[#0F4CC0] alto-contraste:text-white",
        outline:
          "bg-surface text-ink border border-surface-border-strong shadow-[0_2px_0_#DDD6C6] hover:bg-surface-muted/60 active:translate-y-[1px] active:shadow-none alto-contraste:bg-white alto-contraste:text-slate-950",
        outlineInst:
          "bg-inst-surface text-ink border border-inst-border-strong shadow-2xs hover:bg-inst-subtle alto-contraste:bg-white alto-contraste:text-slate-950",
        ghost:
          "bg-transparent text-ink hover:bg-surface-muted/70 alto-contraste:text-slate-950 alto-contraste:hover:bg-slate-100",
        danger:
          "bg-danger text-white shadow-[0_3px_0_#962B28] hover:bg-danger-deep active:translate-y-[1px] alto-contraste:bg-[#991B1B] alto-contraste:text-white",
        dangerSoft:
          "bg-danger-soft text-danger border border-red-200 hover:bg-red-100 alto-contraste:bg-white alto-contraste:text-[#991B1B]",
      },
      size: {
        sm: "min-h-10 px-3.5 py-2 text-sm rounded-xl",
        md: "min-h-11 px-4 py-2.5 text-[0.95rem] rounded-2xl",
        lg: "min-h-13 px-6 py-3 text-lg rounded-2xl",
        icon: "h-11 w-11 rounded-xl p-0",
      },
    },
    defaultVariants: {
      variant: "playful",
      size: "md",
    },
  }
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  children,
  ...props
}) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}
