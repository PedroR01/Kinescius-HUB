import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPreviousRoutePath } from "@/lib/navigation-history";

type BackPreviousRouteButtonProps = {
  fallbackRoute?: string;
  className?: string;
};

export function resolvePreviousRoutePath(fallbackRoute = "/home"): string {
  if (fallbackRoute === "/" ){
    return "/";
  }
  return getPreviousRoutePath(fallbackRoute);
}

export function BackPreviousRouteButton({
  fallbackRoute = "/home",
  className,
}: BackPreviousRouteButtonProps) {
  const targetRoute = resolvePreviousRoutePath(fallbackRoute);

  return (
    <Link
      to={targetRoute}
      className={cn(
        "size-fit rounded-full p-4 text-ks-green-dark transition-all duration-300 hover:bg-ks-gray-soft",
        className
      )}
    >
      <ArrowLeftIcon className="size-6" />
    </Link>
  );
}
