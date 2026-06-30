import type { ReactNode } from "react";
import { heroSectionClass, pageMainClass } from "@/lib/ks-page-styles";
import { BackPreviousRouteButton } from "@/components/BackPreviousRouteButton";
import { useLocation } from "@tanstack/react-router";


type AuthPageLayoutProps = {
  username?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  showBackButton?: boolean;
};

export function AuthPageLayout({
  username,
  title,
  subtitle,
  children,
  showBackButton = false,
}: AuthPageLayoutProps) {
  const {pathname} = useLocation();
  const fallbackRoute = pathname === "/home" ? "/" : "/home";
  return (
    <main className={pageMainClass}>
      {showBackButton && <BackPreviousRouteButton fallbackRoute={fallbackRoute} />}
      <section className={heroSectionClass}>
        {username && (<p className="text-white/72 text-[15px] font-light">Hola {username} 👋</p>)}
        <h1 className="relative m-0 mb-2 font-outfit text-[38px] font-bold tracking-[-1px] text-white max-sm:text-[28px]">
          {title}
        </h1>
        <p className="relative text-[15px] font-light text-white/72">{subtitle}</p>
      </section>
      {children}
    </main>
  );
}
