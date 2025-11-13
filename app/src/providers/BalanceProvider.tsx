"use client";

import { useConnection, useUnifiedWallet } from "@jup-ag/wallet-adapter";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const balanceBuffer = 10000; // lamports for covering transaction fees

interface BalanceContextType {
  balance: number | null;
}

const BalanceContextType = createContext<BalanceContextType>(
  {} as BalanceContextType
);

export function useBalance() {
  return useContext(BalanceContextType);
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

      const balance = await connection.getBalance(publicKey);
      setBalance(balance - balanceBuffer);
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

  return (
    <BalanceContextType.Provider value={{ balance }}>
      {children}
    </BalanceContextType.Provider>
  );
}
