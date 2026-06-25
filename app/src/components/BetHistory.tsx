"use client";

import { useConnection, useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { createClaimWinningsInstruction } from "@magic-roulette/sdk";
import { formatBetType, isWinner, payoutMultiplier } from "@magic-roulette/sdk/bet";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronsRight,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  Gem,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { sendTx } from "@/lib/api";
import { buildTx } from "@/lib/client/solana";
import { cn, parseLamportsToSol } from "@/lib/utils";
import { useBets } from "@/providers/BetsProvider";
import { useRounds } from "@/providers/RoundsProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useTransaction } from "@/providers/TransactionProvider";
import { parseBigInt } from "@/types/parse";

import { EmptyWallet } from "./EmptyWallet";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Skeleton } from "./ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type BetHistoryRecord = {
  publicKey: string;
  round: string;
  amount: string;
  betType: string;
  outcome: number;
  hasWon: boolean;
  claimable: boolean;
  payout: string;
};

enum FilterValue {
  All = "all",
  Won = "won",
  Lost = "lost",
  Claimable = "claimable",
}

const filterOptions: { value: FilterValue; label: string }[] = [
  { value: FilterValue.All, label: "All" },
  { value: FilterValue.Won, label: "Won" },
  { value: FilterValue.Lost, label: "Lost" },
  { value: FilterValue.Claimable, label: "Claimable" },
];

function SrSpan({ text }: { text: string }) {
  return <span className="sr-only">{text}</span>;
}

