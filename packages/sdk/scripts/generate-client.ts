import { rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import { renderVisitor } from "@pratikbuilds/web3js-legacy";
import { PublicKey } from "@solana/web3.js";
import {
  addPdasVisitor,
  assertIsNode,
  bottomUpTransformerVisitor,
  constantPdaSeedNodeFromString,
  createFromRoot,
  getCommonInstructionAccountDefaultRules,
  numberTypeNode,
  programNode,
  publicKeyValueNode,
  setInstructionAccountDefaultValuesVisitor,
  updateInstructionsVisitor,
  variablePdaSeedNode,
} from "codama";
import { format } from "oxfmt";

import oxfmtConfig from "../oxfmt.config.ts";

const sdkRoot = `${import.meta.dir}/..`;
const anchorIdlPath = `${sdkRoot}/src/idl/anchor/magic-roulette.json`;
const codamaIdlPath = `${sdkRoot}/src/idl/codama/magic-roulette.json`;
const generatedPath = `${sdkRoot}/src/generated`;

type AnchorConstant = { name: string };

type CodamaBytesValueNode = {
  kind: "bytesValueNode";
  data: string;
  encoding: "base16" | "base58" | "utf8";
};

type CodamaNumberValueNode = {
  kind: "numberValueNode";
  number: number;
};

type CodamaConstant = {
  kind: "constantNode";
  name: string;
  value: CodamaBytesValueNode | CodamaNumberValueNode;
};

function preserveAnchorConstantNamesVisitor(anchorConstants: readonly AnchorConstant[]) {
  const anchorNames = anchorConstants.map((constant) => constant.name);
  let constantIndex = 0;

  return bottomUpTransformerVisitor([
    {
      select: "[constantNode]",
      transform: (node) => {
        assertIsNode(node, "constantNode");
        const anchorName = anchorNames[constantIndex];
        constantIndex += 1;
        if (anchorName === undefined) return node;
        return Object.freeze({ ...node, name: anchorName as typeof node.name });
      },
    },
  ]);
}

const MAGIC_ROULETTE_PROGRAM = "magicRoulette";

const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const ASSOCIATED_TOKEN_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
const ORACLE_QUEUE_ID = "Cuj97ggrhhidhbu39TijNVqE74xvKJ69gDervRUXAxGh";
const VRF_PROGRAM_ID = "Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz";
const SLOT_HASHES_SYSVAR_ID = "SysvarS1otHashes111111111111111111111111111";

function deriveGenesisRoundPda(programId: PublicKey): string {
  const roundNumberBuffer = Buffer.alloc(8);
  // round number of first round is hardcoded to 1
  roundNumberBuffer.writeBigUInt64LE(1n);
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from("round", "utf8"), roundNumberBuffer],
    programId,
  );
  return address.toBase58();
}

function createIdlTransforms(initializeTableGenesisRoundPda: string) {
  return [
    setInstructionAccountDefaultValuesVisitor([
      ...getCommonInstructionAccountDefaultRules(),
      {
        account: /^oracleQueue$/,
        defaultValue: publicKeyValueNode(ORACLE_QUEUE_ID, "oracleQueue"),
      },
      {
        account: /^vrfProgram$/,
        defaultValue: publicKeyValueNode(VRF_PROGRAM_ID, "vrfProgram"),
      },
      {
        account: /^slotHashes$/,
        defaultValue: publicKeyValueNode(SLOT_HASHES_SYSVAR_ID, "slotHashes"),
      },
    ]),
    // remove default round visitor
    bottomUpTransformerVisitor([
      {
        select: `[programNode]${MAGIC_ROULETTE_PROGRAM}`,
        transform: (node) => {
          assertIsNode(node, "programNode");
          return programNode({
            ...node,
            pdas: node.pdas.filter((pda) => pda.name !== "round"),
          });
        },
      },
    ]),
    // add custom round pda visitor
    addPdasVisitor({
      [MAGIC_ROULETTE_PROGRAM]: [
        {
          name: "round",
          seeds: [
            constantPdaSeedNodeFromString("utf8", "round"),
            variablePdaSeedNode("roundNumber", numberTypeNode("u64", "le")),
          ],
        },
      ],
    }),
    updateInstructionsVisitor({
      initializeTable: {
        accounts: {
          round: {
            defaultValue: publicKeyValueNode(initializeTableGenesisRoundPda),
          },
        },
      },
    }),
  ] as const;
}

const OPTIONAL_INSTRUCTION_ACCOUNT_DEFAULTS = [
  { name: "systemProgram", publicKey: SYSTEM_PROGRAM_ID },
  { name: "tokenProgram", publicKey: TOKEN_PROGRAM_ID },
  { name: "associatedTokenProgram", publicKey: ASSOCIATED_TOKEN_PROGRAM_ID },
  { name: "oracleQueue", publicKey: ORACLE_QUEUE_ID },
  { name: "vrfProgram", publicKey: VRF_PROGRAM_ID },
  { name: "slotHashes", publicKey: SLOT_HASHES_SYSVAR_ID },
] as const;

