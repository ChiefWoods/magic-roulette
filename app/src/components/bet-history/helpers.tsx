import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import { BetHistoryRecord } from "./types";

export function SrSpan({ text }: { text: string }) {
  return <span className="sr-only">{text}</span>;
}

export function PaginationButton({
  className = "",
  onClick,
  disabled = false,
  children,
}: {
  className?: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("size-8 cursor-pointer", className)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

export function SortButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button
      variant="ghost"
      className="hover:text-primary flex cursor-pointer items-center gap-2 hover:bg-transparent dark:hover:bg-transparent"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function SortIcon({ column }: { column: Column<BetHistoryRecord, unknown> }) {
  return column.getIsSorted() === "asc" ? (
    <ArrowUp className="size-4" />
  ) : column.getIsSorted() === "desc" ? (
    <ArrowDown className="size-4" />
  ) : (
    <ArrowUpDown className="size-4" />
  );
}
