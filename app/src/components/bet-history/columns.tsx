import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { cn, parseLamportsToSol } from "@/lib/utils";

import { SortButton, SortIcon } from "./helpers";
import { BetHistoryRecord } from "./types";

export function useBetHistoryColumns() {
  return useMemo<ColumnDef<BetHistoryRecord>[]>(
    () => [
      {
        accessorKey: "round",
        header: ({ column }) => {
          return (
            <SortButton onClick={() => column.toggleSorting()}>
              <span>Round</span>
              <SortIcon column={column} />
            </SortButton>
          );
        },
        enableSorting: true,
        sortingFn: "alphanumeric",
      },
      {
        accessorKey: "amount",
        header: ({ column }) => {
          return (
            <SortButton onClick={() => column.toggleSorting()}>
              <span>Amount (SOL)</span>
              <SortIcon column={column} />
            </SortButton>
          );
        },
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const amountA = parseFloat(rowA.original.amount);
          const amountB = parseFloat(rowB.original.amount);
          return amountA - amountB;
        },
      },
      {
        accessorKey: "betType",
        header: "Bet Type",
        cell: ({ row }) => {
          const hasWon = row.original.hasWon;

          return (
            <span className={cn(hasWon && "text-yellow-500 font-semibold")}>
              {row.original.betType}
            </span>
          );
        },
      },
      {
        accessorKey: "outcome",
        header: "Outcome",
        cell: ({ row }) => {
          const hasWon = row.original.hasWon;

          return (
            <span className={cn(hasWon && "text-yellow-500 font-semibold")}>
              {row.original.outcome ?? "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "payout",
        header: ({ column }) => {
          return (
            <SortButton onClick={() => column.toggleSorting()}>
              <span>Payout (SOL)</span>
              <SortIcon column={column} />
            </SortButton>
          );
        },
        cell: ({ row }) => {
          const hasWon = row.original.hasWon;
          const payout = row.original.payout;

          return (
            <span className={cn(hasWon && "text-yellow-500 font-semibold")}>
              {payout ? parseLamportsToSol(payout) : "-"}
            </span>
          );
        },
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const payoutA = rowA.original.payout
            ? parseFloat(parseLamportsToSol(rowA.original.payout))
            : 0;
          const payoutB = rowB.original.payout
            ? parseFloat(parseLamportsToSol(rowB.original.payout))
            : 0;
          return payoutA - payoutB;
        },
      },
    ],
    [],
  );
}