function patchInstructionAccountDefaults(source: string): string {
  const optionalAccounts = OPTIONAL_INSTRUCTION_ACCOUNT_DEFAULTS.filter(({ name }) =>
    source.includes(`${name}: PublicKey;`),
  );

  if (optionalAccounts.length === 0) {
    return source;
  }

  let patched = source;
  for (const { name } of optionalAccounts) {
    patched = patched.replace(`${name}: PublicKey;`, `${name}?: PublicKey;`);
  }

  const defaultLines = optionalAccounts.map(
    ({ name, publicKey }) => `  const ${name} = accounts.${name} ?? new PublicKey("${publicKey}");`,
  );

  patched = patched.replace(
    /(\): TransactionInstruction \{)\n/,
    `$1\n${defaultLines.join("\n")}\n`,
  );

  for (const { name } of optionalAccounts) {
    const assignmentPrefix = `const ${name} = accounts.${name}`;
    patched = patched
      .split("\n")
      .map((line) => {
        if (line.includes(assignmentPrefix)) return line;
        return line.replaceAll(`accounts.${name}`, name);
      })
      .join("\n");
  }

  return patched;
}

function renderProgramConstant(constant: CodamaConstant): string {
  const { name, value } = constant;

  if (value.kind === "numberValueNode") {
    return `export const ${name} = ${value.number};`;
  }

  if (value.kind !== "bytesValueNode") {
    throw new Error(`Unsupported constant value kind for ${name}`);
  }

  const bytes =
    value.encoding === "base16"
      ? Buffer.from(value.data, "hex")
      : value.encoding === "utf8"
        ? Buffer.from(value.data, "utf8")
        : (() => {
            throw new Error(`Unsupported bytes encoding "${value.encoding}" for ${name}`);
          })();
  const text = bytes.toString("utf8");
  const isPrintableAscii = [...bytes].every((byte) => byte >= 32 && byte <= 126);

  if (isPrintableAscii) {
    return `export const ${name} = Buffer.from(${JSON.stringify(text)}, "utf8");`;
  }

  return `export const ${name} = Buffer.from(${JSON.stringify([...bytes])});`;
}

function generateProgramConstantsSource(constants: readonly CodamaConstant[]): string {
  return `${constants.map(renderProgramConstant).join("\n")}\n`;
}

async function generateProgramConstants(
  directory: string,
  constants: readonly CodamaConstant[],
): Promise<void> {
  if (constants.length === 0) return;
  await Bun.write(`${directory}/constants.ts`, generateProgramConstantsSource(constants));
}

function patchGeneratedIndex(source: string): string {
  if (source.includes('export * from "./constants"')) return source;

  const firstReexportIndex = source.indexOf('export * from "./accounts/');
  if (firstReexportIndex === -1) {
    return `${source.trimEnd()}\n\nexport * from "./constants";\n`;
  }

  return `${source.slice(0, firstReexportIndex)}export * from "./constants";\n${source.slice(firstReexportIndex)}`;
}

function patchInitializeTableGenesisRound(source: string, genesisRoundPda: string): string {
  // Genesis round is always 1 on-chain; the IDL records a publicKeyValueNode default,
  // but web3js-legacy does not emit publicKeyValueNode account defaults.
  const pubkeyExpr = `new PublicKey("${genesisRoundPda}")`;
  if (source.includes(`accounts.round ?? ${pubkeyExpr}`)) return source;

  let patched = source.replace("round: PublicKey;", "round?: PublicKey;");

  patched = patched.replace(
    /let round = accounts\.round;\s*\n\s*if \(!round\) \{\s*\n\s*const \[derived\] = findRoundPda\([^)]+\);\s*\n\s*round = derived;\s*\n\s*\}/,
    `let round = accounts.round ?? ${pubkeyExpr};`,
  );

  if (!patched.includes("let round = accounts.round")) {
    patched = patched.replace(
      /(\n  const keys: AccountMeta\[\] = \[)/,
      `\n  let round = accounts.round ?? ${pubkeyExpr};$1`,
    );
    patched = patched.replace(
      "{ pubkey: accounts.round, isSigner: false, isWritable: true }",
      "{ pubkey: round, isSigner: false, isWritable: true }",
    );
  }

  if (!patched.includes("findRoundPda")) {
    patched = patched.replace(/import \{ findRoundPda \} from "\.\.\/pdas\/round";\n/, "");
  }

  return patched;
}

