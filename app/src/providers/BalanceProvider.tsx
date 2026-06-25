"use client";

import { useConnection, useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { createContext, ReactNode, use, useEffect, useMemo, useState } from "react";

import { fetchBalance } from "@/lib/api";

const balanceBuffer = 10000; // lamports for covering transaction fees

interface BalanceContextType {
  balance: number | null;
}

const BalanceContextType = createContext<BalanceContextType>({} as BalanceContextType);

export function useBalance() {
  return use(BalanceContextType);
}

export function BalanceProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number | null>(null);
  const { publicKey } = useUnifiedWallet();
  const { connection } = useConnection();

  useEffect(() => {
    (async () => {
      if (!publicKey) {
        setBalance(null);
        return;
      }

      const lamports = await fetchBalance(publicKey.toBase58());
      setBalance(lamports - balanceBuffer);
    })();

    if (!publicKey) {
      return;
    }

    const id = connection.onAccountChange(publicKey, (acc) => {
      setBalance(acc.lamports - balanceBuffer);
    });

    return () => {
      connection.removeAccountChangeListener(id);
    };
  }, [connection, publicKey]);

  const value = useMemo(() => ({ balance }), [balance]);

  return <BalanceContextType.Provider value={value}>{children}</BalanceContextType.Provider>;
}
