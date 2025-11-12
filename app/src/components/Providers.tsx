"use client";

import { wrappedFetch } from "@/lib/api";
import { ReactNode } from "react";
import { SWRConfig } from "swr";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { ProgramProvider } from "@/providers/ProgramProvider";
import { SolanaProvider } from "@/providers/SolanaProvider";
import { TableProvider } from "@/providers/TableProvider";
import { BalanceProvider } from "@/providers/BalanceProvider";
import { TimeProvider } from "@/providers/TimeProvider";
import { TransactionProvider } from "@/providers/TransactionProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        suspense: false,
        revalidateOnFocus: false,
        fetcher: wrappedFetch,
      }}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TimeProvider>
          <SettingsProvider>
            <SolanaProvider>
              <ProgramProvider>
                <TransactionProvider>
                  <BalanceProvider>
                    <TableProvider>{children}</TableProvider>
                  </BalanceProvider>
                </TransactionProvider>
              </ProgramProvider>
            </SolanaProvider>
          </SettingsProvider>
        </TimeProvider>
      </ThemeProvider>
    </SWRConfig>
  );
}
