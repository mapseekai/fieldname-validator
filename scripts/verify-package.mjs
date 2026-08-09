import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const esm = await import("../dist/index.js");
const require = createRequire(import.meta.url);
const cjs = require("../dist/index.cjs");

for (const moduleNamespace of [esm, cjs]) {
  for (const exportName of [
    "validateFieldName",
    "isValidFieldName",
    "getFieldNameRules",
  ]) {
    if (typeof moduleNamespace[exportName] !== "function") {
      throw new Error(`Missing ${exportName} from package output`);
    }
  }
}

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
if (Object.keys(packageJson.dependencies ?? {}).length !== 0) {
  throw new Error("Published package must not declare runtime dependencies");
}

verifyExternalTypeConsumers();

function verifyExternalTypeConsumers() {
  const consumerDirectory = mkdtempSync(join(tmpdir(), "fieldname-validator-types-"));
  const packageDirectory = join(
    consumerDirectory,
    "node_modules",
    packageJson.name,
  );

  try {
    mkdirSync(packageDirectory, { recursive: true });
    copyFileSync(
      new URL("../package.json", import.meta.url),
      join(packageDirectory, "package.json"),
    );
    cpSync(new URL("../dist/", import.meta.url), join(packageDirectory, "dist"), {
      recursive: true,
    });

    for (const extension of ["mts", "cts"]) {
      const consumerPath = join(consumerDirectory, `consumer.${extension}`);
      writeFileSync(
        consumerPath,
        [
          `import { validateFieldName } from "${packageJson.name}";`,
          'const result = validateFieldName("field_name", "sqlite");',
          'if (!result.valid) throw new Error("expected a valid field name");',
          "",
        ].join("\n"),
      );

      const result = spawnSync(
        process.execPath,
        [
          fileURLToPath(
            new URL("../node_modules/typescript/bin/tsc", import.meta.url),
          ),
          "--noEmit",
          "--module",
          "Node16",
          "--moduleResolution",
          "Node16",
          "--target",
          "ES2020",
          "--skipLibCheck",
          consumerPath,
        ],
        { cwd: consumerDirectory, encoding: "utf8" },
      );

      if (result.error || result.status !== 0) {
        const output = [result.stdout, result.stderr]
          .filter(Boolean)
          .join("\n");
        throw new Error(
          `Type-check failed for an external ${extension.toUpperCase()} consumer.\n${
            result.error?.message ?? output
          }`,
        );
      }
    }
  } finally {
    rmSync(consumerDirectory, { recursive: true, force: true });
  }
}
