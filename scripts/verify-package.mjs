import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const expectedRuntimeExports = [
  "getFieldNameRules",
  "isValidFieldName",
  "validateFieldName",
];
const expectedArtifacts = [
  "dist/index.cjs",
  "dist/index.d.cts",
  "dist/index.d.ts",
  "dist/index.js",
];

if (
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  verifyPackage();
}

function verifyPackage() {
  const packageDirectory = fileURLToPath(new URL("..", import.meta.url));
  const packageJson = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  const temporaryDirectory = mkdtempSync(
    join(tmpdir(), "fieldname-validator-package-"),
  );

  try {
    assertNoDependencyChannels(packageJson, "source package.json");

    const packResult = run(
      npmCommand(),
      [
        "pack",
        "--json",
        "--cache",
        join(temporaryDirectory, "npm-cache"),
        "--pack-destination",
        temporaryDirectory,
      ],
      packageDirectory,
    );
    const packReport = parsePackReport(packResult.stdout);
    const packedFiles = new Set(packReport.files.map(({ path }) => path));

    for (const artifact of expectedArtifacts) {
      if (!packedFiles.has(artifact)) {
        throw new Error(`Packed tarball is missing ${artifact}`);
      }
    }

    writeFileSync(
      join(temporaryDirectory, "package.json"),
      JSON.stringify({ name: "fieldname-validator-consumer", private: true }),
    );

    const tarballPath = join(temporaryDirectory, packReport.filename);
    run(
      npmCommand(),
      [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--package-lock=false",
        "--cache",
        join(temporaryDirectory, "npm-cache"),
        tarballPath,
      ],
      temporaryDirectory,
    );

    const installedPackageJson = JSON.parse(
      readFileSync(
        join(
          temporaryDirectory,
          "node_modules",
          packageJson.name,
          "package.json",
        ),
        "utf8",
      ),
    );
    assertNoDependencyChannels(installedPackageJson, "installed package.json");

    writeFileSync(
      join(temporaryDirectory, "consumer.mjs"),
      runtimeConsumerSource(
        `import * as packageNamespace from ${JSON.stringify(packageJson.name)};`,
      ),
    );
    writeFileSync(
      join(temporaryDirectory, "consumer.cjs"),
      runtimeConsumerSource(
        `const packageNamespace = require(${JSON.stringify(packageJson.name)});`,
      ),
    );

    run(process.execPath, ["consumer.mjs"], temporaryDirectory);
    run(process.execPath, ["consumer.cjs"], temporaryDirectory);

    for (const extension of ["mts", "cts"]) {
      const consumerPath = join(temporaryDirectory, `consumer.${extension}`);
      writeFileSync(consumerPath, typeConsumerSource(packageJson.name));
      run(
        process.execPath,
        [
          fileURLToPath(
            new URL("../node_modules/typescript/bin/tsc", import.meta.url),
          ),
          "--noEmit",
          "--strict",
          "--module",
          "Node16",
          "--moduleResolution",
          "Node16",
          "--target",
          "ES2020",
          consumerPath,
        ],
        temporaryDirectory,
      );
    }

    console.log(
      `Verified ${packReport.filename}: ${expectedArtifacts.length} entry artifacts, exact ESM/CJS exports, zero dependency channels, and strict MTS/CTS consumers.`,
    );
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

export function assertNoDependencyChannels(manifest, label) {
  for (const channel of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    if (Object.keys(manifest[channel] ?? {}).length !== 0) {
      throw new Error(`${label} must have zero ${channel}`);
    }
  }

  for (const channel of ["bundledDependencies", "bundleDependencies"]) {
    const dependencies = manifest[channel];
    if (dependencies === undefined || dependencies === false) {
      continue;
    }
    if (!Array.isArray(dependencies)) {
      throw new Error(
        `${label} must define ${channel} as an empty array or false`,
      );
    }
    if (dependencies.length !== 0) {
      throw new Error(`${label} must have zero ${channel}`);
    }
  }
}

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function parsePackReport(stdout) {
  let report;
  try {
    const jsonStart = stdout.lastIndexOf("\n[");
    report = JSON.parse(jsonStart === -1 ? stdout : stdout.slice(jsonStart + 1));
  } catch (error) {
    throw new Error(`npm pack did not return valid JSON: ${error.message}`);
  }

  if (
    !Array.isArray(report) ||
    report.length !== 1 ||
    typeof report[0]?.filename !== "string" ||
    !Array.isArray(report[0]?.files)
  ) {
    throw new Error("npm pack returned an unexpected report shape");
  }

  return report[0];
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.error || result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(
      `${command} ${args.join(" ")} failed.\n${result.error?.message ?? output}`,
    );
  }
  return result;
}

function runtimeConsumerSource(importStatement) {
  return `${importStatement}

const expectedExports = ${JSON.stringify(expectedRuntimeExports)};
const actualExports = Object.keys(packageNamespace).sort();
if (JSON.stringify(actualExports) !== JSON.stringify(expectedExports)) {
  throw new Error(\`Unexpected runtime exports: \${actualExports.join(", ")}\`);
}

const validation = packageNamespace.validateFieldName("field_name", "sqlite");
if (!validation.valid) throw new Error("validateFieldName rejected a valid name");
if (!packageNamespace.isValidFieldName("field_name", "sqlite")) {
  throw new Error("isValidFieldName rejected a valid name");
}
if (packageNamespace.getFieldNameRules("sqlite").format !== "sqlite") {
  throw new Error("getFieldNameRules returned the wrong profile");
}
`;
}

function typeConsumerSource(packageName) {
  return `import {
  getFieldNameRules,
  isValidFieldName,
  validateFieldName,
} from "${packageName}";
import type {
  FieldNameFormat,
  FieldNameIssue,
  FieldNameIssueCode,
  FieldNameRuleInfo,
  FieldNameRules,
  FieldNameValidationResult,
  RuleSource,
} from "${packageName}";

const format: FieldNameFormat = "sqlite";
const validation: FieldNameValidationResult = validateFieldName(
  "field_name",
  format,
);
const valid: boolean = isValidFieldName("field_name", format);
const rules: FieldNameRules = getFieldNameRules(format);
const code: FieldNameIssueCode = "EMPTY_NAME";
const issue: FieldNameIssue = validateFieldName("", format).errors[0]!;
const rule: FieldNameRuleInfo = rules.rules[0]!;
const source: RuleSource = rule.sources[0] ?? {
  title: "Consumer fallback",
  url: "https://example.com/consumer-fallback",
  version: "1",
};

void [validation, valid, rules, code, issue, rule, source];
`;
}
