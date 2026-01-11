import { ReactNode } from "react";
import { SWRConfig } from "swr";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { SolanaProvider } from "@/providers/SolanaProvider";
import { TimeProvider } from "@/providers/TimeProvider";
import { TransactionProvider } from "@/providers/TransactionProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        suspense: false,
        revalidateOnFocus: false,
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
              <TransactionProvider>{children}</TransactionProvider>
            </SolanaProvider>
          </SettingsProvider>
        </TimeProvider>
      </ThemeProvider>
    </SWRConfig>
  );
}
