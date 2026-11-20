import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DetailSectionProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DetailSection({
  title,
  action,
  children,
  className,
}: DetailSectionProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 border-b border-line-strong p-5 last:border-b-0",
        className,
      )}
    >
      {action ? (
        <div className="flex h-[30px] items-center justify-between gap-2">
          <h4 className="eyebrow-style font-normal text-subtle">{title}</h4>
          {action}
        </div>
      ) : (
        <h4 className="eyebrow-style font-normal text-subtle">{title}</h4>
      )}
      {children}
    </section>
  );
}
