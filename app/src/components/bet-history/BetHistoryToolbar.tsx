import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Gem } from "lucide-react";

import { cn, parseLamportsToSol } from "@/lib/utils";
import { ParsedBet } from "@/types/accounts";

import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FilterValue, filterOptions } from "./types";

export function BetHistoryToolbar({
  publicKey,
  netPnL,
  betsLoading,
  filter,
  onFilterChange,
  claimableBets,
  claimableAmount,
  isSendingTransaction,
  onClaimWinnings,
}: {
  publicKey: PublicKey | null;
  netPnL: bigint;
  betsLoading: boolean;
  filter: FilterValue;
  onFilterChange: (value: FilterValue) => void;
  claimableBets: ParsedBet[];
  claimableAmount: bigint;
  isSendingTransaction: boolean;
  onClaimWinnings: () => void;
}) {
  return (
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
                  )}{" "}
                  SOL
                </>
              )}
            </span>
          </span>
        )}
        <Select value={filter} onValueChange={(value) => onFilterChange(value as FilterValue)}>
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
              disabled={!publicKey || isSendingTransaction || claimableBets.length === 0}
              onClick={onClaimWinnings}
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
  );
}