function PaginationButton({
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

function SortButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
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

function SortIcon({ column }: { column: Column<BetHistoryRecord, unknown> }) {
  return column.getIsSorted() === "asc" ? (
    <ArrowUp className="size-4" />
  ) : column.getIsSorted() === "desc" ? (
    <ArrowDown className="size-4" />
  ) : (
    <ArrowUpDown className="size-4" />
  );
}

export function BetHistory() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useUnifiedWallet();
  const { roundsData } = useRounds();
  const { betsData, betsLoading, betsMutate } = useBets();
  const { getAccountLink, priorityFee } = useSettings();
  const { isSendingTransaction, setIsSendingTransaction, showTransactionToast } = useTransaction();
  const [filter, setFilter] = useState<FilterValue>(FilterValue.All);
  const [sorting, setSorting] = useState<SortingState>([{ id: "round", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const claimableBets = useMemo(() => {
    if (!betsData || !roundsData) return [];

    return betsData.filter((bet) => {
      const matchingRound = roundsData.find((round) => round.address === bet.data.round);

      if (!matchingRound) {
        return false;
      }

      return isWinner(bet.data.betType, matchingRound.data.outcome) && !bet.data.isClaimed;
    });
  }, [betsData, roundsData]);

  const claimableAmount = useMemo(() => {
    return claimableBets.reduce((amount, bet) => amount + BigInt(bet.data.amount), 0n);
  }, [claimableBets]);

  const netPnL = useMemo(() => {
    if (!betsData || !roundsData) return 0n;

    return betsData.reduce((total, bet) => {
      const matchingRound = roundsData.find((round) => round.address === bet.data.round);

      if (!matchingRound) {
        return total;
      }

      // exclude bets pending outcome
      if (matchingRound.data.outcome === null) {
        return total;
      }

      if (isWinner(bet.data.betType, matchingRound.data.outcome)) {
        const payout = BigInt(bet.data.amount) * BigInt(payoutMultiplier(bet.data.betType));
        return total + payout;
      }

      return total - BigInt(bet.data.amount);
    }, 0n);
  }, [roundsData, betsData]);

  const data = useMemo<BetHistoryRecord[]>(() => {
    if (!roundsData || !betsData) return [];

    return betsData.reduce<BetHistoryRecord[]>((records, bet) => {
      const matchingRound = roundsData.find((round) => round.address === bet.data.round);

      if (!matchingRound || matchingRound.data.outcome === null) {
        return records;
      }

      const hasWon = isWinner(bet.data.betType, matchingRound.data.outcome);
      const record = {
        publicKey: bet.address,
        round: matchingRound.data.roundNumber,
        amount: parseLamportsToSol(bet.data.amount),
        betType: formatBetType(bet.data.betType),
        outcome: matchingRound.data.outcome,
        hasWon,
        claimable: hasWon && !bet.data.isClaimed,
        payout: hasWon
          ? parseBigInt(BigInt(bet.data.amount) * BigInt(payoutMultiplier(bet.data.betType)))
          : "",
      };

      switch (filter) {
        case FilterValue.Claimable:
          if (record.claimable) records.push(record);
          break;
        case FilterValue.Won:
          if (record.hasWon) records.push(record);
          break;
        case FilterValue.Lost:
          if (!record.hasWon) records.push(record);
          break;
        default:
          records.push(record);
      }

      return records;
    }, []);
  }, [roundsData, betsData, filter]);

  const columns = useMemo<ColumnDef<BetHistoryRecord>[]>(
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

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  const claimWinnings = useCallback(() => {
    toast.promise(
      async () => {
        if (!publicKey || !signTransaction) {
          throw new Error("Wallet not connected.");
        }

        if (!roundsData || roundsData.length === 0) {
          throw new Error("No rounds have been played.");
        }

        if (!betsData || betsData.length === 0 || !claimableBets || claimableBets.length === 0) {
          throw new Error("No bets to claim.");
        }

        const roundAndBets = claimableBets.map((bet) => ({
          round: bet.data.round,
          bet: bet.address,
        }));

        setIsSendingTransaction(true);

        let tx = await buildTx(
          connection,
          [
            createClaimWinningsInstruction(
              { player: publicKey },
              {
                roundBetAccounts: claimableBets.flatMap((bet) => [
                  new PublicKey(bet.data.round),
                  new PublicKey(bet.address),
                ]),
              },
            ),
          ],
          publicKey,
          [],
          priorityFee,
        );

        tx = await signTransaction(tx);
        const signature = await sendTx(tx);

        return {
          signature,
          roundAndBets,
        };
      },
      {
        loading: "Waiting for signature...",
        success: async ({ signature, roundAndBets }) => {
          await betsMutate(
            (prev) => {
              if (!prev) {
                throw new Error("Bets should not be null.");
              }

              return prev.map((bet) => {
                const claimedBet = roundAndBets.some(
                  ({ bet: betPubkey }) => betPubkey === bet.address,
                );

                if (claimedBet) {
                  return {
                    ...bet,
                    data: { ...bet.data, isClaimed: true },
                  };
                }

                return bet;
              });
            },
            {
              revalidate: false,
            },
          );

          return showTransactionToast("Winnings claimed!", signature);
        },
        error: (err) => {
          console.error(err);
          setIsSendingTransaction(false);
          return err.message || "Something went wrong.";
        },
      },
    );
  }, [
    betsData,
    connection,
    publicKey,
    roundsData,
    priorityFee,
    claimableBets,
    signTransaction,
    setIsSendingTransaction,
    showTransactionToast,
    betsMutate,
  ]);

  return (
    <section className="flex w-full flex-col justify-start gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Bet History</h2>
        <div className="flex flex-wrap items-center gap-4">
          {publicKey && (
            <span className="flex items-center gap-2 text-sm">
              Net PnL:{" "}
              <span
                className={cn(
                  "font-semibold",
                  netPnL > 0n
                    ? "text-green-500"
                    : netPnL === 0n
                      ? "text-foreground"
                      : "text-red-400",
                )}
              >
                {betsLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <>
                    {netPnL > 0n ? "+" : netPnL === 0n ? "" : "-"}
                    {parseLamportsToSol(
                      netPnL < 0n ? (-netPnL).toString() : netPnL.toString(),
                    )} SOL
                  </>
                )}
              </span>
            </span>
          )}
          <Select value={filter} onValueChange={(value) => setFilter(value as FilterValue)}>
            <SelectTrigger className="w-fit min-w-[100px] cursor-pointer">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                className="cursor-pointer"
                disabled={!publicKey || isSendingTransaction || claimableBets?.length === 0}
                onClick={claimWinnings}
              >
                <Gem />
                Claim Winnings
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Claimable:{" "}
              <span className="text-accent font-semibold">
                {Number(claimableAmount) / LAMPORTS_PER_SOL}
              </span>{" "}
              SOL
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="dark:hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize() }}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="hover:bg-accent/10 cursor-pointer"
                onClick={() => {
                  window.open(getAccountLink(row.original.publicKey), "_blank");
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              {betsLoading ? (
                <TableCell colSpan={columns.length}>
                  <div className="flex flex-col gap-2">
                    {[...Array(3)].map((_, index) => (
                      <Skeleton key={index} className="h-6 w-full" />
                    ))}
                  </div>
                </TableCell>
              ) : (
                <TableCell colSpan={columns.length} className="text-center">
                  {publicKey ? <span>No results.</span> : <EmptyWallet />}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-2">
        <p className="text-muted-foreground text-sm">
          Showing {table.getRowCount()} bet{table.getRowCount() > 1 ? "s" : ""}.
        </p>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px] cursor-pointer">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`} className="cursor-pointer">
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <PaginationButton
              className="hidden lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <SrSpan text="Go to first page" />
              <ChevronsLeft />
            </PaginationButton>
            <PaginationButton
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <SrSpan text="Go to previous page" />
              <ChevronLeft />
            </PaginationButton>
            <PaginationButton onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <SrSpan text="Go to next page" />
              <ChevronRight />
            </PaginationButton>
            <PaginationButton
              className="hidden lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <SrSpan text="Go to last page" />
              <ChevronsRight />
            </PaginationButton>
          </div>
        </div>
      </div>
    </section>
  );
}
