"use client";

import { BetType, ParsedBet } from "@/types/accounts";
import { wrappedFetch } from "@/lib/api";
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
import { formatBetType } from "@/lib/utils";
import { useUnifiedWallet } from "@jup-ag/wallet-adapter";

interface BetsContextType {
  betsData: ParsedBet[] | undefined;
  betsLoading: boolean;
  betsMutate: KeyedMutator<ParsedBet[]>;
  selectedBet: BetType | null;
  setSelectedBet: Dispatch<SetStateAction<BetType | null>>;
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
  } = useSWR(
    publicKey ? { apiEndpoint, player: publicKey.toBase58() } : null,
    async ({ apiEndpoint, player }) => {
      const newUrl = new URL(apiEndpoint);

      newUrl.searchParams.append("player", player);

      const bets = (await wrappedFetch(newUrl.href)).bets as ParsedBet[];

      return bets;
    }
  );
  const [selectedBet, setSelectedBet] = useState<BetType | null>(null);

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
