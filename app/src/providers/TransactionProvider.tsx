"use client";

import { TransactionToast } from "@/components/TransactionToast";
import { useSettings } from "@/providers/SettingsProvider";
import React, { createContext, ReactNode, useContext, useState } from "react";

interface TransactionContextType {
  isSendingTransaction: boolean;
  setIsSendingTransaction: (isSending: boolean) => void;
  showTransactionToast: (title: string, signature: string) => React.JSX.Element;
}

const TransactionContextType = createContext<TransactionContextType>(
  {} as TransactionContextType
);

export function useTransaction() {
  return useContext(TransactionContextType);
}

export function TransactionProvider({ children }: { children: ReactNode }) {
  const { getTransactionLink } = useSettings();
  const [isSendingTransaction, setIsSendingTransaction] =
    useState<boolean>(false);

  function showTransactionToast(title: string, signature: string) {
    setIsSendingTransaction(false);

    return (
      <TransactionToast title={title} link={getTransactionLink(signature)} />
    );
  }

  return (
    <TransactionContextType.Provider
      value={{
        isSendingTransaction,
        setIsSendingTransaction,
        showTransactionToast,
      }}
    >
      {children}
    </TransactionContextType.Provider>
  );
}
