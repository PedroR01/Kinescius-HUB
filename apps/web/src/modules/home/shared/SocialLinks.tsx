import { cn } from "@/lib/utils";
import { SOCIAL_LINKS } from "../data/contact";
import { FacebookIcon, InstagramIcon, LinkedInIcon } from "./SocialIcons";

const ICONS = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  linkedin: LinkedInIcon
} as const;

interface SocialLinksProps {
  className?: string;
  iconSize?: "sm" | "md";
}

export function SocialLinks({ className, iconSize = "md" }: SocialLinksProps) {
  const sizeClass = iconSize === "sm" ? "h-8 w-8" : "h-9 w-9";
  const iconClass = iconSize === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {SOCIAL_LINKS.map((social) => {
        const Icon = ICONS[social.network];
        return (
          <a
            key={social.network}
            href={social.href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={social.label}
            className={cn(
              "inline-flex items-center justify-center rounded-full bg-main/10 text-main transition-colors hover:bg-main hover:text-white",
              sizeClass
            )}
          >
            <Icon className={iconClass} />
          </a>
        );
      })}
    </div>
  );
}
