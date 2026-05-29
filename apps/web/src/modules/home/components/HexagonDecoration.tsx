import { cn } from "@/lib/utils";

interface HexagonDecorationProps {
  className?: string;
}

export function HexagonDecoration({ className }: HexagonDecorationProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <svg
        viewBox="0 0 400 400"
        className="absolute -right-8 top-4 h-48 w-48 text-main/15 sm:-right-4 sm:top-8 sm:h-64 sm:w-64 lg:h-80 lg:w-80"
      >
        <polygon
          points="200,20 360,110 360,290 200,380 40,290 40,110"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <svg
        viewBox="0 0 400 400"
        className="absolute right-16 top-24 h-32 w-32 text-light-accent/25 sm:right-28 sm:top-32 sm:h-44 sm:w-44 lg:h-56 lg:w-56"
      >
        <polygon
          points="200,20 360,110 360,290 200,380 40,290 40,110"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <svg
        viewBox="0 0 400 400"
        className="absolute -right-4 bottom-8 h-36 w-36 text-main/10 sm:bottom-16 sm:h-48 sm:w-48"
      >
        <polygon
          points="200,20 360,110 360,290 200,380 40,290 40,110"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}
