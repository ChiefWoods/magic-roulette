"use client";

import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import {
  hasNumbersSelected,
  isColumnSelected,
  isDozenSelected,
  isFiveNumberSelected,
  isOutsideBetSelected,
  isStraightUpSelected,
} from "@magic-roulette/sdk/bet";
import { type ParsedBetType } from "@magic-roulette/sdk/bet";
import { PublicKey } from "@solana/web3.js";
import { ReactNode } from "react";
import { toast } from "sonner";

import { capitalizeFirstLetter, cn } from "@/lib/utils";
import { useBets } from "@/providers/BetsProvider";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const tableNumbers = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

function BaseButton({
  className,
  tooltipText,
  isSelected = false,
  publicKey,
  onClick,
  children,
}: {
  className?: string;
  tooltipText: string;
  isSelected?: boolean;
  publicKey?: PublicKey | null;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={"default"}
          className={cn(
            "cursor-pointer rounded-none border border-white font-bold size-12",
            className,
            isSelected ? "bg-yellow-600 hover:bg-yellow-600 text-white" : "",
          )}
          onClick={() => {
            if (!publicKey) {
              return toast.error("Wallet not connected.");
            }

            onClick();
          }}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}

function NumberButton({
  number,
  isSelected = false,
  publicKey,
  onClick,
}: {
  number: number;
  isSelected?: boolean;
  publicKey?: PublicKey | null;
  onClick: () => void;
}) {
  const isRed = redNumbers.includes(number);

  return (
    <BaseButton
      className={`${cn("text-white relative", isRed ? "bg-(--roulette-button-red)" : "bg-black")}`}
      tooltipText={`Straight: ${number}`}
      isSelected={isSelected}
      publicKey={publicKey}
      onClick={onClick}
    >
      {number}
    </BaseButton>
  );
}

function ColumnButton({
  number,
  isSelected = false,
  publicKey,
  className = "",
  onClick,
}: {
  number: number;
  isSelected?: boolean;
  publicKey?: PublicKey | null;
  className?: string;
  onClick: () => void;
}) {
  return (
    <BaseButton
      className={cn("bg-green-600 text-white", className)}
      tooltipText={`Column: ${number}`}
      isSelected={isSelected}
      publicKey={publicKey}
      onClick={onClick}
    >
      2 to 1
    </BaseButton>
  );
}

function ZeroButton({
  value,
  isSelected = false,
  className = "",
  publicKey,
  onClick,
}: {
  value: string;
  isSelected?: boolean;
  className?: string;
  publicKey?: PublicKey | null;
  onClick: () => void;
}) {
  return (
    <BaseButton
      className={cn("text-white bg-green-600 w-12 h-18", className)}
      tooltipText={`Straight: ${value}`}
      isSelected={isSelected}
      publicKey={publicKey}
      onClick={onClick}
    >
      {value}
    </BaseButton>
  );
}

function DozenButton({
  value,
  isSelected = false,
  publicKey,
  onClick,
}: {
  value: number;
  isSelected?: boolean;
  publicKey?: PublicKey | null;
  onClick: () => void;
}) {
  return (
    <BaseButton
      className={"h-12 w-48 bg-green-600 text-white"}
      tooltipText={`Dozen: ${value}`}
      isSelected={isSelected}
      publicKey={publicKey}
      onClick={onClick}
    >
      {value === 1 ? "1st" : value === 2 ? "2nd" : "3rd"} 12
    </BaseButton>
  );
}

function BottomButton({
  value,
  isSelected = false,
  className = "",
  publicKey,
  onClick,
}: {
  value: string;
  isSelected?: boolean;
  className?: string;
  publicKey?: PublicKey | null;
  onClick: () => void;
}) {
  return (
    <BaseButton
      className={cn(
        " text-white h-12 w-24",
        value === "red"
          ? "bg-(--roulette-button-red)"
          : value === "black"
            ? "bg-black"
            : "bg-green-600",
        className,
      )}
      tooltipText={capitalizeFirstLetter(value)}
      isSelected={isSelected}
      publicKey={publicKey}
      onClick={onClick}
    >
      {value === "low" ? "1-18" : value === "high" ? "19-36" : capitalizeFirstLetter(value)}
    </BaseButton>
  );
}

function InsideBetButton({
  label,
  tooltipText,
  isSelected = false,
  publicKey,
  onClick,
  className,
}: {
  label: string;
  tooltipText: string;
  isSelected?: boolean;
  publicKey?: PublicKey | null;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={"outline"}
          className={cn(
            "cursor-pointer text-xs font-semibold transition-opacity z-2 absolute rounded-full tabular-nums size-5 p-1 border border-white",
            isSelected
              ? "bg-yellow-500 hover:bg-yellow-500 text-white"
              : "bg-white hover:bg-primary/90 text-black",
            className,
          )}
          onClick={() => {
            if (!publicKey) {
              return toast.error("Wallet not connected.");
            }

            onClick();
          }}
          tabIndex={0}
        >
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}

const outsideBetKinds = {
  red: "Red",
  black: "Black",
  even: "Even",
  odd: "Odd",
  low: "Low",
  high: "High",
} as const satisfies Record<string, ParsedBetType["__kind"]>;

export function RouletteTable() {
  const { publicKey } = useUnifiedWallet();
  const { selectedBet, setSelectedBet } = useBets();

  return (
    <div className="flex shrink-0 flex-col items-center rounded-md border-3 border-(--roulette-table-gold) bg-(--roulette-table-green) p-8">
      <div className="flex items-center justify-center">
        {/* Straight: 00, 0 */}
        <div className="relative flex flex-col rounded-l-md border-y-2 border-l-2 border-white">
          {["00", "0"].map((value) => (
            <ZeroButton
              key={value}
              value={value}
              isSelected={isStraightUpSelected(selectedBet, value === "00" ? 37 : 0)}
              publicKey={publicKey}
              className={value === "00" ? "rounded-tl-sm" : "rounded-bl-sm"}
              onClick={() => {
                const number = value === "00" ? 37 : 0;
                const nextBet: ParsedBetType = { __kind: "StraightUp", number };

                setSelectedBet(isStraightUpSelected(selectedBet, number) ? null : nextBet);
              }}
            />
          ))}
          {/* Five Number */}
          <InsideBetButton
            label="5#"
            tooltipText="Five Number"
            isSelected={isFiveNumberSelected(selectedBet)}
            publicKey={publicKey}
            onClick={() => {
              setSelectedBet(isFiveNumberSelected(selectedBet) ? null : { __kind: "FiveNumber" });
            }}
            className="right-0 bottom-0 translate-x-1/2 translate-y-1/2"
          />
        </div>
        {/* Straight: 1 - 36 */}
        <div className="relative grid shrink-0 grid-cols-12 grid-rows-3 border-y-2 border-white">
          {tableNumbers.flat().map((num, i) => {
            const row = Math.floor(i / 12);
            // every number except the last one of a row and numbers in the last row have corner bets
            const hasCorner = i % 12 !== 11 && row < 2;
            // every number in the first row has street bets
            const hasStreet = i < 12;
            // every number in the last row except the last one has line bets
            const hasLine = i % 12 !== 11 && row === 2;
            // every number except the last one of a row has split bets
            const hasSplit = i % 12 !== 11;

            return (
              <div className="relative" key={num}>
                <NumberButton
                  number={num}
                  isSelected={isStraightUpSelected(selectedBet, num)}
                  publicKey={publicKey}
                  onClick={() => {
                    const nextBet: ParsedBetType = { __kind: "StraightUp", number: num };
                    setSelectedBet(isStraightUpSelected(selectedBet, num) ? null : nextBet);
                  }}
                />
                {/* Corner */}
                {hasCorner && (
                  <InsideBetButton
                    label="C"
                    tooltipText={`Corner: ${num - 1}, ${num}, ${num + 2}, ${num + 3}`}
                    isSelected={hasNumbersSelected(selectedBet, "Corner", [
                      num - 1,
                      num,
                      num + 2,
                      num + 3,
                    ])}
                    publicKey={publicKey}
                    onClick={() => {
                      const cornerNumbers = [num - 1, num, num + 2, num + 3];
                      const nextBet: ParsedBetType = {
                        __kind: "Corner",
                        numbers: cornerNumbers,
                      };
                      setSelectedBet(
                        hasNumbersSelected(selectedBet, "Corner", cornerNumbers) ? null : nextBet,
                      );
                    }}
                    className="right-0 bottom-0 translate-x-1/2 translate-y-1/2"
                  />
                )}
                {/* Street */}
                {hasStreet && (
                  <InsideBetButton
                    label="St"
                    tooltipText={`Street: ${num - 2}, ${num - 1}, ${num}`}
                    isSelected={hasNumbersSelected(selectedBet, "Street", [num - 2, num - 1, num])}
                    publicKey={publicKey}
                    onClick={() => {
                      const streetNumbers = [num - 2, num - 1, num];
                      const nextBet: ParsedBetType = {
                        __kind: "Street",
                        numbers: streetNumbers,
                      };
                      setSelectedBet(
                        hasNumbersSelected(selectedBet, "Street", streetNumbers) ? null : nextBet,
                      );
                    }}
                    className="top-0 right-1/2 translate-x-1/2 -translate-y-1/2"
                  />
                )}
                {/* Line */}
                {hasLine && (
                  <InsideBetButton
                    label="L"
                    tooltipText={`Line: ${num}, ${num + 1}, ${num + 2}, ${
                      num + 3
                    }, ${num + 4}, ${num + 5}`}
                    isSelected={hasNumbersSelected(selectedBet, "Line", [
                      num,
                      num + 1,
                      num + 2,
                      num + 3,
                      num + 4,
                      num + 5,
                    ])}
                    publicKey={publicKey}
                    onClick={() => {
                      const lineNumbers = [num, num + 1, num + 2, num + 3, num + 4, num + 5];
                      const nextBet: ParsedBetType = { __kind: "Line", numbers: lineNumbers };
                      setSelectedBet(
                        hasNumbersSelected(selectedBet, "Line", lineNumbers) ? null : nextBet,
                      );
                    }}
                    className="right-0 bottom-0 translate-x-1/2 translate-y-1/2"
                  />
                )}
                {hasSplit && (
                  <InsideBetButton
                    label="Sp"
                    tooltipText={`Split: ${num}, ${num + 3}`}
                    isSelected={hasNumbersSelected(selectedBet, "Split", [num, num + 3])}
                    publicKey={publicKey}
                    onClick={() => {
                      const splitNumbers = [num, num + 3];
                      const nextBet: ParsedBetType = { __kind: "Split", numbers: splitNumbers };
                      setSelectedBet(
                        hasNumbersSelected(selectedBet, "Split", splitNumbers) ? null : nextBet,
                      );
                    }}
                    className="top-1/2 right-0 translate-x-1/2 -translate-y-1/2"
                  />
                )}
              </div>
            );
          })}
        </div>
        {/* Column */}
        <div className="flex flex-col rounded-r-md border-y-2 border-r-2 border-white">
          {[1, 2, 3].map((col) => (
            <ColumnButton
              key={col}
              number={col}
              isSelected={isColumnSelected(selectedBet, col)}
              publicKey={publicKey}
              className={col === 1 ? "rounded-tr-sm" : col === 3 ? "rounded-br-sm" : ""}
              onClick={() => {
                const nextBet: ParsedBetType = { __kind: "Column", column: col };
                setSelectedBet(isColumnSelected(selectedBet, col) ? null : nextBet);
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col">
        {/* Dozen */}
        <div className="flex w-full justify-center border-x-2 border-white">
          {[1, 2, 3].map((dozen) => (
            <DozenButton
              key={dozen}
              value={dozen}
              isSelected={isDozenSelected(selectedBet, dozen)}
              publicKey={publicKey}
              onClick={() => {
                const nextBet: ParsedBetType = { __kind: "Dozen", dozen };
                setSelectedBet(isDozenSelected(selectedBet, dozen) ? null : nextBet);
              }}
            />
          ))}
        </div>
        {/* High, Even, Red, Black, Odd, Low */}
        <div className="flex w-full justify-center rounded-b-md border-x-2 border-b-2 border-white">
          {(["low", "even", "red", "black", "odd", "high"] as const).map((value) => {
            const kind = outsideBetKinds[value];
            const selected = isOutsideBetSelected(selectedBet, kind);

            return (
              <BottomButton
                key={value}
                value={value}
                isSelected={selected}
                publicKey={publicKey}
                className={
                  value === "low" ? "rounded-bl-sm" : value === "high" ? "rounded-br-sm" : ""
                }
                onClick={() => {
                  const nextBet = { __kind: kind } as ParsedBetType;
                  setSelectedBet(selected ? null : nextBet);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
