"use client";

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

import { TransactionToast } from "@/components/TransactionToast";
import { useSettings } from "@/providers/SettingsProvider";

interface TransactionContextType {
  isSendingTransaction: boolean;
  setIsSendingTransaction: (isSending: boolean) => void;
  showTransactionToast: (title: string, signature: string) => React.JSX.Element;
}

const TransactionContextType = createContext<TransactionContextType>({} as TransactionContextType);

export function useTransaction() {
  return useContext(TransactionContextType);
}

export function TransactionProvider({ children }: { children: ReactNode }) {
  const { getTransactionLink } = useSettings();
  const [isSendingTransaction, setIsSendingTransaction] = useState<boolean>(false);

  const showTransactionToast = useCallback(
    (title: string, signature: string) => {
      setIsSendingTransaction(false);

      return <TransactionToast title={title} link={getTransactionLink(signature)} />;
    },
    [getTransactionLink],
  );

  const value = useMemo(
    () => ({
      isSendingTransaction,
      setIsSendingTransaction,
      showTransactionToast,
    }),
    [isSendingTransaction, showTransactionToast],
  );

  return (
    <TransactionContextType.Provider value={value}>{children}</TransactionContextType.Provider>
  );
}
