"use client";

import { BetType } from "@/types/accounts";
import { useMemo, useState } from "react";

export function useSelectedBet() {
  const [selectedBet, setSelectedBet] = useState<BetType | null>(null);

  const formattedBet = useMemo(() => {
    if (!selectedBet) return "";

    if ("straightUp" in selectedBet) {
      const number = selectedBet.straightUp?.number;
      return `Straight: ${number === 37 ? "00" : number}`;
    } else if ("split" in selectedBet) {
      return `Split: ${selectedBet.split?.numbers.join("-")}`;
    } else if ("street" in selectedBet) {
      return `Street: ${selectedBet.street?.numbers.join("-")}`;
    } else if ("corner" in selectedBet) {
      return `Corner: ${selectedBet.corner?.numbers.join("-")}`;
    } else if ("fiveNumber" in selectedBet) {
      return "Five Number";
    } else if ("line" in selectedBet) {
      return `Line: ${selectedBet.line?.numbers.join("-")}`;
    } else if ("column" in selectedBet) {
      return `Column: ${selectedBet.column?.column}`;
    } else if ("dozen" in selectedBet) {
      return `Dozen: ${selectedBet.dozen?.dozen}`;
    } else if ("red" in selectedBet) {
      return "Red";
    } else if ("black" in selectedBet) {
      return "Black";
    } else if ("even" in selectedBet) {
      return "Even";
    } else if ("odd" in selectedBet) {
      return "Odd";
    } else if ("high" in selectedBet) {
      return "High";
    } else if ("low" in selectedBet) {
      return "Low";
    } else {
      throw new Error("Invalid bet type.");
    }
  }, [selectedBet]);

  return { selectedBet, setSelectedBet, formattedBet };
}
