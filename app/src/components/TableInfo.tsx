"use client";

import { useTable } from "@/providers/TableProvider";
import { Skeleton } from "./ui/skeleton";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ReactNode } from "react";
import { formatDuration } from "@/lib/utils";
import { useRound } from "@/providers/RoundProvider";

function TableInfoText({
  children
}: {
  children: ReactNode
}) {
  return (
    <div className="flex gap-4 items-center text-nowrap justify-between">
      {children}
    </div>
  )
}

export function TableInfo() {
  const { tableData, tableLoading } = useTable();
  const { roundData, roundLoading } = useRound();

  if (!tableLoading && !tableData) {
    throw new Error("Table is not initialized.");
  }

  return (
    <section className="flex flex-col gap-4 p-4 border border-gray-300 rounded-md">
      <h2 className="text-xl">Table Info</h2>
      <div className="flex flex-col">
        <TableInfoText>
          <p className="text-start">Minimum Bet Amount:</p>
          {tableLoading ? (
            <Skeleton className="w-24 h-4" />
          ) : tableData && (
            <span className="text-end">{Number(tableData.minimumBetAmount) / LAMPORTS_PER_SOL} SOL</span>
          )}
        </TableInfoText>
        <TableInfoText>
          <p className="text-start">Round Period:</p>
          {tableLoading ? (
            <Skeleton className="w-8 h-4" />
          ) : tableData && (
            <span className="text-end">{formatDuration(Number(tableData.roundPeriodTs))}</span>
          )}
        </TableInfoText>
        <TableInfoText>
          <p className="text-start">Current Round:</p>
          {tableLoading ? (
            <Skeleton className="w-8 h-4" />
          ) : tableData && (
            <span className="text-end">{tableData.currentRoundNumber}</span>
          )}
        </TableInfoText>
        <TableInfoText>
          <p className="text-start">Pool Amount:</p>
          {roundLoading ? (
            <Skeleton className="w-24 h-4" />
          ) : roundData && (
            <span className="text-end">{Number(roundData.poolAmount) / LAMPORTS_PER_SOL} SOL</span>
          )}
        </TableInfoText>
      </div>
    </section>
  )
}