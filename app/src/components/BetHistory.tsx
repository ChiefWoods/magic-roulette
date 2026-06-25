"use client";

import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import {
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import { useBets } from "@/providers/BetsProvider";
import { useRounds } from "@/providers/RoundsProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useTransaction } from "@/providers/TransactionProvider";

import { BetHistoryPagination } from "./bet-history/BetHistoryPagination";
import { BetHistoryTable } from "./bet-history/BetHistoryTable";
import { BetHistoryToolbar } from "./bet-history/BetHistoryToolbar";
import { useBetHistoryColumns } from "./bet-history/columns";
import { FilterValue } from "./bet-history/types";
import { useBetHistoryData } from "./bet-history/useBetHistoryData";
import { useClaimWinnings } from "./bet-history/useClaimWinnings";

export function BetHistory() {
  const { publicKey } = useUnifiedWallet();
  const { roundsData } = useRounds();
  const { betsData, betsLoading, betsMutate } = useBets();
  const { getAccountLink, priorityFee } = useSettings();
  const { isSendingTransaction, setIsSendingTransaction, showTransactionToast } = useTransaction();
  const [filter, setFilter] = useState<FilterValue>(FilterValue.All);
  const [sorting, setSorting] = useState<SortingState>([{ id: "round", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { claimableBets, claimableAmount, netPnL, data } = useBetHistoryData(
    roundsData,
    betsData,
    filter,
  );
  const columns = useBetHistoryColumns();

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

  const claimWinnings = useClaimWinnings({
    roundsData,
    betsData,
    claimableBets,
    priorityFee,
    betsMutate,
    setIsSendingTransaction,
    showTransactionToast,
  });

  return (
    <section className="flex w-full flex-col justify-start gap-4">
      <BetHistoryToolbar
        publicKey={publicKey}
        netPnL={netPnL}
        betsLoading={betsLoading}
        filter={filter}
        onFilterChange={setFilter}
        claimableBets={claimableBets}
        claimableAmount={claimableAmount}
        isSendingTransaction={isSendingTransaction}
        onClaimWinnings={claimWinnings}
      />
      <BetHistoryTable
        table={table}
        columns={columns}
        betsLoading={betsLoading}
        publicKey={publicKey}
        getAccountLink={getAccountLink}
      />
      <BetHistoryPagination table={table} />
    </section>
  );
}
