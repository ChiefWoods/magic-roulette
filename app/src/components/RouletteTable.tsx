"use client";

import { BetType } from "@/types/accounts";
import { ReactNode } from "react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { capitalizeFirstLetter, cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { useBets } from "@/providers/BetsProvider";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";
import { useUnifiedWallet } from "@jup-ag/wallet-adapter";

const tableNumbers = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

const redNumbers = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

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
            isSelected ? "bg-yellow-600 hover:bg-yellow-600 text-white" : ""
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
      className={`${cn(
        "text-white relative",
        isRed ? "bg-(--roulette-button-red)" : "bg-black"
      )}`}
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
      className={"bg-green-600 text-white h-12 w-48"}
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
        className
      )}
      tooltipText={capitalizeFirstLetter(value)}
      isSelected={isSelected}
      publicKey={publicKey}
      onClick={onClick}
    >
      {value === "low"
        ? "1-18"
        : value === "high"
        ? "19-36"
        : capitalizeFirstLetter(value)}
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
            className
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

export function RouletteTable() {
  const { publicKey } = useUnifiedWallet();
  const { selectedBet, setSelectedBet } = useBets();

  return (
    <div className="bg-(--roulette-table-green) p-8 border-3 border-(--roulette-table-gold) rounded-md flex flex-col items-center shrink-0">
      <div className="flex justify-center items-center">
        {/* Straight: 00, 0 */}
        <div className="flex flex-col relative border-l-2 border-y-2 rounded-l-md border-white">
          {["00", "0"].map((value) => (
            <ZeroButton
              key={value}
              value={value}
              isSelected={
                selectedBet?.straightUp?.number === (value === "00" ? 37 : 0)
              }
              publicKey={publicKey}
              className={value === "00" ? "rounded-tl-sm" : "rounded-bl-sm"}
              onClick={() => {
                const number = value === "00" ? 37 : 0;

                setSelectedBet(
                  selectedBet?.straightUp?.number === number
                    ? null
                    : { straightUp: { number } }
                );
              }}
            />
          ))}
          {/* Five Number */}
          <InsideBetButton
            label="5#"
            tooltipText="Five Number"
            isSelected={"fiveNumber" in (selectedBet ?? {})}
            publicKey={publicKey}
            onClick={() => {
              setSelectedBet(
                selectedBet?.fiveNumber ? null : { fiveNumber: {} }
              );
            }}
            className="bottom-0 right-0 translate-x-1/2 translate-y-1/2"
          />
        </div>
        {/* Straight: 1 - 36 */}
        <div className="grid grid-cols-12 grid-rows-3 relative border-y-2 border-white shrink-0">
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
                  isSelected={selectedBet?.straightUp?.number === num}
                  publicKey={publicKey}
                  onClick={() => {
                    setSelectedBet(
                      selectedBet?.straightUp?.number === num
                        ? null
                        : { straightUp: { number: num } }
                    );
                  }}
                />
                {/* Corner */}
                {hasCorner && (
                  <InsideBetButton
                    label="C"
                    tooltipText={`Corner: ${num - 1}, ${num}, ${num + 2}, ${
                      num + 3
                    }`}
                    isSelected={
                      selectedBet?.corner &&
                      selectedBet.corner.numbers.every((n) =>
                        [num - 1, num, num + 2, num + 3].includes(n)
                      )
                    }
                    publicKey={publicKey}
                    onClick={() => {
                      const cornerNumbers = [num - 1, num, num + 2, num + 3];
                      setSelectedBet(
                        selectedBet?.corner &&
                          selectedBet.corner.numbers.every((n) =>
                            cornerNumbers.includes(n)
                          )
                          ? null
                          : { corner: { numbers: cornerNumbers } }
                      );
                    }}
                    className="bottom-0 right-0 translate-x-1/2 translate-y-1/2"
                  />
                )}
                {/* Street */}
                {hasStreet && (
                  <InsideBetButton
                    label="St"
                    tooltipText={`Street: ${num - 2}, ${num - 1}, ${num}`}
                    isSelected={
                      selectedBet?.street &&
                      selectedBet.street.numbers.every((n) =>
                        [num - 2, num - 1, num].includes(n)
                      )
                    }
                    publicKey={publicKey}
                    onClick={() => {
                      const streetNumbers = [num - 2, num - 1, num];
                      setSelectedBet(
                        selectedBet?.street &&
                          selectedBet.street.numbers.every((n) =>
                            streetNumbers.includes(n)
                          )
                          ? null
                          : { street: { numbers: streetNumbers } }
                      );
                    }}
                    className="right-1/2 top-0 translate-x-1/2 -translate-y-1/2"
                  />
                )}
                {/* Line */}
                {hasLine && (
                  <InsideBetButton
                    label="L"
                    tooltipText={`Line: ${num}, ${num + 1}, ${num + 2}, ${
                      num + 3
                    }, ${num + 4}, ${num + 5}`}
                    isSelected={
                      selectedBet?.line &&
                      selectedBet.line.numbers.every((n) =>
                        [
                          num,
                          num + 1,
                          num + 2,
                          num + 3,
                          num + 4,
                          num + 5,
                        ].includes(n)
                      )
                    }
                    publicKey={publicKey}
                    onClick={() => {
                      const lineNumbers = [
                        num,
                        num + 1,
                        num + 2,
                        num + 3,
                        num + 4,
                        num + 5,
                      ];
                      setSelectedBet(
                        selectedBet?.line &&
                          selectedBet.line.numbers.every((n) =>
                            lineNumbers.includes(n)
                          )
                          ? null
                          : { line: { numbers: lineNumbers } }
                      );
                    }}
                    className="bottom-0 right-0 translate-x-1/2 translate-y-1/2"
                  />
                )}
                {hasSplit && (
                  <InsideBetButton
                    label="Sp"
                    tooltipText={`Split: ${num}, ${num + 3}`}
                    isSelected={
                      selectedBet?.split &&
                      selectedBet.split.numbers.every((n) =>
                        [num, num + 3].includes(n)
                      )
                    }
                    publicKey={publicKey}
                    onClick={() => {
                      const splitNumbers = [num, num + 3];
                      setSelectedBet(
                        selectedBet?.split &&
                          selectedBet.split.numbers.every((n) =>
                            splitNumbers.includes(n)
                          )
                          ? null
                          : { split: { numbers: splitNumbers } }
                      );
                    }}
                    className="right-0 top-1/2 translate-x-1/2 -translate-y-1/2"
                  />
                )}
              </div>
            );
          })}
        </div>
        {/* Column */}
        <div className="flex flex-col border-r-2 border-y-2 rounded-r-md border-white">
          {[1, 2, 3].map((col) => (
            <ColumnButton
              key={col}
              number={col}
              isSelected={selectedBet?.column?.column === col}
              publicKey={publicKey}
              className={
                col === 1 ? "rounded-tr-sm" : col === 3 ? "rounded-br-sm" : ""
              }
              onClick={() => {
                setSelectedBet(
                  selectedBet?.column?.column === col
                    ? null
                    : { column: { column: col } }
                );
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col">
        {/* Dozen */}
        <div className="flex justify-center border-x-2 border-white w-full">
          {[1, 2, 3].map((dozen) => (
            <DozenButton
              key={dozen}
              value={dozen}
              isSelected={selectedBet?.dozen?.dozen === dozen}
              publicKey={publicKey}
              onClick={() => {
                setSelectedBet(
                  selectedBet?.dozen?.dozen === dozen
                    ? null
                    : { dozen: { dozen } }
                );
              }}
            />
          ))}
        </div>
        {/* High, Even, Red, Black, Odd, Low */}
        <div className="flex justify-center border-x-2 border-b-2 border-white rounded-b-md w-full">
          {["low", "even", "red", "black", "odd", "high"].map((value) => {
            const selected =
              !!selectedBet &&
              (("red" in selectedBet && value === "red") ||
                ("black" in selectedBet && value === "black") ||
                ("even" in selectedBet && value === "even") ||
                ("odd" in selectedBet && value === "odd") ||
                ("low" in selectedBet && value === "low") ||
                ("high" in selectedBet && value === "high"));

            return (
              <BottomButton
                key={value}
                value={value}
                isSelected={selected}
                publicKey={publicKey}
                className={
                  value === "low"
                    ? "rounded-bl-sm"
                    : value === "high"
                    ? "rounded-br-sm"
                    : ""
                }
                onClick={() => {
                  let betType: BetType;
                  switch (value) {
                    case "red":
                      betType = { red: {} };
                      break;
                    case "black":
                      betType = { black: {} };
                      break;
                    case "even":
                      betType = { even: {} };
                      break;
                    case "odd":
                      betType = { odd: {} };
                      break;
                    case "low":
                      betType = { low: {} };
                      break;
                    case "high":
                      betType = { high: {} };
                      break;
                    default:
                      throw new Error("Invalid bet type.");
                  }

                  setSelectedBet(selected ? null : betType);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
