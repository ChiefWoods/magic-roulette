import { betType, type BetType } from "./generated/types/betType";

// Parsed bet type (number[] instead of Uint8Array) for API / client state.
export type ParsedBetType =
  | { __kind: "StraightUp"; number: number }
  | { __kind: "Split"; numbers: number[] }
  | { __kind: "Street"; numbers: number[] }
  | { __kind: "Corner"; numbers: number[] }
  | { __kind: "FiveNumber" }
  | { __kind: "Line"; numbers: number[] }
  | { __kind: "Column"; column: number }
  | { __kind: "Dozen"; dozen: number }
  | { __kind: "Red" }
  | { __kind: "Black" }
  | { __kind: "Even" }
  | { __kind: "Odd" }
  | { __kind: "High" }
  | { __kind: "Low" };

export type BetTypeInput = BetType | ParsedBetType;

// Red numbers in American roulette
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Black numbers in American roulette
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

function numbersInclude(numbers: Uint8Array | number[] | undefined, outcome: number): boolean {
  if (!numbers) {
    return false;
  }

  return numbers instanceof Uint8Array ? [...numbers].includes(outcome) : numbers.includes(outcome);
}

/**
 * Check if a bet type wins for a given outcome.
 * @param betType - SDK or JSON-safe bet type
 * @param outcome - The outcome number (0-36, or 37 for 00)
 */
export function isWinner(betType: BetTypeInput, outcome: number | null): boolean {
  if (outcome === null) {
    return false;
  }

  switch (betType.__kind) {
    case "StraightUp":
      return betType.number === outcome;
    case "Split":
    case "Street":
    case "Corner":
    case "Line":
      return numbersInclude(betType.numbers, outcome);
    case "FiveNumber":
      // Five number bet: 0, 00 (37), 1, 2, 3
      return [0, 1, 2, 3, 37].includes(outcome);
    case "Column":
      // 0 and 37 (00) are not in any column
      if (outcome === 0 || outcome === 37) {
        return false;
      }
      return ((outcome - 1) % 3) + 1 === betType.column;
    case "Dozen":
      // 0 and 37 (00) are not in any dozen
      if (outcome >= 1 && outcome <= 12) {
        return betType.dozen === 1;
      }
      if (outcome >= 13 && outcome <= 24) {
        return betType.dozen === 2;
      }
      if (outcome >= 25 && outcome <= 36) {
        return betType.dozen === 3;
      }
      return false;
    case "Red":
      return RED_NUMBERS.includes(outcome);
    case "Black":
      return BLACK_NUMBERS.includes(outcome);
    case "Even":
      // Even numbers (1-36 only, 0 and 00 don't count)
      return outcome > 0 && outcome <= 36 && outcome % 2 === 0;
    case "Odd":
      // Odd numbers (1-36 only)
      return outcome > 0 && outcome <= 36 && outcome % 2 === 1;
    case "High":
      // High: 19-36
      return outcome >= 19 && outcome <= 36;
    case "Low":
      // Low: 1-18
      return outcome >= 1 && outcome <= 18;
    default:
      return false;
  }
}

export function payoutMultiplier(betType: BetTypeInput): number {
  switch (betType.__kind) {
    case "StraightUp":
      return 35;
    case "Split":
      return 17;
    case "Street":
      return 11;
    case "Corner":
      return 8;
    case "FiveNumber":
      return 6;
    case "Line":
      return 5;
    case "Column":
      return 2;
    case "Dozen":
      return 2;
    case "Red":
    case "Black":
    case "Even":
    case "Odd":
    case "High":
    case "Low":
      return 1;
    default:
      throw new Error("Invalid bet type.");
  }
}

