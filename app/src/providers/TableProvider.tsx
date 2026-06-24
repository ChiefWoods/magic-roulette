"use client";

import { createContext, ReactNode, useContext } from "react";
import useSWR, { KeyedMutator } from "swr";

import { wrappedFetch } from "@/lib/api";
import { ParsedTable } from "@/types/accounts";

interface TableContextType {
  tableData: ParsedTable | undefined;
  tableLoading: boolean;
  tableMutate: KeyedMutator<ParsedTable>;
}

const TableContext = createContext<TableContextType>({} as TableContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/table`;

export function useTable() {
  return useContext(TableContext);
}

export function TableProvider({
  children,
  fallbackData,
}: {
  children: ReactNode;
  fallbackData: ParsedTable;
}) {
  const {
    data: tableData,
    isLoading: tableLoading,
    mutate: tableMutate,
  } = useSWR(
    apiEndpoint,
    async (url) => {
      return (await wrappedFetch(url)).table as ParsedTable;
    },
    {
      fallbackData,
      revalidateOnMount: false,
      keepPreviousData: true,
    },
  );

  return (
    <TableContext.Provider
      value={{
        tableData,
        tableLoading,
        tableMutate,
      }}
    >
      {children}
    </TableContext.Provider>
  );
}
