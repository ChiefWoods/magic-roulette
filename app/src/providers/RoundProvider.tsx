'use client';

import { ParsedRound } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';

interface RoundContextType {
  roundData: ParsedRound | undefined;
  roundLoading: boolean;
  roundMutate: KeyedMutator<ParsedRound>;
}

const RoundContext = createContext<RoundContextType>({} as RoundContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/rounds`;

export function useRound() {
  return useContext(RoundContext);
}

export function RoundProvider({
  children,
  pda,
}: {
  children: ReactNode;
  pda: string;
}) {
  const {
    data: roundData,
    isLoading: roundLoading,
    mutate: roundMutate,
  } = useSWR({ apiEndpoint, pda }, async ({ apiEndpoint, pda }) => {
    return (await wrappedFetch(`${apiEndpoint}?pda=${pda}`)).item as ParsedRound;
  });

  return (
    <RoundContext.Provider
      value={{
        roundData,
        roundLoading,
        roundMutate,
      }}
    >
      {children}
    </RoundContext.Provider>
  );
}
