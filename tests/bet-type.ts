import { IdlTypes } from "@coral-xyz/anchor";
import { MagicRoulette } from "../target/types/magic_roulette";

type BetType = IdlTypes<MagicRoulette>["betType"];

// Red numbers in American roulette
const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

// Black numbers in American roulette
const BLACK_NUMBERS = [
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
];

/**
 * Check if a bet type wins for a given outcome
 * @param betType - The bet type to check
 * @param outcome - The outcome number (0-36, or 37 for 00)
 * @returns true if the bet wins, false otherwise
 */
export function isWinner(betType: BetType, outcome: number): boolean {
  if ("straightUp" in betType) {
    return betType.straightUp.number === outcome;
  }

  if ("split" in betType) {
    return betType.split.numbers.includes(outcome);
  }

  if ("street" in betType) {
    return betType.street.numbers.includes(outcome);
  }

  if ("corner" in betType) {
    return betType.corner.numbers.includes(outcome);
  }

  if ("fiveNumber" in betType) {
    // Five number bet: 0, 00 (37), 1, 2, 3
    return [0, 1, 2, 3, 37].includes(outcome);
  }

  if ("line" in betType) {
    return betType.line.numbers.includes(outcome);
  }

  if ("column" in betType) {
    // 0 and 37 (00) are not in any column
    if (outcome === 0 || outcome === 37) {
      return false;
    }
    const outcomeColumn = ((outcome - 1) % 3) + 1;
    return outcomeColumn === betType.column.column;
  }

  if ("dozen" in betType) {
    // 0 and 37 (00) are not in any dozen
    if (outcome >= 1 && outcome <= 12) {
      return betType.dozen.dozen === 1;
    }
    if (outcome >= 13 && outcome <= 24) {
      return betType.dozen.dozen === 2;
    }
    if (outcome >= 25 && outcome <= 36) {
      return betType.dozen.dozen === 3;
    }
    return false;
  }

  if ("red" in betType) {
    return RED_NUMBERS.includes(outcome);
  }

  if ("black" in betType) {
    return BLACK_NUMBERS.includes(outcome);
  }

  if ("even" in betType) {
    // Even numbers (1-36 only, 0 and 00 don't count)
    return outcome > 0 && outcome <= 36 && outcome % 2 === 0;
  }

  if ("odd" in betType) {
    // Odd numbers (1-36 only)
    return outcome > 0 && outcome <= 36 && outcome % 2 === 1;
  }

  if ("high" in betType) {
    // High: 19-36
    return outcome >= 19 && outcome <= 36;
  }

  if ("low" in betType) {
    // Low: 1-18
    return outcome >= 1 && outcome <= 18;
  }

  return false;
}