export function parseBetType(bet: BetType): ParsedBetType {
  switch (bet.__kind) {
    case "StraightUp":
      return { __kind: "StraightUp", number: bet.number };
    case "Split":
      return { __kind: "Split", numbers: [...bet.numbers] };
    case "Street":
      return { __kind: "Street", numbers: [...bet.numbers] };
    case "Corner":
      return { __kind: "Corner", numbers: [...bet.numbers] };
    case "FiveNumber":
      return { __kind: "FiveNumber" };
    case "Line":
      return { __kind: "Line", numbers: [...bet.numbers] };
    case "Column":
      return { __kind: "Column", column: bet.column };
    case "Dozen":
      return { __kind: "Dozen", dozen: bet.dozen };
    case "Red":
      return { __kind: "Red" };
    case "Black":
      return { __kind: "Black" };
    case "Even":
      return { __kind: "Even" };
    case "Odd":
      return { __kind: "Odd" };
    case "High":
      return { __kind: "High" };
    case "Low":
      return { __kind: "Low" };
  }
}

export function toSdkBetType(bet: ParsedBetType): BetType {
  switch (bet.__kind) {
    case "StraightUp":
      return betType("StraightUp", { number: bet.number });
    case "Split":
      return betType("Split", { numbers: new Uint8Array(bet.numbers) });
    case "Street":
      return betType("Street", { numbers: new Uint8Array(bet.numbers) });
    case "Corner":
      return betType("Corner", { numbers: new Uint8Array(bet.numbers) });
    case "FiveNumber":
      return betType("FiveNumber");
    case "Line":
      return betType("Line", { numbers: new Uint8Array(bet.numbers) });
    case "Column":
      return betType("Column", { column: bet.column });
    case "Dozen":
      return betType("Dozen", { dozen: bet.dozen });
    case "Red":
      return betType("Red");
    case "Black":
      return betType("Black");
    case "Even":
      return betType("Even");
    case "Odd":
      return betType("Odd");
    case "High":
      return betType("High");
    case "Low":
      return betType("Low");
  }
}

export function formatBetType(betType: ParsedBetType): string {
  switch (betType.__kind) {
    case "StraightUp":
      return `Straight: ${betType.number === 37 ? "00" : betType.number}`;
    case "Split":
      return `Split: ${betType.numbers.join("-")}`;
    case "Street":
      return `Street: ${betType.numbers.join("-")}`;
    case "Corner":
      return `Corner: ${betType.numbers.join("-")}`;
    case "FiveNumber":
      return "Five Number";
    case "Line":
      return `Line: ${betType.numbers.join("-")}`;
    case "Column":
      return `Column: ${betType.column}`;
    case "Dozen":
      return `Dozen: ${betType.dozen}`;
    case "Red":
      return "Red";
    case "Black":
      return "Black";
    case "Even":
      return "Even";
    case "Odd":
      return "Odd";
    case "High":
      return "High";
    case "Low":
      return "Low";
    default:
      throw new Error("Invalid bet type.");
  }
}

export function isStraightUpSelected(bet: ParsedBetType | null, number: number): boolean {
  return bet?.__kind === "StraightUp" && bet.number === number;
}

export function isFiveNumberSelected(bet: ParsedBetType | null): boolean {
  return bet?.__kind === "FiveNumber";
}

export function isColumnSelected(bet: ParsedBetType | null, column: number): boolean {
  return bet?.__kind === "Column" && bet.column === column;
}

export function isDozenSelected(bet: ParsedBetType | null, dozen: number): boolean {
  return bet?.__kind === "Dozen" && bet.dozen === dozen;
}

export function isOutsideBetSelected(
  bet: ParsedBetType | null,
  kind: ParsedBetType["__kind"],
): boolean {
  return bet?.__kind === kind;
}

export function hasNumbersSelected(
  bet: ParsedBetType | null,
  kind: "Split" | "Street" | "Corner" | "Line",
  numbers: number[],
): boolean {
  if (!bet || bet.__kind !== kind) {
    return false;
  }

  return numbers.length === bet.numbers.length && numbers.every((n) => bet.numbers.includes(n));
}
