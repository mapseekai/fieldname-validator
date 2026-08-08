import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

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
