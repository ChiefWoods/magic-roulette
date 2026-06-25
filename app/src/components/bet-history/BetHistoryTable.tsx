import { ColumnDef, flexRender, Table as ReactTable } from "@tanstack/react-table";

import { EmptyWallet } from "../EmptyWallet";
import { Skeleton } from "../ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { BetHistoryRecord } from "./types";

export function BetHistoryTable({
  table,
  columns,
  betsLoading,
  publicKey,
  getAccountLink,
}: {
  table: ReactTable<BetHistoryRecord>;
  columns: ColumnDef<BetHistoryRecord>[];
  betsLoading: boolean;
  publicKey: unknown;
  getAccountLink: (address: string) => string;
}) {
  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="dark:hover:bg-transparent">
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} style={{ width: header.getSize() }}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
              className="hover:bg-accent/10 cursor-pointer"
              onClick={() => {
                window.open(getAccountLink(row.original.publicKey), "_blank");
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            {betsLoading ? (
              <TableCell colSpan={columns.length}>
                <div className="flex flex-col gap-2">
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="h-6 w-full" />
                  ))}
                </div>
              </TableCell>
            ) : (
              <TableCell colSpan={columns.length} className="text-center">
                {publicKey ? <span>No results.</span> : <EmptyWallet />}
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
