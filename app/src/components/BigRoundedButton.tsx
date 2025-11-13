import { ReactNode } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

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
