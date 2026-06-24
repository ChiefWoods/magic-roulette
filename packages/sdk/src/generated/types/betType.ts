import {
  fixCodecSize,
  getBytesCodec,
  getDiscriminatedUnionCodec,
  getStructCodec,
  getU8Codec,
  getUnitCodec,
} from "@solana/codecs";

export type BetType =
  | { __kind: "StraightUp"; number: number }
  | { __kind: "Split"; numbers: Uint8Array }
  | { __kind: "Street"; numbers: Uint8Array }
  | { __kind: "Corner"; numbers: Uint8Array }
  | { __kind: "FiveNumber" }
  | { __kind: "Line"; numbers: Uint8Array }
  | { __kind: "Column"; column: number }
  | { __kind: "Dozen"; dozen: number }
  | { __kind: "Red" }
  | { __kind: "Black" }
  | { __kind: "Even" }
  | { __kind: "Odd" }
  | { __kind: "High" }
  | { __kind: "Low" };

export const betTypeCodec = getDiscriminatedUnionCodec([
  ["StraightUp", getStructCodec([["number", getU8Codec()]])],
  ["Split", getStructCodec([["numbers", fixCodecSize(getBytesCodec(), 2)]])],
  ["Street", getStructCodec([["numbers", fixCodecSize(getBytesCodec(), 3)]])],
  ["Corner", getStructCodec([["numbers", fixCodecSize(getBytesCodec(), 4)]])],
  ["FiveNumber", getUnitCodec()],
  ["Line", getStructCodec([["numbers", fixCodecSize(getBytesCodec(), 6)]])],
  ["Column", getStructCodec([["column", getU8Codec()]])],
  ["Dozen", getStructCodec([["dozen", getU8Codec()]])],
  ["Red", getUnitCodec()],
  ["Black", getUnitCodec()],
  ["Even", getUnitCodec()],
  ["Odd", getUnitCodec()],
  ["High", getUnitCodec()],
  ["Low", getUnitCodec()],
]);

// Data Enum Helpers.
type GetDiscriminatedUnionVariant<
  TUnion,
  TDiscriminator extends keyof TUnion,
  TKind extends TUnion[TDiscriminator],
> = Extract<TUnion, Record<TDiscriminator, TKind>>;

type GetDiscriminatedUnionVariantContent<
  TUnion,
  TDiscriminator extends keyof TUnion,
  TKind extends TUnion[TDiscriminator],
> = Omit<GetDiscriminatedUnionVariant<TUnion, TDiscriminator, TKind>, TDiscriminator>;

export function betType(
  kind: "StraightUp",
  data: GetDiscriminatedUnionVariantContent<BetType, "__kind", "StraightUp">,
): GetDiscriminatedUnionVariant<BetType, "__kind", "StraightUp">;
export function betType(
  kind: "Split",
  data: GetDiscriminatedUnionVariantContent<BetType, "__kind", "Split">,
): GetDiscriminatedUnionVariant<BetType, "__kind", "Split">;
export function betType(
  kind: "Street",
  data: GetDiscriminatedUnionVariantContent<BetType, "__kind", "Street">,
): GetDiscriminatedUnionVariant<BetType, "__kind", "Street">;
export function betType(
  kind: "Corner",
  data: GetDiscriminatedUnionVariantContent<BetType, "__kind", "Corner">,
): GetDiscriminatedUnionVariant<BetType, "__kind", "Corner">;
export function betType(
  kind: "FiveNumber",
): GetDiscriminatedUnionVariant<BetType, "__kind", "FiveNumber">;
export function betType(
  kind: "Line",
  data: GetDiscriminatedUnionVariantContent<BetType, "__kind", "Line">,
): GetDiscriminatedUnionVariant<BetType, "__kind", "Line">;
export function betType(
  kind: "Column",
  data: GetDiscriminatedUnionVariantContent<BetType, "__kind", "Column">,
): GetDiscriminatedUnionVariant<BetType, "__kind", "Column">;
export function betType(
  kind: "Dozen",
  data: GetDiscriminatedUnionVariantContent<BetType, "__kind", "Dozen">,
): GetDiscriminatedUnionVariant<BetType, "__kind", "Dozen">;
export function betType(kind: "Red"): GetDiscriminatedUnionVariant<BetType, "__kind", "Red">;
export function betType(kind: "Black"): GetDiscriminatedUnionVariant<BetType, "__kind", "Black">;
export function betType(kind: "Even"): GetDiscriminatedUnionVariant<BetType, "__kind", "Even">;
export function betType(kind: "Odd"): GetDiscriminatedUnionVariant<BetType, "__kind", "Odd">;
export function betType(kind: "High"): GetDiscriminatedUnionVariant<BetType, "__kind", "High">;
export function betType(kind: "Low"): GetDiscriminatedUnionVariant<BetType, "__kind", "Low">;
export function betType<K extends BetType["__kind"], Data>(kind: K, data?: Data) {
  if (Array.isArray(data)) {
    return { __kind: kind, fields: data };
  }
  return { __kind: kind, ...(data ?? {}) };
}

export function isBetType<K extends BetType["__kind"]>(
  kind: K,
  value: BetType,
): value is BetType & { __kind: K } {
  return value.__kind === kind;
}
