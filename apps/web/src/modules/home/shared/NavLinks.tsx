import { cn } from "@/lib/utils";
import type { NavLinkItem } from "../data/navLinks";

interface NavLinksProps {
  links: NavLinkItem[];
  className?: string;
  onNavigate?: () => void;
  orientation?: "horizontal" | "vertical";
}

export function NavLinks({
  links,
  className,
  onNavigate,
  orientation = "horizontal"
}: NavLinksProps) {
  return (
    <nav
      className={cn(
        orientation === "horizontal"
          ? "flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:gap-x-7"
          : "flex flex-col gap-3",
        className
      )}
      aria-label="Navegación principal"
    >
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          className="text-sm font-medium  transition-colors hover:text-main sm:text-[0.95rem]"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