function patchGeneratedSource(
  source: string,
  relativePath?: string,
  initializeTableGenesisRoundPda?: string,
): string {
  let patched = patchInstructionAccountDefaults(source);

  // initializeTable always creates round 1; inject the pre-derived genesis PDA.
  if (
    relativePath?.endsWith("instructions/initializeTable.ts") &&
    initializeTableGenesisRoundPda !== undefined
  ) {
    patched = patchInitializeTableGenesisRound(patched, initializeTableGenesisRoundPda);
  }

  // allow consumers to add RPC filters without losing the generated account discriminator
  if (patched.includes("export async function fetchProgramAccounts")) {
    patched = patched.replace(
      'import { Connection, PublicKey } from "@solana/web3.js";',
      'import { Connection, GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";',
    );
    patched = patched.replace(
      'options?: { commitment?: "processed" | "confirmed" | "finalized" },',
      'options?: {\n    commitment?: "processed" | "confirmed" | "finalized";\n    filters?: GetProgramAccountsFilter[];\n  },',
    );
    patched = patched.replace(
      /filters: \[(\{ memcmp: \{ offset: 0, bytes: "[^"]+" \} \})\],/,
      "filters: [$1, ...(options?.filters ?? [])],",
    );
  }

  const resolvedAccountNames = [...patched.matchAll(/let (\w+) = accounts\.\1;/g)].map(
    (match) => match[1],
  );
  for (const accountName of resolvedAccountNames) {
    patched = patched.replaceAll(`${accountName}: accounts.${accountName},`, `${accountName},`);
  }

  // patch i64 seed incorrectly parsed as 1 byte
  if (patched.includes("Buffer.from([seeds.timestamp])")) {
    patched = patched.replace(/^(\s*)const seedsBuffer: Buffer\[\] = \[/m, (_, indent: string) =>
      [
        `${indent}const timestampBuffer = Buffer.alloc(8);`,
        `${indent}timestampBuffer.writeBigInt64LE(seeds.timestamp);`,
        `${indent}const seedsBuffer: Buffer[] = [`,
      ].join("\n"),
    );
    patched = patched.replace("Buffer.from([seeds.timestamp])", "timestampBuffer");
  }

  // patch addresses[index] being undefined
  if (patched.includes("getMultipleAccountsInfo(addresses)")) {
    patched = patched.replaceAll("address: addresses[index],", "address: addresses[index]!,");
    patched = patched.replaceAll("[addresses[i].toBase58()]", "[addresses[i]!.toBase58()]");
  }

  return patched;
}

async function patchGeneratedClient(
  directory: string,
  initializeTableGenesisRoundPda: string,
): Promise<void> {
  const glob = new Bun.Glob("**/*.ts");
  for await (const relativePath of glob.scan({ cwd: directory, onlyFiles: true })) {
    const path = `${directory}/${relativePath}`;
    const source = await Bun.file(path).text();
    const patched = patchGeneratedSource(source, relativePath, initializeTableGenesisRoundPda);
    if (patched !== source) await Bun.write(path, patched);
  }
}

async function formatFile(absolutePath: string): Promise<void> {
  const relativePath = absolutePath.replace(`${sdkRoot}/`, "");
  const source = await Bun.file(absolutePath).text();
  const { code, errors } = await format(relativePath, source, oxfmtConfig);
  if (errors.length > 0) {
    throw new Error(`oxfmt failed on ${relativePath}: ${errors[0]?.message}`);
  }
  if (code !== source) {
    await Bun.write(absolutePath, code);
  }
}

async function formatGeneratedClient(directory: string): Promise<void> {
  const glob = new Bun.Glob("**/*.ts");
  for await (const relativePath of glob.scan({ cwd: directory, onlyFiles: true })) {
    await formatFile(`${directory}/${relativePath}`);
  }
}

const anchorIdlFile = Bun.file(anchorIdlPath);
if (!(await anchorIdlFile.exists())) {
  throw new Error(`Failed to load IDL: ${anchorIdlPath} does not exist`);
}

const anchorIdl = await anchorIdlFile.json();
const programId = new PublicKey((anchorIdl as { address: string }).address);
const initializeTableGenesisRoundPda = deriveGenesisRoundPda(programId);
const codama = createFromRoot(rootNodeFromAnchor(anchorIdl));

const anchorConstants = (anchorIdl as { constants?: AnchorConstant[] }).constants ?? [];
const transforms = [
  ...createIdlTransforms(initializeTableGenesisRoundPda),
  preserveAnchorConstantNamesVisitor(anchorConstants),
];

for (const transform of transforms) {
  codama.update(transform);
}

await Bun.write(codamaIdlPath, codama.getJson());

await codama.accept(
  renderVisitor(generatedPath, {
    deleteFolderBeforeRendering: true,
  }),
);

// manual patches that visitors cannot fix
const programConstants = codama.getRoot().program.constants as CodamaConstant[];
await generateProgramConstants(generatedPath, programConstants);
await patchGeneratedClient(generatedPath, initializeTableGenesisRoundPda);

const generatedIndexPath = `${generatedPath}/index.ts`;
const generatedIndexSource = await Bun.file(generatedIndexPath).text();
const patchedGeneratedIndex = patchGeneratedIndex(generatedIndexSource);
if (patchedGeneratedIndex !== generatedIndexSource) {
  await Bun.write(generatedIndexPath, patchedGeneratedIndex);
}

await formatFile(codamaIdlPath);
await formatGeneratedClient(generatedPath);
