import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { btnBase, btnPrimary, formCardClass } from "@/lib/ks-page-styles";
import type { DashboardAction } from "../data/dashboardActions";

type DashboardActionListProps = {
  actions: DashboardAction[];
};

export function DashboardActionList({ actions }: DashboardActionListProps) {
  return (
    <section className={formCardClass}>
      <p className="m-0 mb-4 font-outfit text-[11px] font-bold tracking-[1.5px] text-ks-gray-text">
        FUNCIONALIDADES DISPONIBLES
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Link key={action.to} to={action.to} className="no-underline">
            <span className={cn(btnBase, btnPrimary, "flex w-full flex-col items-center gap-1")}>
              {action.label}
              {action.description && (
                <span className="text-xs font-normal opacity-90">{action.description}</span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
