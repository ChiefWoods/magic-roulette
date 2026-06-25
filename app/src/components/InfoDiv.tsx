import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function InfoDiv({
  className,
  onClick,
  children,
}: {
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const classes = cn(
    "border border-primary rounded-sm px-1 py-2 flex flex-col gap-2 bg-secondary items-center justify-center",
    className,
  );

  if (onClick) {
    return (
      <button className={classes} onClick={onClick} type="button">
        {children}
      </button>
    );
  }

  return <div className={classes}>{children}</div>;
}
