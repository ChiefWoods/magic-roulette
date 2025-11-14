"use client";

import { parseBN, ParsedRound } from "@/types/accounts";
import { wrappedFetch } from "@/lib/api";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import useSWR, { KeyedMutator } from "swr";
import { useTable } from "./TableProvider";
import { BN } from "@coral-xyz/anchor";
import { useProgram } from "./ProgramProvider";

interface RoundsContextType {
  roundsData: ParsedRound[] | undefined;
  roundsLoading: boolean;
  roundsMutate: KeyedMutator<ParsedRound[]>;
  lastRoundOutcome: number | null;
  setLastRoundOutcome: (outcome: number | null) => void;
}

const RoundsContext = createContext<RoundsContextType>({} as RoundsContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/rounds`;

export function useRounds() {
  return useContext(RoundsContext);
}

export function RoundsProvider({
  children,
  roundNumber,
  isSpun,
  isClaimed,
}: {
  children: ReactNode;
  roundNumber?: number;
  isSpun?: boolean;
  isClaimed?: boolean;
}) {
  const {
    data: roundsData,
    isLoading: roundsLoading,
    mutate: roundsMutate,
  } = useSWR(
    { apiEndpoint, roundNumber, isSpun, isClaimed },
    async ({ apiEndpoint, roundNumber, isSpun, isClaimed }) => {
      const newUrl = new URL(apiEndpoint);

      if (roundNumber) {
        newUrl.searchParams.append("roundNumber", roundNumber.toString());
      }

      if (isSpun) {
        newUrl.searchParams.append("isSpun", isSpun.toString());
      }

      if (isClaimed) {
        newUrl.searchParams.append("isClaimed", isClaimed.toString());
      }

      return (await wrappedFetch(newUrl.href)).rounds as ParsedRound[];
    }
  );
  const { tableData } = useTable();
  const { magicRouletteClient } = useProgram();
  const [lastRoundOutcome, setLastRoundOutcome] = useState<number | null>(null);

  // initial fetch of last round outcome
  useEffect(() => {
    (async () => {
      if (
        tableData &&
        roundsData &&
        new BN(tableData.currentRoundNumber).gtn(1) &&
        lastRoundOutcome === null
      ) {
        const lastRoundNumber = new BN(tableData.currentRoundNumber).subn(1);

        const lastRoundAcc = roundsData.find((round) => {
          return round.roundNumber === parseBN(lastRoundNumber);
        });

        // if this scope is reached, lastRoundAcc must exist
        setLastRoundOutcome(lastRoundAcc!.outcome);
      }
    })();
  }, [tableData, roundsData, magicRouletteClient, lastRoundOutcome]);

  return (
    <RoundsContext.Provider
      value={{
        roundsData,
        roundsLoading,
        roundsMutate,
        lastRoundOutcome,
        setLastRoundOutcome,
      }}
    >
      {children}
    </RoundsContext.Provider>
  );
}
