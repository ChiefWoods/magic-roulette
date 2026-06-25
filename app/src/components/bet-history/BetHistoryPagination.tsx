import { Table as ReactTable } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { PaginationButton, SrSpan } from "./helpers";
import { BetHistoryRecord } from "./types";

export function BetHistoryPagination({ table }: { table: ReactTable<BetHistoryRecord> }) {
  return (
    <div className="flex items-center justify-between px-2">
      <p className="text-muted-foreground text-sm">
        Showing {table.getRowCount()} bet{table.getRowCount() > 1 ? "s" : ""}.
      </p>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px] cursor-pointer">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`} className="cursor-pointer">
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <PaginationButton
            className="hidden lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <SrSpan text="Go to first page" />
            <ChevronsLeft />
          </PaginationButton>
          <PaginationButton
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <SrSpan text="Go to previous page" />
            <ChevronLeft />
          </PaginationButton>
          <PaginationButton onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <SrSpan text="Go to next page" />
            <ChevronRight />
          </PaginationButton>
          <PaginationButton
            className="hidden lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <SrSpan text="Go to last page" />
            <ChevronsRight />
          </PaginationButton>
        </div>
      </div>
    </div>
  );
}
