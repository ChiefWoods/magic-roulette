import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Button } from "./ui/button";

export function BigRoundedButton({
  className,
  disabled = false,
  onClick,
  children,
}: {
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}) {
  return (
    <Button
      className={cn("cursor-pointer rounded-full", className)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
