import type { ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "inverse" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const BUTTON_VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: [
    "bg-main text-white border border-transparent",
    "hover:bg-dark-accent",
    "shadow-[0_4px_16px_rgba(18,156,108,0.35)]",
    "hover:shadow-[0_6px_22px_rgba(18,156,108,0.5)]"
  ].join(" "),

  secondary: [
    "bg-transparent text-main border border-accent-border",
    "hover:bg-main/10",
    "shadow-[0_2px_8px_rgba(18,156,108,0.1)]",
    "hover:shadow-[0_4px_14px_rgba(18,156,108,0.2)]"
  ].join(" "),

  inverse: [
    "bg-white text-main border border-transparent",
    "hover:bg-white/90",
    "shadow-[0_4px_16px_rgba(0,0,0,0.12)]",
    "hover:shadow-[0_6px_22px_rgba(0,0,0,0.18)]"
  ].join(" "),

  destructive: [
    "bg-red-600 text-white border border-transparent",
    "hover:bg-red-700",
    "shadow-[0_4px_16px_rgba(220,38,38,0.35)]",
    "hover:shadow-[0_6px_22px_rgba(220,38,38,0.5)]"
  ].join(" ")
};

export const BUTTON_SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm gap-1.5",
  md: "px-6 py-3 text-base gap-2",
  lg: "px-8 py-4 text-lg gap-2.5"
};

export const BUTTON_BASE_STYLES = [
  "relative inline-flex items-center justify-center",
  "font-medium tracking-wide cursor-pointer select-none rounded-full",
  "transition-colors duration-200",
  "outline-none focus-visible:ring-2 focus-visible:ring-main/60 focus-visible:ring-offset-2",
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
].join(" ");

const SPRING = { type: "spring", stiffness: 420, damping: 18 } as const;

function getButtonClassName(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn(
    BUTTON_BASE_STYLES,
    BUTTON_VARIANT_STYLES[variant],
    BUTTON_SIZE_STYLES[size],
    className
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const isInteractive = !disabled;

  return (
    <motion.button
      className={getButtonClassName(variant, size, className)}
      whileHover={isInteractive ? { scale: 1.03 } : undefined}
      whileTap={isInteractive ? { scale: 0.96 } : undefined}
      transition={SPRING}
      disabled={disabled}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export interface ButtonLinkProps extends Omit<LinkProps, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <motion.span
      className="inline-flex"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={SPRING}
    >
      <Link className={getButtonClassName(variant, size, className)} {...rest}>
        {children}
      </Link>
    </motion.span>
  );
}

export interface AnchorButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function AnchorButton({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: AnchorButtonProps) {
  return (
    <motion.span
      className="inline-flex"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={SPRING}
    >
      <a className={getButtonClassName(variant, size, className)} href={href} {...rest}>
        {children}
      </a>
    </motion.span>
  );
}
