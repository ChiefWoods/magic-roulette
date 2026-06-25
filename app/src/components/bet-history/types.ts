export type BetHistoryRecord = {
  publicKey: string;
  round: string;
  amount: string;
  betType: string;
  outcome: number;
  hasWon: boolean;
  claimable: boolean;
  payout: string;
};

export enum FilterValue {
  All = "all",
  Won = "won",
  Lost = "lost",
  Claimable = "claimable",
}

export const filterOptions: { value: FilterValue; label: string }[] = [
  { value: FilterValue.All, label: "All" },
  { value: FilterValue.Won, label: "Won" },
  { value: FilterValue.Lost, label: "Lost" },
  { value: FilterValue.Claimable, label: "Claimable" },
];
