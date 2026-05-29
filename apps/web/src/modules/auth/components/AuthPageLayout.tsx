import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  btnBase,
  btnSecondary,
  formCardClass,
  heroSectionClass,
  pageMainClass
} from "@/lib/ks-page-styles";
import { ArrowLeftIcon, CircleChevronLeftIcon } from "lucide-react";

type AuthPageLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthPageLayout({ title, subtitle, children }: AuthPageLayoutProps) {
  return (
    <main className={pageMainClass}>
      <Link
        to="/"
        className="size-fit p-4  rounded-full transition-all duration-300 hover:bg-ks-gray-soft text-ks-green-dark"
      >
        <ArrowLeftIcon className="size-6 " />
      </Link>
      <section className={heroSectionClass}>
        <h1 className="relative m-0 mb-2 font-outfit text-[38px] font-bold tracking-[-1px] text-white max-sm:text-[28px]">
          {title}
        </h1>
        <p className="relative text-[15px] font-light text-white/72">{subtitle}</p>
      </section>
      {children}
    </main>
  );
}
