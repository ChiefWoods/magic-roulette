"use client";

import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { formatBetType } from "@magic-roulette/sdk/bet";
import { type ParsedBetType } from "@magic-roulette/sdk/bet";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";
import useSWR, { KeyedMutator } from "swr";

import { wrappedFetch } from "@/lib/api";
import { ParsedBet } from "@/types/accounts";

interface BetsContextType {
  betsData: ParsedBet[] | undefined;
  betsLoading: boolean;
  betsMutate: KeyedMutator<ParsedBet[]>;
  selectedBet: ParsedBetType | null;
  setSelectedBet: Dispatch<SetStateAction<ParsedBetType | null>>;
  formattedBet: string;
}

const BetsContext = createContext<BetsContextType>({} as BetsContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/bets`;

export function useBets() {
  return useContext(BetsContext);
}

export function BetsProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useUnifiedWallet();

  const {
    data: betsData,
    isLoading: betsLoading,
    mutate: betsMutate,
  } = useSWR(publicKey, async (player) => {
    const newUrl = new URL(apiEndpoint);

    newUrl.searchParams.append("player", player.toBase58());

    const bets = (await wrappedFetch(newUrl.href)).bets as ParsedBet[];

    return bets;
  });
  const [selectedBet, setSelectedBet] = useState<ParsedBetType | null>(null);

  const formattedBet = useMemo(() => {
    if (!selectedBet) return "";

    return formatBetType(selectedBet);
  }, [selectedBet]);

  return (
    <BetsContext.Provider
      value={{
        betsData,
        betsLoading,
        betsMutate,
        selectedBet,
        setSelectedBet,
        formattedBet,
      }}
    >
      {children}
    </BetsContext.Provider>
  );
}
